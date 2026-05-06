import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

// Get all tracks
export const getTracks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tracks = await prisma.track.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      data: tracks,
    });
  } catch (error) {
    next(new AppError("Failed to fetch tracks", 500));
  }
};
