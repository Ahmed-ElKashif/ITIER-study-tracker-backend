import { Request, Response, NextFunction } from "express";
import { RegisterRequest, LoginRequest } from "../types";
import { AuthService } from "../services/auth.service";

const authService = new AuthService();

// Register new user
export const register = async (
  req: Request<{}, {}, RegisterRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await authService.register(req.body);
    res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Login user
export const login = async (
  req: Request<{}, {}, LoginRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await authService.login(req.body);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
