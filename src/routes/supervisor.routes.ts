import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/authorize";
import {
  getTrackOverview,
  getStudentDetails,
  getPendingStudents,
  approveStudent,
  rejectStudent,
} from "../controllers/supervisor.controller";

const router = Router();

// All routes require authentication + SUPERVISOR role
router.use(authenticate);
router.use(requireRole(["SUPERVISOR"]));

// Existing endpoints
router.get("/track-overview", getTrackOverview);
router.get("/student/:userId", getStudentDetails);

// Approval system endpoints
router.get("/pending-students", getPendingStudents);
router.post("/students/:userId/approve", approveStudent);
router.post("/students/:userId/reject", rejectStudent);

export default router;
