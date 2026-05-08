import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { Role, StudentStatus } from "@prisma/client";
import { RegisterRequest, LoginRequest, JWTPayload } from "../types";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// ── Return types ──────────────────────────────────────────

export interface RegisterResult {
  userId: number;
  username: string;
  status: StudentStatus;
  track: string;
  message: string;
}

export interface LoginResult {
  token: string;
  user: {
    id: number;
    username: string;
    fullName: string;
    role: string;
    status: StudentStatus;
    trackId: number | null;
    track: { id: number; name: string } | null;
  };
}

// ── Register ──────────────────────────────────────────────

/**
 * Phase 2 registration:
 * - Public registration is STUDENT only
 * - Requires a valid, active, non-full track
 * - Account defaults to PENDING_APPROVAL — supervisor must approve before login
 */
export async function registerUser(
  data: RegisterRequest,
): Promise<RegisterResult> {
  const { username, email, password, fullName, trackId } = data;
  const numericTrackId = parseInt(trackId.toString(), 10);

  // ── Validate track ──────────────────────────────────────
  const track = await prisma.track.findUnique({
    where: { id: numericTrackId },
    include: {
      _count: {
        select: {
          members: {
            where: { role: Role.STUDENT, status: StudentStatus.ACTIVE },
          },
        },
      },
    },
  });

  if (!track) {
    const err = new Error("Track not found");
    (err as any).statusCode = 400;
    throw err;
  }

  if (!track.isActive) {
    const err = new Error("This track is not currently accepting registrations");
    (err as any).statusCode = 400;
    throw err;
  }

  if (track.maxStudents && track._count.members >= track.maxStudents) {
    const err = new Error("Track is full");
    (err as any).statusCode = 409;
    (err as any).data = {
      maxStudents: track.maxStudents,
      currentCount: track._count.members,
    };
    throw err;
  }

  // ── Uniqueness check ────────────────────────────────────
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() },
      ],
    },
  });

  if (existing) {
    const err = new Error("Username or email already exists");
    (err as any).statusCode = 400;
    throw err;
  }

  // ── Create student ──────────────────────────────────────
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash,
      fullName,
      role: Role.STUDENT,               // Always STUDENT for self-registration
      trackId: numericTrackId,
      status: StudentStatus.PENDING_APPROVAL, // Must be approved before logging in
    },
  });

  return {
    userId: user.id,
    username: user.username,
    status: user.status,
    track: track.name,
    message:
      "Registration submitted successfully. Your account is pending supervisor approval.",
  };
}

// ── Login ─────────────────────────────────────────────────

/**
 * Phase 2 login:
 * - PENDING students cannot log in (403 with status field for FE to handle)
 * - SUSPENDED students cannot log in
 * - Admin/Supervisor accounts bypass the student status check
 */
export async function loginUser(data: LoginRequest): Promise<LoginResult> {
  const { username, password } = data;

  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    include: { track: { select: { id: true, name: true } } },
  });

  if (!user) {
    const err = new Error("Invalid credentials");
    (err as any).statusCode = 401;
    throw err;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    const err = new Error("Invalid credentials");
    (err as any).statusCode = 401;
    throw err;
  }

  // ── Status gate (students only) ─────────────────────────
  if (user.role === Role.STUDENT) {
    if (user.status === StudentStatus.PENDING_APPROVAL) {
      const err = new Error(
        "Your registration is awaiting supervisor approval. Please try again later.",
      );
      (err as any).statusCode = 403;
      (err as any).data = { status: user.status, errorCode: "PENDING_APPROVAL" };
      throw err;
    }

    if (user.status === StudentStatus.SUSPENDED) {
      const err = new Error(
        "Your account has been suspended. Contact your supervisor for details.",
      );
      (err as any).statusCode = 403;
      (err as any).data = { status: user.status, errorCode: "SUSPENDED" };
      throw err;
    }

    if (user.status === StudentStatus.ARCHIVED) {
      const err = new Error("Your registration was not approved.");
      (err as any).statusCode = 403;
      (err as any).data = { status: user.status, errorCode: "ARCHIVED" };
      throw err;
    }
  }

  // ── Issue JWT ───────────────────────────────────────────
  const payload: JWTPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    trackId: user.trackId,
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      trackId: user.trackId,
      track: user.track,
    },
  };
}
