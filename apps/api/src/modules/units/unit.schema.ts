import { z } from 'zod';

// Query params
export const listUnitsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  type: z.enum(['PESANTREN', 'PAUD', 'SD_IT', 'SMP_IT', 'SMA_QURAN', 'OTHER']).optional(),
});

// Create unit
export const createUnitSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  type: z.enum(['PESANTREN', 'PAUD', 'SD_IT', 'SMP_IT', 'SMA_QURAN', 'OTHER']),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  logoUrl: z.string().url().optional(),
});

// Update unit
export const updateUnitSchema = z.object({
  name: z.string().min(3).optional(),
  type: z.enum(['PESANTREN', 'PAUD', 'SD_IT', 'SMP_IT', 'SMA_QURAN', 'OTHER']).optional(),
  address: z.string().min(5).optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
});

// ID param
export const unitIdParamSchema = z.object({
  id: z.string().uuid('Invalid unit ID'),
});

// Types
export type ListUnitsQuery = z.infer<typeof listUnitsQuerySchema>;
export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
