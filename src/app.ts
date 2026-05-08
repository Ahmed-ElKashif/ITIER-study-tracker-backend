import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import { logger } from "./config/logger";
import authRoutes from "./routes/auth.routes";
import entryRoutes from "./routes/entry.routes";
import leaderboardRoutes from "./routes/leaderboard.routes";
import quoteRoutes from "./routes/quote.routes";
import supervisorRoutes from "./routes/supervisor.routes";
import adminRoutes from "./routes/admin.routes";
import trackRoutes from "./routes/track.routes";

dotenv.config();

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── HTTP Parameter Pollution prevention ───────────────────────────────────────
app.use(hpp());

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again in 15 minutes." },
  skip: () => process.env.NODE_ENV === "test", // Disable during tests
});
app.use(limiter);

// ── Auth routes get a stricter limit ─────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 login attempts per 15 minutes per IP
  message: { error: "Too many login attempts. Please wait 15 minutes." },
  skip: () => process.env.NODE_ENV === "test",
});

// ── CORS — MUST be first ──────────────────────────────────────────────────────
// React Native apps don't send an Origin header, so we allow all origins.
// Security is handled by JWT tokens on protected routes.
app.use(
  cors({
    origin: (_origin, callback) => callback(null, true),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("/{*splat}", cors()); // Express v5: named wildcard required

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request logger (Winston) ──────────────────────────────────────────────────
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });
  next();
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/v1/auth", authLimiter, authRoutes);
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
  logger.error("Unhandled error", { message: err.message, stack: err.stack });
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    error: err.message || "Internal server error",
  });
});

// ── Start server (skip in test — supertest handles binding) ─────────────────
if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
    logger.info(`📦 Database: Supabase (${process.env.NODE_ENV})`);
  });
}

export default app;
