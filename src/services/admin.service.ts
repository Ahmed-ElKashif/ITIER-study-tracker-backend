import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";
import { Role, StudentStatus } from "@prisma/client";

// ── Helpers ───────────────────────────────────────────────

function generateRandomPassword(): string {
  const words = ["Smart", "Quick", "Bright", "Swift", "Bold", "Clear", "Strong", "Wise"];
  const w1 = words[Math.floor(Math.random() * words.length)];
  const w2 = words[Math.floor(Math.random() * words.length)];
  return `${w1}${w2}${Math.floor(Math.random() * 100)}`;
}

// ── Supervisor Management ─────────────────────────────────

export async function createSupervisorAccount(email: string, fullName: string) {
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existing) {
    const err = new Error("Email already registered");
    (err as any).statusCode = 400;
    throw err;
  }

  const tempPassword = generateRandomPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const base = email.split("@")[0].toLowerCase();
  let username = base;
  let counter = 1;
  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${base}${counter++}`;
  }

  const supervisor = await prisma.user.create({
    data: {
      username,
      email: email.toLowerCase(),
      passwordHash,
      fullName,
      role: Role.SUPERVISOR,
      status: StudentStatus.ACTIVE,
      trackId: null,
    },
  });

  return {
    supervisor: {
      id: supervisor.id,
      username: supervisor.username,
      email: supervisor.email,
      fullName: supervisor.fullName,
      role: supervisor.role,
    },
    temporaryPassword: tempPassword, // NOTE: send via email in production
  };
}

export async function getAllSupervisorsData() {
  const supervisors = await prisma.user.findMany({
    where: { role: Role.SUPERVISOR },
    include: {
      track: {
        select: { id: true, name: true, _count: { select: { members: { where: { role: Role.STUDENT } } } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return supervisors.map((s) => ({
    id: s.id,
    username: s.username,
    email: s.email,
    fullName: s.fullName,
    status: s.status,
    track: s.track
      ? { id: s.track.id, name: s.track.name, studentCount: s.track._count.members }
      : null,
    createdAt: s.createdAt,
  }));
}

// ── Dashboard ─────────────────────────────────────────────

export async function getDashboardStats() {
  const [
    totalStudents, activeStudents, pendingStudents, suspendedStudents,
    totalSupervisors, totalTracks, activeTracks, totalHoursResult, totalEntries,
  ] = await Promise.all([
    prisma.user.count({ where: { role: Role.STUDENT } }),
    prisma.user.count({ where: { role: Role.STUDENT, status: StudentStatus.ACTIVE } }),
    prisma.user.count({ where: { role: Role.STUDENT, status: StudentStatus.PENDING_APPROVAL } }),
    prisma.user.count({ where: { role: Role.STUDENT, status: StudentStatus.SUSPENDED } }),
    prisma.user.count({ where: { role: Role.SUPERVISOR } }),
    prisma.track.count(),
    prisma.track.count({ where: { isActive: true } }),
    prisma.studyEntry.aggregate({ _sum: { hours: true } }),
    prisma.studyEntry.count(),
  ]);

  return {
    students: { total: totalStudents, active: activeStudents, pending: pendingStudents, suspended: suspendedStudents },
    supervisors: { total: totalSupervisors },
    tracks: { total: totalTracks, active: activeTracks },
    studyActivity: {
      totalHours: totalHoursResult._sum.hours?.toString() ?? "0",
      totalEntries,
    },
  };
}

// ── Analytics ─────────────────────────────────────────────

export async function getSystemAnalyticsData() {
  const trackStats = await prisma.track.findMany({
    include: {
      createdBy: { select: { id: true, fullName: true, email: true } },
      _count: {
        select: {
          members: { where: { role: Role.STUDENT, status: StudentStatus.ACTIVE } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const topStudentsRaw = await prisma.studyEntry.groupBy({
    by: ["userId"],
    _sum: { hours: true },
    orderBy: { _sum: { hours: "desc" } },
    take: 10,
  });

  const topStudents = await Promise.all(
    topStudentsRaw.map(async (entry) => {
      const user = await prisma.user.findUnique({
        where: { id: entry.userId },
        include: { track: { select: { name: true } } },
      });
      return {
        userId: entry.userId,
        fullName: user?.fullName ?? "Unknown",
        trackName: user?.track?.name ?? "No track",
        totalHours: entry._sum.hours?.toString() ?? "0",
      };
    }),
  );

  const subjectDistribution = await prisma.studyEntry.groupBy({
    by: ["subject"],
    _sum: { hours: true },
    _count: { subject: true },
    orderBy: { _sum: { hours: "desc" } },
  });

  return {
    trackStats: trackStats.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      duration: t.duration,
      supervisor: { id: t.createdBy.id, fullName: t.createdBy.fullName, email: t.createdBy.email },
      activeStudents: t._count.members,
      maxStudents: t.maxStudents,
      isActive: t.isActive,
      createdAt: t.createdAt,
    })),
    topStudents,
    subjectDistribution: subjectDistribution.map((s) => ({
      subject: s.subject,
      totalHours: s._sum.hours?.toString() ?? "0",
      entryCount: s._count.subject,
    })),
  };
}

// ── Track Overview (admin) ────────────────────────────────

export async function getAllTracksData() {
  const tracks = await prisma.track.findMany({
    include: {
      createdBy: { select: { id: true, fullName: true, email: true } },
      _count: {
        select: {
          members: { where: { role: Role.STUDENT, status: StudentStatus.ACTIVE } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return tracks.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    duration: t.duration,
    maxStudents: t.maxStudents,
    activeStudents: t._count.members,
    isFull: t.maxStudents !== null && t._count.members >= t.maxStudents,
    isActive: t.isActive,
    supervisor: { id: t.createdBy.id, fullName: t.createdBy.fullName, email: t.createdBy.email },
    createdAt: t.createdAt,
  }));
}

// ── Pending Students (admin view) ─────────────────────────

export async function getAllPendingStudentsData() {
  const pending = await prisma.user.findMany({
    where: { role: Role.STUDENT, status: StudentStatus.PENDING_APPROVAL },
    include: { track: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return pending.map((u) => ({
    id: u.id,
    username: u.username,
    fullName: u.fullName,
    email: u.email,
    track: u.track ? { id: u.track.id, name: u.track.name } : null,
    registeredAt: u.createdAt,
  }));
}

// ── Student Management ────────────────────────────────────

export interface StudentFilters {
  status?: StudentStatus;
  trackId?: number;
  search?: string;
}

/**
 * Get all students with optional filters + total study hours per student.
 * Supports: ?status=PENDING_APPROVAL  ?trackId=1  ?search=ahmed
 */
export async function getAllStudentsData(filters: StudentFilters) {
  const where: any = { role: Role.STUDENT };

  if (filters.status) where.status = filters.status;
  if (filters.trackId) where.trackId = filters.trackId;
  if (filters.search) {
    where.OR = [
      { fullName: { contains: filters.search, mode: "insensitive" } },
      { username: { contains: filters.search, mode: "insensitive" } },
      { email:    { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const students = await prisma.user.findMany({
    where,
    include: {
      track: { select: { id: true, name: true } },
      _count: { select: { studyEntries: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Promise.all(
    students.map(async (student) => {
      const hoursResult = await prisma.studyEntry.aggregate({
        where: { userId: student.id },
        _sum: { hours: true },
      });
      return {
        id: student.id,
        username: student.username,
        email: student.email,
        fullName: student.fullName,
        status: student.status,
        track: student.track,
        totalHours: hoursResult._sum.hours?.toString() ?? "0",
        totalEntries: student._count.studyEntries,
        createdAt: student.createdAt,
      };
    }),
  );
}

/**
 * Update a student's status — admin can suspend, reinstate, or archive.
 */
export async function updateStudentStatusById(
  studentId: number,
  status: StudentStatus,
) {
  const student = await prisma.user.findFirst({
    where: { id: studentId, role: Role.STUDENT },
  });

  if (!student) {
    const err = new Error("Student not found");
    (err as any).statusCode = 404;
    throw err;
  }

  const updated = await prisma.user.update({
    where: { id: studentId },
    data: { status },
  });

  return { id: updated.id, fullName: updated.fullName, status: updated.status };
}

/**
 * Hard-delete a user. Admin accounts are protected from deletion.
 * Study entries are cascade-deleted via DB FK.
 */
export async function deleteUserById(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    const err = new Error("User not found");
    (err as any).statusCode = 404;
    throw err;
  }

  if (user.role === Role.ADMIN) {
    const err = new Error("Admin accounts cannot be deleted");
    (err as any).statusCode = 403;
    throw err;
  }

  await prisma.user.delete({ where: { id: userId } });
  return { fullName: user.fullName };
}
