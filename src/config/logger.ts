import winston from "winston";

/**
 * Structured logger for the ITIER backend.
 * - Development: simple readable format to console
 * - Production: JSON format to console + rotating log files
 *
 * Usage:
 *   import { logger } from '../config/logger';
 *   logger.info('User logged in', { userId: user.id });
 *   logger.error('Database error', { error: err.message });
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === "development"
          ? winston.format.combine(
              winston.format.colorize(),
              winston.format.simple(),
            )
          : winston.format.json(),
    }),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
  // Silence winston in test mode — Jest output is noisy enough
  silent: process.env.NODE_ENV === "test",
});
