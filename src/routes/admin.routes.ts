import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/authorize";
import {
  createSupervisor,
  getAllSupervisors,
  getDashboard,
  getSystemAnalytics,
  getAllTracks,
  getPendingStudents,
  getAllStudents,
  updateStudentStatus,
  deleteUser,
} from "../controllers/admin.controller";
import { validate } from "../middleware/validate";
import {
  createSupervisorSchema,
  updateStudentStatusSchema,
  deleteUserSchema,
} from "../validations/admin.validation";

const router = Router();

// ── All admin routes require authentication + ADMIN role ──
router.use(authenticate);
router.use(requireRole([Role.ADMIN]));

// Supervisor management
router.post("/supervisors", validate(createSupervisorSchema), createSupervisor);
router.get("/supervisors", getAllSupervisors);

// System overview
router.get("/dashboard", getDashboard);
router.get("/analytics", getSystemAnalytics);
router.get("/tracks", getAllTracks);

// Student management
// NOTE: /students/pending MUST come before /students/:userId routes
router.get("/students/pending", getPendingStudents);
router.get("/students", getAllStudents);
router.put("/students/:userId/status", validate(updateStudentStatusSchema), updateStudentStatus);

// User management
router.delete("/users/:userId", validate(deleteUserSchema), deleteUser);

export default router;
