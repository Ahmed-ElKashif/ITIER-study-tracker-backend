import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/authorize";
import {
  getActiveTracks,
  createTrack,
  updateTrack,
  getMyTrack,
} from "../controllers/track.controller";
import { validate } from "../middleware/validate";
import {
  createTrackSchema,
  updateTrackSchema,
} from "../validations/track.validation";

const router = Router();

// ── Public — no auth needed (student registration page uses this) ──
router.get("/", getActiveTracks);

// ── All routes below require authentication ──
router.use(authenticate);

// Supervisor-only routes
// NOTE: /me MUST be defined before /:trackId to prevent Express matching
// "me" as a trackId parameter.
router.get("/me", requireRole([Role.SUPERVISOR]), getMyTrack);
router.post("/", requireRole([Role.SUPERVISOR]), validate(createTrackSchema), createTrack);
router.put("/:trackId", requireRole([Role.SUPERVISOR]), validate(updateTrackSchema), updateTrack);

export default router;
