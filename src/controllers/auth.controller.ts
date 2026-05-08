import { Request, Response, NextFunction } from "express";
import { RegisterRequest, LoginRequest } from "../types";
import { registerUser, loginUser } from "../services/auth.service";

// POST /api/v1/auth/register
export const register = async (
  req: Request<{}, {}, RegisterRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, email, password, fullName, trackId } = req.body;

    // trackId is mandatory for self-service student registration
    if (!username || !email || !password || !fullName || !trackId) {
      return res.status(400).json({
        error: "All fields are required: username, email, password, fullName, trackId",
      });
    }

    const result = await registerUser({ username, email, password, fullName, trackId });

    return res.status(201).json({
      success: true,
      message: result.message,
      data: {
        userId: result.userId,
        username: result.username,
        status: result.status,
        track: result.track,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Registration failed", ...(error.data || {}) });
  }
};

// POST /api/v1/auth/login
export const login = async (
  req: Request<{}, {}, LoginRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const result = await loginUser({ username, password });

    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Login error:", error);
    // Spread error.data so PENDING_APPROVAL / SUSPENDED status + errorCode
    // reach the React Native client for proper UI branching
    return res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Login failed", ...(error.data || {}) });
  }
};
