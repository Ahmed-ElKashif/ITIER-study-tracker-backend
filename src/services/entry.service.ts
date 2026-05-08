import { prisma } from "../config/prisma";

// ── Types ────────────────────────────────────────────────

export interface CreateEntryInput {
  userId: number;
  subject: string;
  hours: number;
  date: Date;
  notes?: string;
}

export interface UpdateEntryInput {
  entryId: number;
  userId: number;
  hours?: number;
  notes?: string;
}

// ── Service functions ────────────────────────────────────

export async function createEntry(input: CreateEntryInput) {
  if (input.date > new Date()) {
    const err = new Error("Cannot log future dates");
    (err as any).statusCode = 400;
    throw err;
  }

  return prisma.studyEntry.create({
    data: {
      userId: input.userId,
      subject: input.subject,
      hours: input.hours,
      date: input.date,
      notes: input.notes ?? null,
    },
  });
}

export async function getUserEntries(
  userId: number,
  startDate?: Date,
  endDate?: Date,
) {
  const where: any = { userId };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startDate;
    if (endDate) where.date.lte = endDate;
  }

  const [entries, totalHours] = await Promise.all([
    prisma.studyEntry.findMany({ where, orderBy: { date: "desc" } }),
    prisma.studyEntry.aggregate({ where: { userId }, _sum: { hours: true } }),
  ]);

  return {
    entries,
    totalHours: totalHours._sum.hours?.toString() ?? "0",
    totalEntries: entries.length,
  };
}

export async function updateEntry(input: UpdateEntryInput) {
  const entry = await prisma.studyEntry.findUnique({
    where: { id: input.entryId },
  });

  if (!entry) {
    const err = new Error("Entry not found");
    (err as any).statusCode = 404;
    throw err;
  }

  if (entry.userId !== input.userId) {
    const err = new Error("Not authorized to update this entry");
    (err as any).statusCode = 403;
    throw err;
  }

  return prisma.studyEntry.update({
    where: { id: input.entryId },
    data: {
      ...(input.hours !== undefined && { hours: input.hours }),
      ...(input.notes !== undefined && { notes: input.notes }),
    },
  });
}

export async function deleteEntry(entryId: number, userId: number) {
  const entry = await prisma.studyEntry.findUnique({ where: { id: entryId } });

  if (!entry) {
    const err = new Error("Entry not found");
    (err as any).statusCode = 404;
    throw err;
  }

  if (entry.userId !== userId) {
    const err = new Error("Not authorized to delete this entry");
    (err as any).statusCode = 403;
    throw err;
  }

  await prisma.studyEntry.delete({ where: { id: entryId } });
}
