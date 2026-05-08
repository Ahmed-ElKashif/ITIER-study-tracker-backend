import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/authorize";
import {
  createEntryHandler,
  getUserEntriesHandler,
  updateEntryHandler,
  deleteEntryHandler,
} from "../controllers/entry.controller";

const router = Router();

router.use(authenticate);
router.use(requireRole(["STUDENT"]));

router.post("/", createEntryHandler);
router.get("/me", getUserEntriesHandler);
router.put("/:entryId", updateEntryHandler);
router.delete("/:entryId", deleteEntryHandler);

export default router;
