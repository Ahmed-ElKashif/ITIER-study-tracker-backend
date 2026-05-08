import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { logger } from "../config/logger";
import {
  getTrackOverviewData,
  getStudentDetailsData,
  getPendingStudentsInTrack,
  approveStudentById,
  rejectStudentById,
} from "../services/supervisor.service";

// ── Helper ─────────────────────────────────────────────────
// The JWT caches trackId at login time. If a supervisor creates a track
// *after* logging in, their token still has trackId=null.
// We resolve from the DB (via createdById) as the source of truth.
async function resolveTrackId(
  req: Request,
  res: Response,
): Promise<number | null> {
  // Fast path — JWT is fresh and has the trackId
  if (req.user!.trackId !== null) return req.user!.trackId;

  // Slow path — look up the supervisor's own track from the DB
  const track = await prisma.track.findFirst({
    where: { createdById: req.user!.userId },
    select: { id: true },
  });

  if (!track) {
    res.status(403).json({
      error:
        "No track assigned to this account. Create a track first or re-login if you already have one.",
    });
    return null;
  }

  return track.id;
}

// GET /api/v1/supervisor/track-overview
export const getTrackOverview = async (req: Request, res: Response) => {
  try {
    const trackId = await resolveTrackId(req, res);
    if (trackId === null) return;

    const data = await getTrackOverviewData(trackId);
    return res.json({ success: true, data });
  } catch (error: any) {
    logger.error("Track overview error", { error: error.message });
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to fetch track overview" });
  }
};

// GET /api/v1/supervisor/student/:userId
export const getStudentDetails = async (req: Request, res: Response) => {
  try {
    const trackId = await resolveTrackId(req, res);
    if (trackId === null) return;

    const studentId = parseInt(String(req.params.userId), 10);
    if (isNaN(studentId)) {
      return res.status(400).json({ error: "Invalid student ID" });
    }

    const data = await getStudentDetailsData(studentId, trackId);
    return res.json({ success: true, data });
  } catch (error: any) {
    logger.error("Student details error", { error: error.message });
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to fetch student details" });
  }
};

// GET /api/v1/supervisor/pending-students
export const getPendingStudents = async (req: Request, res: Response) => {
  try {
    const trackId = await resolveTrackId(req, res);
    if (trackId === null) return;

    const data = await getPendingStudentsInTrack(trackId);
    return res.json({ success: true, count: data.length, data });
  } catch (error: any) {
    logger.error("Get pending students error", { error: error.message });
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to fetch pending students" });
  }
};

// POST /api/v1/supervisor/students/:userId/approve
export const approveStudent = async (req: Request, res: Response) => {
  try {
    const trackId = await resolveTrackId(req, res);
    if (trackId === null) return;

    const studentId = parseInt(String(req.params.userId), 10);
    if (isNaN(studentId)) {
      return res.status(400).json({ error: "Invalid student ID" });
    }

    const approved = await approveStudentById(studentId, trackId);
    return res.json({
      success: true,
      message: `${approved.fullName} has been approved and can now log in`,
      data: { id: approved.id, fullName: approved.fullName, status: approved.status },
    });
  } catch (error: any) {
    logger.error("Approve student error", { error: error.message });
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to approve student", ...(error.data || {}) });
  }
};

// POST /api/v1/supervisor/students/:userId/reject
export const rejectStudent = async (req: Request, res: Response) => {
  try {
    const trackId = await resolveTrackId(req, res);
    if (trackId === null) return;

    const studentId = parseInt(String(req.params.userId), 10);
    if (isNaN(studentId)) {
      return res.status(400).json({ error: "Invalid student ID" });
    }

    const result = await rejectStudentById(studentId, trackId, req.body.reason);
    return res.json({ success: true, message: result.message });
  } catch (error: any) {
    logger.error("Reject student error", { error: error.message });
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to reject student" });
  }
};
