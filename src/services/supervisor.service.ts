import { prisma } from "../config/prisma";
import { Role, StudentStatus } from "@prisma/client";

// ── Track Overview ────────────────────────────────────────

export async function getTrackOverviewData(trackId: number) {
  const track = await prisma.track.findUnique({ where: { id: trackId } });

  if (!track) {
    const err = new Error("Track not found");
    (err as any).statusCode = 404;
    throw err;
  }

  const students = await prisma.user.findMany({
    where: { trackId, role: Role.STUDENT },
    select: { id: true, fullName: true, username: true },
  });

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  const studentsWithStats = await Promise.all(
    students.map(async (student) => {
      const [weekly, monthly, lastEntry] = await Promise.all([
        prisma.studyEntry.aggregate({
          where: { userId: student.id, date: { gte: weekAgo } },
          _sum: { hours: true },
        }),
        prisma.studyEntry.aggregate({
          where: { userId: student.id, date: { gte: monthAgo } },
          _sum: { hours: true },
        }),
        prisma.studyEntry.findFirst({
          where: { userId: student.id },
          orderBy: { date: "desc" },
          select: { date: true },
        }),
      ]);

      return {
        userId: student.id,
        fullName: student.fullName,
        username: student.username,
        weeklyHours: weekly._sum.hours?.toString() ?? "0",
        monthlyHours: monthly._sum.hours?.toString() ?? "0",
        lastStudyDate: lastEntry?.date ?? null,
      };
    }),
  );

  // Track-level stats
  const allEntries = await prisma.studyEntry.findMany({
    where: { user: { trackId }, date: { gte: weekAgo } },
  });

  const subjectCounts = new Map<string, number>();
  allEntries.forEach((e) =>
    subjectCounts.set(e.subject, (subjectCounts.get(e.subject) ?? 0) + 1),
  );

  let mostStudiedSubject = "N/A";
  let maxCount = 0;
  subjectCounts.forEach((count, subject) => {
    if (count > maxCount) { maxCount = count; mostStudiedSubject = subject; }
  });

  const totalWeekly = studentsWithStats.reduce(
    (sum, s) => sum + parseFloat(s.weeklyHours), 0,
  );

  return {
    trackName: track.name,
    totalStudents: students.length,
    students: studentsWithStats,
    trackStats: {
      averageWeeklyHours:
        students.length > 0 ? (totalWeekly / students.length).toFixed(2) : "0",
      mostStudiedSubject,
    },
  };
}

// ── Student Details ───────────────────────────────────────

export async function getStudentDetailsData(studentId: number, trackId: number) {
  const student = await prisma.user.findFirst({
    where: { id: studentId, trackId, role: Role.STUDENT },
  });

  if (!student) {
    const err = new Error("Student not found or not in your track");
    (err as any).statusCode = 404;
    throw err;
  }

  const entries = await prisma.studyEntry.findMany({
    where: { userId: studentId },
    orderBy: { date: "desc" },
  });

  const subjectHours = new Map<string, number>();
  entries.forEach((e) =>
    subjectHours.set(
      e.subject,
      (subjectHours.get(e.subject) ?? 0) + parseFloat(e.hours.toString()),
    ),
  );

  const totalResult = await prisma.studyEntry.aggregate({
    where: { userId: studentId },
    _sum: { hours: true },
  });

  return {
    student: {
      id: student.id,
      fullName: student.fullName,
      username: student.username,
      email: student.email,
    },
    entries: entries.map((e) => ({
      id: e.id,
      subject: e.subject,
      hours: e.hours.toString(),
      date: e.date,
      notes: e.notes,
    })),
    analytics: {
      totalHours: totalResult._sum.hours?.toString() ?? "0",
      totalEntries: entries.length,
      subjectBreakdown: Array.from(subjectHours.entries()).map(
        ([subject, hours]) => ({ subject, hours: hours.toFixed(2) }),
      ),
    },
  };
}

// ── Approval System ───────────────────────────────────────

export async function getPendingStudentsInTrack(trackId: number) {
  return prisma.user.findMany({
    where: { trackId, role: Role.STUDENT, status: StudentStatus.PENDING_APPROVAL },
    orderBy: { createdAt: "asc" },
    select: { id: true, username: true, email: true, fullName: true, createdAt: true },
  });
}

export async function approveStudentById(studentId: number, trackId: number) {
  const student = await prisma.user.findFirst({
    where: { id: studentId, trackId, role: Role.STUDENT, status: StudentStatus.PENDING_APPROVAL },
  });

  if (!student) {
    const err = new Error("Student not found or already processed");
    (err as any).statusCode = 404;
    throw err;
  }

  const track = await prisma.track.findUnique({
    where: { id: trackId },
    include: {
      _count: {
        select: {
          members: { where: { role: Role.STUDENT, status: StudentStatus.ACTIVE } },
        },
      },
    },
  });

  if (track?.maxStudents && track._count.members >= track.maxStudents) {
    const err = new Error("Track is at full capacity");
    (err as any).statusCode = 409;
    (err as any).data = { maxStudents: track.maxStudents, currentCount: track._count.members };
    throw err;
  }

  return prisma.user.update({
    where: { id: studentId },
    data: { status: StudentStatus.ACTIVE },
  });
}

export async function rejectStudentById(
  studentId: number,
  trackId: number,
  reason?: string,
) {
  const student = await prisma.user.findFirst({
    where: { id: studentId, trackId, role: Role.STUDENT, status: StudentStatus.PENDING_APPROVAL },
  });

  if (!student) {
    const err = new Error("Student not found or already processed");
    (err as any).statusCode = 404;
    throw err;
  }

  await prisma.user.update({
    where: { id: studentId },
    data: { status: StudentStatus.ARCHIVED },
  });

  return { message: `Registration rejected${reason ? `: ${reason}` : ""}` };
}
