import { z } from "zod";

export const createEntrySchema = z.object({
  body: z.object({
    subject: z.string().min(1, "Subject is required"),
    hours: z
      .number()
      .positive("Hours must be positive")
      .max(24, "Hours cannot exceed 24 in a single entry"),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    }),
    notes: z.string().optional(),
  }),
});

export const updateEntrySchema = z.object({
  params: z.object({
    entryId: z.string().regex(/^\d+$/, "Entry ID must be a number"),
  }),
  body: z.object({
    subject: z.string().min(1, "Subject is required").optional(),
    hours: z
      .number()
      .positive("Hours must be positive")
      .max(24, "Hours cannot exceed 24 in a single entry")
      .optional(),
    date: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
      })
      .optional(),
    notes: z.string().optional(),
  }),
});

export const getEntriesSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/, "Page must be a number").optional(),
    limit: z.string().regex(/^\d+$/, "Limit must be a number").optional(),
  }),
});
