import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export const getTrackOverview = async (req: Request, res: Response) => {
  try {
    const { trackId } = req.user!;

    // Get track info
    const track = await prisma.track.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      return res.status(404).json({ error: "Track not found" });
    }

    // Get all students in track
    const students = await prisma.user.findMany({
      where: {
        trackId,
        role: "STUDENT",
      },
      select: {
        id: true,
        fullName: true,
        username: true,
      },
    });

    // Get stats for each student
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const studentsWithStats = await Promise.all(
      students.map(async (student) => {
        // Weekly hours
        const weeklyResult = await prisma.studyEntry.aggregate({
          where: {
            userId: student.id,
            date: { gte: weekAgo },
          },
          _sum: { hours: true },
        });

        // Monthly hours
        const monthlyResult = await prisma.studyEntry.aggregate({
          where: {
            userId: student.id,
            date: { gte: monthAgo },
          },
          _sum: { hours: true },
        });

        // Last study date
        const lastEntry = await prisma.studyEntry.findFirst({
          where: { userId: student.id },
          orderBy: { date: "desc" },
          select: { date: true },
        });

        return {
          userId: student.id,
          fullName: student.fullName,
          username: student.username,
          weeklyHours: weeklyResult._sum.hours?.toString() || "0",
          monthlyHours: monthlyResult._sum.hours?.toString() || "0",
          lastStudyDate: lastEntry?.date || null,
        };
      }),
    );

    // Calculate track stats
    const allEntries = await prisma.studyEntry.findMany({
      where: {
        user: { trackId },
        date: { gte: weekAgo },
      },
      include: {
        user: { select: { id: true } },
      },
    });

    // Most studied subject
    const subjectCounts = new Map<string, number>();
    allEntries.forEach((entry) => {
      const count = subjectCounts.get(entry.subject) || 0;
      subjectCounts.set(entry.subject, count + 1);
    });

    let mostStudiedSubject = "N/A";
    let maxCount = 0;
    subjectCounts.forEach((count, subject) => {
      if (count > maxCount) {
        maxCount = count;
        mostStudiedSubject = subject;
      }
    });

    // Average weekly hours
    const totalWeeklyHours = studentsWithStats.reduce(
      (sum, s) => sum + parseFloat(s.weeklyHours),
      0,
    );
    const averageWeeklyHours =
      students.length > 0
        ? (totalWeeklyHours / students.length).toFixed(2)
        : "0";

    res.json({
      success: true,
      data: {
        trackName: track.name,
        totalStudents: students.length,
        students: studentsWithStats,
        trackStats: {
          averageWeeklyHours,
          mostStudiedSubject,
        },
      },
    });
  } catch (error) {
    console.error("Track overview error:", error);
    res.status(500).json({ error: "Failed to fetch track overview" });
  }
};

export const getStudentDetails = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userIdNum = parseInt(userId as string);
    const { trackId } = req.user!;

    // Verify student belongs to supervisor's track
    const student = await prisma.user.findFirst({
      where: {
        id: userIdNum,
        trackId,
        role: "STUDENT",
      },
    });

    if (!student) {
      return res
        .status(404)
        .json({ error: "Student not found or not in your track" });
    }

    // Get all entries
    const entries = await prisma.studyEntry.findMany({
      where: { userId: userIdNum },
      orderBy: { date: "desc" },
    });

    // Calculate subject breakdown
    const subjectHours = new Map<string, number>();
    entries.forEach((entry) => {
      const hours = subjectHours.get(entry.subject) || 0;
      subjectHours.set(
        entry.subject,
        hours + parseFloat(entry.hours.toString()),
      );
    });

    const subjectBreakdown = Array.from(subjectHours.entries()).map(
      ([subject, hours]) => ({
        subject,
        hours: hours.toFixed(2),
      }),
    );

    // Total hours
    const totalResult = await prisma.studyEntry.aggregate({
      where: { userId: userIdNum },
      _sum: { hours: true },
    });

    res.json({
      success: true,
      data: {
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
          totalHours: totalResult._sum.hours?.toString() || "0",
          totalEntries: entries.length,
          subjectBreakdown,
        },
      },
    });
  } catch (error) {
    console.error("Student details error:", error);
    res.status(500).json({ error: "Failed to fetch student details" });
  }
};
