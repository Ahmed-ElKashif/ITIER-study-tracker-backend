import { prisma } from "../config/prisma";

export const getDailyRankings = async (date: Date, trackId: number) => {
  // Get all entries for the date and track
  const entries = await prisma.studyEntry.findMany({
    where: {
      date,
      user: { trackId, status: "ACTIVE" },
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  // Group by user and calculate totals
  const userHours = new Map<
    number,
    { fullName: string; hours: number; subjects: Set<string> }
  >();

  entries.forEach((entry) => {
    const userId = entry.user.id;
    if (!userHours.has(userId)) {
      userHours.set(userId, {
        fullName: entry.user.fullName,
        hours: 0,
        subjects: new Set(),
      });
    }
    const userData = userHours.get(userId)!;
    userData.hours += parseFloat(entry.hours.toString());
    userData.subjects.add(entry.subject);
  });

  // Convert to array and sort
  const rankings = Array.from(userHours.entries())
    .map(([userId, data]) => ({
      userId,
      fullName: data.fullName,
      totalHours: data.hours.toFixed(2),
      subjects: Array.from(data.subjects),
    }))
    .sort((a, b) => parseFloat(b.totalHours) - parseFloat(a.totalHours))
    .map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

  return rankings;
};

export const getWeeklyRankings = async (weekStart: Date, trackId: number) => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // Get all entries for the week
  const entries = await prisma.studyEntry.findMany({
    where: {
      date: {
        gte: weekStart,
        lt: weekEnd,
      },
      user: { trackId, status: "ACTIVE" },
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  // Group by user
  const userHours = new Map<
    number,
    { fullName: string; hours: number; subjects: Set<string> }
  >();

  entries.forEach((entry) => {
    const userId = entry.user.id;
    if (!userHours.has(userId)) {
      userHours.set(userId, {
        fullName: entry.user.fullName,
        hours: 0,
        subjects: new Set(),
      });
    }
    const userData = userHours.get(userId)!;
    userData.hours += parseFloat(entry.hours.toString());
    userData.subjects.add(entry.subject);
  });

  // Convert to rankings
  const rankings = Array.from(userHours.entries())
    .map(([userId, data]) => ({
      userId,
      fullName: data.fullName,
      totalHours: data.hours.toFixed(2),
      subjects: Array.from(data.subjects),
    }))
    .sort((a, b) => parseFloat(b.totalHours) - parseFloat(a.totalHours))
    .map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

  return rankings;
};
