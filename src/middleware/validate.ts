import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError, ZodIssue } from "zod";
import { logger } from "../config/logger";

/**
 * Generic validation middleware using Zod.
 * Validates req.body, req.query, and req.params against the provided schema.
 */
export const validate =
  (schema: ZodSchema) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format the errors
        const formattedErrors = error.issues.map((err: ZodIssue) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        logger.warn("Validation error", { errors: formattedErrors });

        return res.status(400).json({
          error: "Validation failed",
          details: formattedErrors,
        });
      }
      return next(error);
    }
  };
