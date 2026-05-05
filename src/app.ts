import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import { errorHandler } from "./middleware/errorHandler";
import entryRoutes from "./routes/entry.routes";
import leaderboardRoutes from "./routes/leaderboard.routes";
import quoteRoutes from "./routes/quote.routes";
import supervisorRoutes from "./routes/supervisor.routes";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: "*", // Allows all devices (like your phone) to connect
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/entries", entryRoutes);

app.use("/api/v1/leaderboard", leaderboardRoutes);

app.use("/api/v1/quotes", quoteRoutes);

app.use("/api/v1/supervisor", supervisorRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
