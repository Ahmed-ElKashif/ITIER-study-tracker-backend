import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/authorize";
import {
  createEntryHandler,
  getUserEntriesHandler,
  updateEntryHandler,
  deleteEntryHandler,
} from "../controllers/entry.controller";
import { validate } from "../middleware/validate";
import {
  createEntrySchema,
  updateEntrySchema,
  getEntriesSchema,
} from "../validations/entry.validation";

const router = Router();

router.use(authenticate);
router.use(requireRole(["STUDENT"]));

router.post("/", validate(createEntrySchema), createEntryHandler);
router.get("/me", validate(getEntriesSchema), getUserEntriesHandler);
router.put("/:entryId", validate(updateEntrySchema), updateEntryHandler);
router.delete("/:entryId", deleteEntryHandler);

export default router;
