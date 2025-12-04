import { z } from "zod";
import { PermitType, PermitStatus } from "@prisma/client";

export const createPermitSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  type: z.nativeEnum(PermitType),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
  destination: z.string().optional(),
  startDate: z.string().datetime("Invalid start date"),
  endDate: z.string().datetime("Invalid end date"),
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: "End date must be after start date",
  path: ["endDate"],
});

export const updatePermitStatusSchema = z.object({
  status: z.nativeEnum(PermitStatus),
  rejectionNote: z.string().optional(),
});

export const markReturnedSchema = z.object({
  returnedAt: z.string().datetime().optional(),
});

export const queryPermitSchema = z.object({
  studentId: z.string().uuid().optional(),
  type: z.nativeEnum(PermitType).optional(),
  status: z.nativeEnum(PermitStatus).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreatePermitDto = z.infer<typeof createPermitSchema>;
export type UpdatePermitStatusDto = z.infer<typeof updatePermitStatusSchema>;
export type QueryPermitDto = z.infer<typeof queryPermitSchema>;
