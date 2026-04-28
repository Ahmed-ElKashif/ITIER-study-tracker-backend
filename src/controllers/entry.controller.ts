import { Request, Response } from "express";
import { prisma } from "../config/prisma";

// Create study entry
export const createEntry = async (req: Request, res: Response) => {
  try {
    const { subject, hours, date, notes } = req.body;
    const userId = req.user!.userId;

    // Validation
    if (!subject || !hours || !date) {
      return res
        .status(400)
        .json({ error: "Subject, hours, and date are required" });
    }

    if (hours <= 0) {
      return res.status(400).json({ error: "Hours must be greater than 0" });
    }

    const entryDate = new Date(date);
    if (entryDate > new Date()) {
      return res.status(400).json({ error: "Cannot log future dates" });
    }

    // Create entry
    const entry = await prisma.studyEntry.create({
      data: {
        userId,
        subject,
        hours: parseFloat(hours),
        date: entryDate,
        notes: notes || null,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        entryId: entry.id,
        subject: entry.subject,
        hours: entry.hours.toString(),
        date: entry.date,
      },
    });
  } catch (error) {
    console.error("Create entry error:", error);
    res.status(500).json({ error: "Failed to create entry" });
  }
};

// Get user's entries
export const getUserEntries = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { startDate, endDate } = req.query;

    // Build where clause
    const where: any = { userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    // Fetch entries
    const entries = await prisma.studyEntry.findMany({
      where,
      orderBy: { date: "desc" },
    });

    // Calculate totals
    const totalHours = await prisma.studyEntry.aggregate({
      where: { userId },
      _sum: { hours: true },
    });

    res.json({
      success: true,
      data: entries.map((e) => ({
        id: e.id,
        subject: e.subject,
        hours: e.hours.toString(),
        date: e.date,
        notes: e.notes,
      })),
      meta: {
        totalHours: totalHours._sum.hours?.toString() || "0",
        totalEntries: entries.length,
      },
    });
  } catch (error) {
    console.error("Get entries error:", error);
    res.status(500).json({ error: "Failed to fetch entries" });
  }
};

// Update entry
export const updateEntry = async (
  req: Request<{ entryId: string }>,
  res: Response,
) => {
  try {
    const { entryId } = req.params;
    const { hours, notes } = req.body;
    const userId = req.user!.userId;

    // Check ownership
    const entry = await prisma.studyEntry.findUnique({
      where: { id: parseInt(entryId) },
    });

    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    if (entry.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this entry" });
    }

    // Validate hours if provided
    if (hours !== undefined && hours <= 0) {
      return res.status(400).json({ error: "Hours must be greater than 0" });
    }

    // Update entry
    const updated = await prisma.studyEntry.update({
      where: { id: parseInt(entryId) },
      data: {
        ...(hours !== undefined && { hours: parseFloat(hours) }),
        ...(notes !== undefined && { notes }),
      },
    });

    res.json({
      success: true,
      data: {
        id: updated.id,
        subject: updated.subject,
        hours: updated.hours.toString(),
        date: updated.date,
        notes: updated.notes,
      },
    });
  } catch (error) {
    console.error("Update entry error:", error);
    res.status(500).json({ error: "Failed to update entry" });
  }
};

// Delete entry
export const deleteEntry = async (
  req: Request<{ entryId: string }>,
  res: Response,
) => {
  try {
    const { entryId } = req.params;
    const userId = req.user!.userId;

    // Check ownership
    const entry = await prisma.studyEntry.findUnique({
      where: { id: parseInt(entryId) },
    });

    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    if (entry.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this entry" });
    }

    // Delete entry
    await prisma.studyEntry.delete({
      where: { id: parseInt(entryId) },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Delete entry error:", error);
    res.status(500).json({ error: "Failed to delete entry" });
  }
};
