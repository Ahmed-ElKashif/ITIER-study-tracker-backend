import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import {
  getDailyLeaderboard,
  getWeeklyLeaderboard,
} from "../controllers/leaderboard.controller";

const router = Router();

// All users can view leaderboard
router.use(authenticate);

router.get("/daily", getDailyLeaderboard);
router.get("/weekly", getWeeklyLeaderboard);

export default router;
