import { Request, Response } from "express";
import { getDailyQuote } from "../services/quote.service";
import { logger } from "../config/logger";

export const getQuote = async (req: Request, res: Response) => {
  try {
    const quote = await getDailyQuote();
    res.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    logger.error("Quote error", { error: (error as Error).message });
    res.status(500).json({ error: "Failed to fetch quote" });
  }
};
