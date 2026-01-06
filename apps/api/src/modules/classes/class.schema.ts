import { z } from 'zod';
import { CreateClassInput, UpdateClassInput, ClassEnrollmentInput, EnrollmentStatus } from '@cipansor/shared';

// Query params
export const listClassesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  unitId: z.string().uuid().optional(),
  academicYearId: z.string().uuid().optional(),
  level: z.string().optional(),
});

// Create class
export const createClassSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  unitId: z.string().uuid('Invalid unit ID'),
  academicYearId: z.string().uuid('Invalid academic year ID'),
  level: z.string().min(1, 'Level is required'), // e.g., "1", "2", "VII", "VIII"
  capacity: z.number().int().min(1).max(100).default(30),
  homeroomTeacherId: z.string().uuid().optional().nullable(),
});

// Update class
export const updateClassSchema: z.ZodType<UpdateClassInput> = z.object({
  name: z.string().min(1).optional(),
  level: z.string().min(1).optional(),
  capacity: z.number().int().min(1).max(100).optional(),
  homeroomTeacherId: z.string().uuid().optional().nullable(),
}).partial();
// Actually, UpdateClassInput extends Partial<CreateClassInput>, so we should allow partial here.
// The .partial() call makes everything optional, which matches UpdateClassInput.

// ID param
export const classIdParamSchema = z.object({
  id: z.string().uuid('Invalid class ID'),
});

// Enrollment schemas
export const enrollStudentSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
});

export const updateEnrollmentSchema = z.object({
  status: z.nativeEnum(EnrollmentStatus),
});

// Types - Re-export shared types for local convenience if needed, or just use shared.
export type ListClassesQuery = z.infer<typeof listClassesQuerySchema>;
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>;
// CreateClassInput, UpdateClassInput are now from shared.
