import { z } from 'zod';

export const createPKSchema = z.object({
  strategicPlanId: z.string().uuid().optional(),
  supervisorId: z.string().uuid().optional(),
  supervisorPkId: z.string().uuid().optional(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  notes: z.string().optional(),
});

// Status is deliberately NOT updatable here — it only changes through the
// propose/approve/reject workflow endpoints.
export const updatePKSchema = z.object({
  notes: z.string().optional(),
  supervisorId: z.string().uuid().optional(),
  strategicPlanId: z.string().uuid().optional(),
});

export const rejectPKSchema = z.object({
  revisionNotes: z.string().min(3),
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
  unit: z.string().min(1).optional(),
  weight: z.number().min(0).max(100).optional(),
  category: z.enum(['DIRECT', 'INDIRECT', 'NON_CASCADING']).optional(),
  refIndicatorId: z.string().uuid().nullable().optional(),
  refStrategicIndicatorId: z.string().uuid().nullable().optional(),
  notes: z.string().optional(),
});
