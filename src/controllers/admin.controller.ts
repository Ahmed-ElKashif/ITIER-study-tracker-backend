import { Request, Response } from "express";
import { StudentStatus } from "@prisma/client";
import {
  createSupervisorAccount,
  getAllSupervisorsData,
  getDashboardStats,
  getSystemAnalyticsData,
  getAllTracksData,
  getAllPendingStudentsData,
  getAllStudentsData,
  updateStudentStatusById,
  deleteUserById,
} from "../services/admin.service";
import { logger } from "../config/logger";

// POST /api/v1/admin/supervisors
export const createSupervisor = async (req: Request, res: Response) => {
  try {
    const { email, fullName } = req.body;
    if (!email || !fullName) {
      return res.status(400).json({ error: "Email and full name are required" });
    }
    const result = await createSupervisorAccount(email, fullName);
    return res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    logger.error("Create supervisor error", { error: error.message });
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to create supervisor" });
  }
};

// GET /api/v1/admin/supervisors
export const getAllSupervisors = async (req: Request, res: Response) => {
  try {
    const data = await getAllSupervisorsData();
    return res.json({ success: true, data });
  } catch (error: any) {
    logger.error("Get supervisors error", { error: error.message });
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to fetch supervisors" });
  }
};

// GET /api/v1/admin/dashboard
export const getDashboard = async (req: Request, res: Response) => {
  try {
    const data = await getDashboardStats();
    return res.json({ success: true, data });
  } catch (error: any) {
    logger.error("Dashboard error", { error: error.message });
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to fetch dashboard data" });
  }
};

// GET /api/v1/admin/analytics
export const getSystemAnalytics = async (req: Request, res: Response) => {
  try {
    const data = await getSystemAnalyticsData();
    return res.json({ success: true, data });
  } catch (error: any) {
    logger.error("Analytics error", { error: error.message });
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to fetch analytics" });
  }
};

// GET /api/v1/admin/tracks
export const getAllTracks = async (req: Request, res: Response) => {
  try {
    const data = await getAllTracksData();
    return res.json({ success: true, data });
  } catch (error: any) {
    logger.error("Get all tracks error", { error: error.message });
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to fetch tracks" });
  }
};

// GET /api/v1/admin/students/pending
export const getPendingStudents = async (req: Request, res: Response) => {
  try {
    const data = await getAllPendingStudentsData();
    return res.json({ success: true, count: data.length, data });
  } catch (error: any) {
    logger.error("Get pending students error", { error: error.message });
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to fetch pending students" });
  }
};

// GET /api/v1/admin/students?status=&trackId=&search=
export const getAllStudents = async (req: Request, res: Response) => {
  try {
    const { status, trackId, search } = req.query;

    // Validate status if provided
    if (status && !Object.values(StudentStatus).includes(status as StudentStatus)) {
      return res.status(400).json({ error: `Invalid status. Valid values: ${Object.values(StudentStatus).join(", ")}` });
    }

    const data = await getAllStudentsData({
      status: status as StudentStatus | undefined,
      trackId: trackId ? parseInt(String(trackId), 10) : undefined,
      search: search as string | undefined,
    });

    return res.json({ success: true, count: data.length, data });
  } catch (error: any) {
    logger.error("Get students error", { error: error.message });
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to fetch students" });
  }
};

// PUT /api/v1/admin/students/:userId/status
export const updateStudentStatus = async (req: Request, res: Response) => {
  try {
    const studentId = parseInt(String(req.params.userId), 10);
    const { status } = req.body;

    if (isNaN(studentId)) {
      return res.status(400).json({ error: "Invalid student ID" });
    }

    if (!status || !Object.values(StudentStatus).includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Valid values: ${Object.values(StudentStatus).join(", ")}`,
      });
    }

    const data = await updateStudentStatusById(studentId, status as StudentStatus);
    return res.json({
      success: true,
      message: `Student status updated to ${status}`,
      data,
    });
  } catch (error: any) {
    logger.error("Update student status error", { error: error.message });
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to update status" });
  }
};

// DELETE /api/v1/admin/users/:userId
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(String(req.params.userId), 10);

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const result = await deleteUserById(userId);
    return res.json({
      success: true,
      message: `User ${result.fullName} deleted successfully`,
    });
  } catch (error: any) {
    logger.error("Delete user error", { error: error.message });
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to delete user" });
  }
};
