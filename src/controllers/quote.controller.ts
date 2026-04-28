import { Request, Response } from "express";
import { getDailyQuote } from "../services/quote.service";

export const getQuote = async (req: Request, res: Response) => {
  try {
    const quote = await getDailyQuote();
    res.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    console.error("Quote error:", error);
    res.status(500).json({ error: "Failed to fetch quote" });
  }
};
