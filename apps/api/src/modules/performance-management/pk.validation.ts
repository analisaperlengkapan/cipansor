import { z } from 'zod';

export const createPKSchema = z.object({
  strategicPlanId: z.string().uuid().optional(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  notes: z.string().optional(),
  supervisorId: z.string().uuid().optional(),
});

export const updatePKSchema = z.object({
  status: z.enum(['DRAFT', 'PROPOSED', 'APPROVED', 'REVISED', 'REJECTED']).optional(),
  notes: z.string().optional(),
  revisionNotes: z.string().optional(),
  supervisorId: z.string().uuid().optional(),
});

export const createPKIndicatorSchema = z.object({
  pkId: z.string().uuid(),
  title: z.string().min(3),
  target: z.number().nonnegative(),
  unit: z.string().min(1),
  weight: z.number().min(0).max(100),
  category: z.enum(['DIRECT', 'INDIRECT', 'NON_CASCADING']),
  refIndicatorId: z.string().uuid().optional(),
  refStrategicIndicatorId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const updatePKIndicatorSchema = z.object({
  title: z.string().min(3).optional(),
  target: z.number().nonnegative().optional(),
  unit: z.string().optional(),
  weight: z.number().min(0).max(100).optional(),
  category: z.enum(['DIRECT', 'INDIRECT', 'NON_CASCADING']).optional(),
  refIndicatorId: z.string().uuid().optional(),
  refStrategicIndicatorId: z.string().uuid().optional(),
  notes: z.string().optional(),
});
