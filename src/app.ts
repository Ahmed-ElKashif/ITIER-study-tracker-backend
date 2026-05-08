import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes";
import { errorHandler } from "./middleware/errorHandler";
import entryRoutes from "./routes/entry.routes";
import leaderboardRoutes from "./routes/leaderboard.routes";
import quoteRoutes from "./routes/quote.routes";
import supervisorRoutes from "./routes/supervisor.routes";
import adminRoutes from "./routes/admin.routes";
import trackRoutes from "./routes/track.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ── CORS — must be FIRST before any routes ────────────────────────────────────
// React Native mobile apps don't send an Origin header, so we allow all.
// In production this is safe: the JWT gates protect all sensitive routes.
app.use(
  cors({
    origin: function (_origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, curl)
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Handle preflight requests for all routes
app.options("*", cors());

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use("/api", limiter);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request logger (dev + Vercel logs) ───────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/entries", entryRoutes);
app.use("/api/v1/leaderboard", leaderboardRoutes);
app.use("/api/v1/quotes", quoteRoutes);
app.use("/api/v1/supervisor", supervisorRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/tracks", trackRoutes);

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
    method: req.method,
  });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Server start (ignored by Vercel serverless, needed for local dev) ─────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
