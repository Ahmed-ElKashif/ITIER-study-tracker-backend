import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/authorize";
import {
  getTrackOverview,
  getStudentDetails,
} from "../controllers/supervisor.controller";

const router = Router();

// All routes require authentication and SUPERVISOR role
router.use(authenticate);
router.use(requireRole(["SUPERVISOR"]));

router.get("/track-overview", getTrackOverview);
router.get("/student/:userId", getStudentDetails);

export default router;
