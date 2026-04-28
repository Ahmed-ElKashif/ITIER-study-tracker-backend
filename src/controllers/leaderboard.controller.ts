import { Request, Response } from "express";
import {
  getDailyRankings,
  getWeeklyRankings,
} from "../services/analytics.service";

export const getDailyLeaderboard = async (req: Request, res: Response) => {
  try {
    const { date, trackId } = req.query;

    if (!date || !trackId) {
      return res.status(400).json({ error: "Date and trackId are required" });
    }

    const targetDate = new Date(date as string);
    const rankings = await getDailyRankings(
      targetDate,
      parseInt(trackId as string),
    );

    res.json({
      success: true,
      data: {
        date: targetDate,
        rankings,
      },
    });
  } catch (error) {
    console.error("Daily leaderboard error:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
};

export const getWeeklyLeaderboard = async (req: Request, res: Response) => {
  try {
    const { weekStart, trackId } = req.query;

    if (!weekStart || !trackId) {
      return res
        .status(400)
        .json({ error: "weekStart and trackId are required" });
    }

    const startDate = new Date(weekStart as string);
    const rankings = await getWeeklyRankings(
      startDate,
      parseInt(trackId as string),
    );

    res.json({
      success: true,
      data: {
        weekStart: startDate,
        rankings,
      },
    });
  } catch (error) {
    console.error("Weekly leaderboard error:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
};
