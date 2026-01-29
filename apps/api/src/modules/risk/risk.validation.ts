import { z } from 'zod';
import {
  RiskCategory,
  RiskLikelihood,
  RiskImpact,
  MitigationStrategy,
  RiskLevel,
} from '@prisma/client';

export const createRiskSchema = z.object({
  unitId: z.string().uuid().optional(),
  academicYearId: z.string().uuid().optional(),
  code: z.string().min(3),
  description: z.string().min(10),
  category: z.nativeEnum(RiskCategory),
  cause: z.string().optional(),
  consequence: z.string().optional(),
  likelihood: z.nativeEnum(RiskLikelihood),
  impact: z.nativeEnum(RiskImpact),
  ownerId: z.string().uuid().optional(),
  status: z.string().optional(),
});

export const updateRiskSchema = createRiskSchema.partial();

export const listRiskQuerySchema = z.object({
  category: z.nativeEnum(RiskCategory).optional(),
  riskLevel: z.nativeEnum(RiskLevel).optional(),
  unitId: z.string().uuid().optional(),
});

export const createMitigationSchema = z.object({
  riskId: z.string().uuid(),
  strategy: z.nativeEnum(MitigationStrategy),
  actionPlan: z.string().min(5),
  picId: z.string().uuid().optional(),
  deadline: z
    .string()
    .optional()
    .transform((str) => (str ? new Date(str) : undefined)),
  notes: z.string().optional(),
});

export const updateMitigationSchema = createMitigationSchema
  .partial()
  .omit({ riskId: true })
  .extend({
    picId: z.string().uuid().nullable().optional(),
    isCompleted: z.boolean().optional(),
    progress: z.number().min(0).max(100).optional(),
  });
