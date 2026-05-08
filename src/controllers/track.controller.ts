import { Request, Response } from "express";
import { logger } from "../config/logger";
import {
  getActiveTracksData,
  createTrackForSupervisor,
  updateTrackForSupervisor,
  getSupervisorTrack,
} from "../services/track.service";

// GET /api/v1/tracks  (public)
export const getActiveTracks = async (req: Request, res: Response) => {
  try {
    const data = await getActiveTracksData();
    return res.json({ success: true, data });
  } catch (error: any) {
    logger.error("Get active tracks error", { error: error.message });
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to fetch tracks" });
  }
};

// POST /api/v1/tracks  (supervisor)
export const createTrack = async (req: Request, res: Response) => {
  try {
    const { name, description, duration, maxStudents } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Track name is required" });
    }

    const track = await createTrackForSupervisor(
      req.user!.userId,
      name,
      description,
      duration,
      maxStudents !== undefined
        ? maxStudents === null ? null : parseInt(String(maxStudents), 10)
        : undefined,
    );

    return res.status(201).json({ success: true, message: "Track created successfully", data: track });
  } catch (error: any) {
    logger.error("Create track error", { error: error.message });
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to create track", ...(error.data || {}) });
  }
};

// PUT /api/v1/tracks/:trackId  (supervisor)
export const updateTrack = async (req: Request, res: Response) => {
  try {
    const trackId = parseInt(String(req.params.trackId), 10);
    if (isNaN(trackId)) {
      return res.status(400).json({ error: "Invalid track ID" });
    }

    const { name, description, duration, maxStudents, isActive } = req.body;

    const updated = await updateTrackForSupervisor(trackId, req.user!.userId, {
      name,
      description,
      duration,
      maxStudents:
        maxStudents !== undefined
          ? maxStudents === null ? null : parseInt(String(maxStudents), 10)
          : undefined,
      isActive,
    });

    return res.json({ success: true, message: "Track updated successfully", data: updated });
  } catch (error: any) {
    logger.error("Update track error", { error: error.message });
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to update track" });
  }
};

// GET /api/v1/tracks/me  (supervisor)
export const getMyTrack = async (req: Request, res: Response) => {
  try {
    const data = await getSupervisorTrack(req.user!.userId);
    return res.json({ success: true, data });
  } catch (error: any) {
    logger.error("Get my track error", { error: error.message });
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to fetch your track" });
  }
};
