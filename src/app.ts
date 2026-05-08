import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes";
import entryRoutes from "./routes/entry.routes";
import leaderboardRoutes from "./routes/leaderboard.routes";
import quoteRoutes from "./routes/quote.routes";
import supervisorRoutes from "./routes/supervisor.routes";
import adminRoutes from "./routes/admin.routes";
import trackRoutes from "./routes/track.routes";

dotenv.config();

const app = express();

// ── CORS — MUST be first ──────────────────────────────────────────────────────
// React Native apps don't send an Origin header, so we allow everything.
// JWT tokens protect all sensitive routes.
app.use(
  cors({
    origin: (_origin, callback) => callback(null, true),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors()); // handle preflight for all routes

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request logger ────────────────────────────────────────────────────────────
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Health check (root-level, no /api/v1 prefix) ─────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/entries", entryRoutes);
app.use("/api/v1/leaderboard", leaderboardRoutes);
app.use("/api/v1/quotes", quoteRoutes);
app.use("/api/v1/supervisor", supervisorRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/tracks", trackRoutes);

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
    method: req.method,
  });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ── Local dev server (Vercel ignores this — it uses the exported app) ─────────
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

export default app;
