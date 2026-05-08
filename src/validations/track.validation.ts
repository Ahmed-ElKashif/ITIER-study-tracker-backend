import { z } from "zod";

export const createTrackSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Track name is required"),
    description: z.string().optional(),
    duration: z.string().optional(),
    maxStudents: z
      .number()
      .int()
      .positive("Max students must be a positive integer")
      .nullable()
      .optional(),
  }),
});

export const updateTrackSchema = z.object({
  params: z.object({
    trackId: z.string().regex(/^\d+$/, "Track ID must be a number"),
  }),
  body: z.object({
    name: z.string().min(1, "Track name is required").optional(),
    description: z.string().optional(),
    duration: z.string().optional(),
    maxStudents: z
      .number()
      .int()
      .positive("Max students must be a positive integer")
      .nullable()
      .optional(),
    isActive: z.boolean().optional(),
  }),
});
