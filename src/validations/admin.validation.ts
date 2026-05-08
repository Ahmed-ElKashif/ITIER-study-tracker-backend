import { z } from "zod";
import { StudentStatus } from "@prisma/client";

export const createSupervisorSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
  }),
});

export const updateStudentStatusSchema = z.object({
  params: z.object({
    userId: z.string().regex(/^\d+$/, "User ID must be a number"),
  }),
  body: z.object({
    status: z.nativeEnum(StudentStatus, {
      message: `Invalid status. Valid values: ${Object.values(StudentStatus).join(", ")}`,
    }),
  }),
});

export const deleteUserSchema = z.object({
  params: z.object({
    userId: z.string().regex(/^\d+$/, "User ID must be a number"),
  }),
});
