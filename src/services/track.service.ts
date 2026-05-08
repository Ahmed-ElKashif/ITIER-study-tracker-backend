import { prisma } from "../config/prisma";
import { Role, StudentStatus } from "@prisma/client";

// ── Public ────────────────────────────────────────────────

export async function getActiveTracksData() {
  const tracks = await prisma.track.findMany({
    where: { isActive: true },
    include: {
      createdBy: { select: { id: true, fullName: true } },
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
    currentStudents: t._count.members,
    supervisor: t.createdBy.fullName,
    isFull: t.maxStudents !== null && t._count.members >= t.maxStudents,
  }));
}

// ── Supervisor ────────────────────────────────────────────

export async function createTrackForSupervisor(
  supervisorId: number,
  name: string,
  description?: string,
  duration?: string,
  maxStudents?: number | null,
) {
  const existing = await prisma.track.findFirst({
    where: { createdById: supervisorId },
  });

  if (existing) {
    const err = new Error(
      "You already own a track. Edit it instead of creating a new one.",
    );
    (err as any).statusCode = 409;
    (err as any).data = { trackId: existing.id };
    throw err;
  }

  // Atomic: create track + link supervisor
  return prisma.$transaction(async (tx) => {
    const track = await tx.track.create({
      data: {
        name,
        description: description ?? null,
        duration: duration ?? null,
        maxStudents: maxStudents ?? null,
        createdById: supervisorId,
        isActive: true,
      },
    });

    await tx.user.update({
      where: { id: supervisorId },
      data: { trackId: track.id },
    });

    return track;
  });
}

export async function updateTrackForSupervisor(
  trackId: number,
  supervisorId: number,
  updates: {
    name?: string;
    description?: string;
    duration?: string;
    maxStudents?: number | null;
    isActive?: boolean;
  },
) {
  const track = await prisma.track.findFirst({
    where: { id: trackId, createdById: supervisorId },
  });

  if (!track) {
    const err = new Error("Track not found or you do not own it");
    (err as any).statusCode = 404;
    throw err;
  }

  return prisma.track.update({
    where: { id: trackId },
    data: {
      ...(updates.name && { name: updates.name }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.duration && { duration: updates.duration }),
      ...(updates.maxStudents !== undefined && { maxStudents: updates.maxStudents }),
      ...(updates.isActive !== undefined && { isActive: updates.isActive }),
    },
  });
}

export async function getSupervisorTrack(supervisorId: number) {
  const track = await prisma.track.findFirst({
    where: { createdById: supervisorId },
    include: {
      _count: {
        select: {
          members: { where: { role: Role.STUDENT, status: StudentStatus.ACTIVE } },
        },
      },
    },
  });

  if (!track) {
    const err = new Error("No track found. Create your track first.");
    (err as any).statusCode = 404;
    throw err;
  }

  return {
    id: track.id,
    name: track.name,
    description: track.description,
    duration: track.duration,
    maxStudents: track.maxStudents,
    activeStudents: track._count.members,
    isFull: track.maxStudents !== null && track._count.members >= track.maxStudents,
    isActive: track.isActive,
    createdAt: track.createdAt,
  };
}
