import { z } from 'zod';
import { PracticumStatusSchema } from '@cipansor/shared';

export const CreateLessonPlanSchema = z.object({
  academicYearId: z.string().uuid(),
  subject: z.string(),
  topic: z.string(),
  method: z.string(),
  materials: z.string(),
  objectives: z.string(),
  steps: z.any(),
});

export const UpdateLessonPlanSchema = CreateLessonPlanSchema.partial().extend({
  status: PracticumStatusSchema.optional(),
});

export const ReviewLessonPlanSchema = z.object({
  status: z.enum(['APPROVED', 'REVISION_REQUIRED']),
  reviewNotes: z.string().optional(),
});

export const CreateScheduleSchema = z.object({
  lessonPlanId: z.string().uuid(),
  targetClassId: z.string().uuid(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().optional(),
});

export const CreateEvaluationSchema = z.object({
  lessonPlanId: z.string().uuid(),
  isPeer: z.boolean().default(false),
  methodScore: z.number().min(0).max(100),
  contentScore: z.number().min(0).max(100),
  languageScore: z.number().min(0).max(100),
  performanceScore: z.number().min(0).max(100),
  feedback: z.string(),
});
