import { Request, Response } from "express";
import {
  getTrackOverviewData,
  getStudentDetailsData,
  getPendingStudentsInTrack,
  approveStudentById,
  rejectStudentById,
} from "../services/supervisor.service";

// ── Helper ────────────────────────────────────────────────
function requireTrackId(req: Request, res: Response): number | null {
  const { trackId } = req.user!;
  if (trackId === null) {
    res.status(403).json({ error: "No track assigned to this account" });
    return null;
  }
  return trackId;
}

// GET /api/v1/supervisor/track-overview
export const getTrackOverview = async (req: Request, res: Response) => {
  try {
    const trackId = requireTrackId(req, res);
    if (trackId === null) return;

    const data = await getTrackOverviewData(trackId);
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("Track overview error:", error);
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to fetch track overview" });
  }
};

// GET /api/v1/supervisor/student/:userId
export const getStudentDetails = async (req: Request, res: Response) => {
  try {
    const trackId = requireTrackId(req, res);
    if (trackId === null) return;

    const studentId = parseInt(String(req.params.userId), 10);
    if (isNaN(studentId)) {
      return res.status(400).json({ error: "Invalid student ID" });
    }

    const data = await getStudentDetailsData(studentId, trackId);
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("Student details error:", error);
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to fetch student details" });
  }
};

// GET /api/v1/supervisor/pending-students
export const getPendingStudents = async (req: Request, res: Response) => {
  try {
    const trackId = requireTrackId(req, res);
    if (trackId === null) return;

    const data = await getPendingStudentsInTrack(trackId);
    return res.json({ success: true, count: data.length, data });
  } catch (error: any) {
    console.error("Get pending students error:", error);
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to fetch pending students" });
  }
};

// POST /api/v1/supervisor/students/:userId/approve
export const approveStudent = async (req: Request, res: Response) => {
  try {
    const trackId = requireTrackId(req, res);
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
    console.error("Approve student error:", error);
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to approve student", ...(error.data || {}) });
  }
};

// POST /api/v1/supervisor/students/:userId/reject
export const rejectStudent = async (req: Request, res: Response) => {
  try {
    const trackId = requireTrackId(req, res);
    if (trackId === null) return;

    const studentId = parseInt(String(req.params.userId), 10);
    if (isNaN(studentId)) {
      return res.status(400).json({ error: "Invalid student ID" });
    }

    const result = await rejectStudentById(studentId, trackId, req.body.reason);
    return res.json({ success: true, message: result.message });
  } catch (error: any) {
    console.error("Reject student error:", error);
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to reject student" });
  }
};
