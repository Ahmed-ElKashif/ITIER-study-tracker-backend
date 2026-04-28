import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/authorize";
import {
  createEntry,
  getUserEntries,
  updateEntry,
  deleteEntry,
} from "../controllers/entry.controller";

const router = Router();

// All routes require authentication and STUDENT role
router.use(authenticate);
router.use(requireRole(["STUDENT"]));

router.post("/", createEntry);
router.get("/me", getUserEntries);
router.put("/:entryId", updateEntry);
router.delete("/:entryId", deleteEntry);

export default router;
