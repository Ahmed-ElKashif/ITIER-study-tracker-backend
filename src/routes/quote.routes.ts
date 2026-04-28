import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { getQuote } from "../controllers/quote.controller";

const router = Router();

router.use(authenticate);

router.get("/daily", getQuote);

export default router;
