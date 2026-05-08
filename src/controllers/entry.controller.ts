import { Request, Response } from "express";
import {
  createEntry,
  getUserEntries,
  updateEntry,
  deleteEntry,
} from "../services/entry.service";

// POST /api/v1/entries
export const createEntryHandler = async (req: Request, res: Response) => {
  try {
    const { subject, hours, date, notes } = req.body;

    if (!subject || !hours || !date) {
      return res.status(400).json({ error: "Subject, hours, and date are required" });
    }

    if (hours <= 0) {
      return res.status(400).json({ error: "Hours must be greater than 0" });
    }

    const entry = await createEntry({
      userId: req.user!.userId,
      subject,
      hours: parseFloat(hours),
      date: new Date(date),
      notes,
    });

    return res.status(201).json({
      success: true,
      data: {
        entryId: entry.id,
        subject: entry.subject,
        hours: entry.hours.toString(),
        date: entry.date,
      },
    });
  } catch (error: any) {
    console.error("Create entry error:", error);
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to create entry" });
  }
};

// GET /api/v1/entries/me
export const getUserEntriesHandler = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const result = await getUserEntries(
      req.user!.userId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
    );

    return res.json({
      success: true,
      data: result.entries.map((e) => ({
        id: e.id,
        subject: e.subject,
        hours: e.hours.toString(),
        date: e.date,
        notes: e.notes,
      })),
      meta: {
        totalHours: result.totalHours,
        totalEntries: result.totalEntries,
      },
    });
  } catch (error: any) {
    console.error("Get entries error:", error);
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to fetch entries" });
  }
};

// PUT /api/v1/entries/:entryId
export const updateEntryHandler = async (
  req: Request<{ entryId: string }>,
  res: Response,
) => {
  try {
    const { hours, notes } = req.body;

    if (hours !== undefined && hours <= 0) {
      return res.status(400).json({ error: "Hours must be greater than 0" });
    }

    const updated = await updateEntry({
      entryId: parseInt(req.params.entryId, 10),
      userId: req.user!.userId,
      ...(hours !== undefined && { hours: parseFloat(hours) }),
      ...(notes !== undefined && { notes }),
    });

    return res.json({
      success: true,
      data: {
        id: updated.id,
        subject: updated.subject,
        hours: updated.hours.toString(),
        date: updated.date,
        notes: updated.notes,
      },
    });
  } catch (error: any) {
    console.error("Update entry error:", error);
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to update entry" });
  }
};

// DELETE /api/v1/entries/:entryId
export const deleteEntryHandler = async (
  req: Request<{ entryId: string }>,
  res: Response,
) => {
  try {
    await deleteEntry(parseInt(req.params.entryId, 10), req.user!.userId);
    return res.status(204).send();
  } catch (error: any) {
    console.error("Delete entry error:", error);
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to delete entry" });
  }
};
