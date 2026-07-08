import { z } from 'zod';

export const createEvaluationSchema = z.object({
  pkId: z.string().uuid(),
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
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

export const updateEvaluationSchema = z.object({
  status: z.enum(['DRAFT', 'PROPOSED', 'APPROVED']).optional(),
  feedback: z.string().optional(),
  notes: z.string().optional(),
});

export const createBehavioralValueSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  weight: z.number().min(0),
});
