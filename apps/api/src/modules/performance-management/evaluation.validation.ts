import { z } from 'zod';

export const createEvaluationSchema = z.object({
  pkId: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  feedback: z.string().optional(),
  notes: z.string().optional(),
});

export const updateIndicatorRealizationSchema = z.object({
  indicatorId: z.string().uuid(),
  realization: z.number(),
  activities: z.string().optional(),
});

export const updateBehaviorScoreSchema = z.object({
  behaviorValueId: z.string().uuid(),
  score: z.number().min(0).max(100),
  notes: z.string().optional(),
});

export const createBehavioralValueSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  weight: z.number().min(0),
});

export const updateBehavioralValueSchema = createBehavioralValueSchema
  .partial()
  .extend({ isActive: z.boolean().optional() });

export const approveEvaluationSchema = z.object({
  feedback: z.string().optional(),
});
