import { z } from 'zod';

// Query params
export const listAcademicYearsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  isActive: z.string().transform(v => v === 'true').optional(),
});

// Create academic year
export const createAcademicYearSchema = z.object({
  name: z.string().min(4, 'Academic year name is required (e.g., 2024/2025)'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isActive: z.boolean().default(false),
}).refine((data) => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

// Update academic year
export const updateAcademicYearSchema = z.object({
  name: z.string().min(4).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
});

// ID param
export const academicYearIdParamSchema = z.object({
  id: z.string().uuid('Invalid academic year ID'),
});

// Types
export type ListAcademicYearsQuery = z.infer<typeof listAcademicYearsQuerySchema>;
export type CreateAcademicYearInput = z.infer<typeof createAcademicYearSchema>;
export type UpdateAcademicYearInput = z.infer<typeof updateAcademicYearSchema>;
