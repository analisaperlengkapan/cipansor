import { z } from 'zod';

export const createProgramSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  category: z.string().min(1),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budget: z.number().positive().optional(),
  picId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
});

export const updateProgramSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'SUSPENDED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budget: z.number().positive().optional(),
  picId: z.string().uuid().nullable().optional(),
  progress: z.number().min(0).max(100).optional(),
});

export const createWasteSchema = z.object({
  category: z.enum(['ORGANIC', 'INORGANIC', 'B3', 'PAPER', 'ELECTRONIC', 'OTHER']),
  weight: z.number().positive(),
  method: z.string().min(1),
  recordDate: z.string().datetime(),
  notes: z.string().optional(),
  unitId: z.string().uuid().optional(),
});

export const createIndicatorSchema = z.object({
  name: z.string().min(3),
  category: z.string().min(1),
  targetValue: z.number(),
  currentValue: z.number().optional(),
  unit: z.string().min(1),
  period: z.string().min(1),
  recordDate: z.string().datetime(),
  notes: z.string().optional(),
  unitId: z.string().uuid().optional(),
});

export const updateIndicatorSchema = z.object({
  name: z.string().min(3).optional(),
  category: z.string().optional(),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  unit: z.string().optional(),
  period: z.string().optional(),
  notes: z.string().optional(),
});
