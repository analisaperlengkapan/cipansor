import { z } from 'zod';

export const createEvidenceSchema = z.object({
  body: z.object({
    unitId: z.string().uuid(),
    indicatorId: z.string().uuid(),
    academicYearId: z.string().uuid(),
    name: z.string().min(3),
    fileUrl: z.string().url(),
    description: z.string().optional(),
  }),
});

export const createAuditSchema = z.object({
  body: z.object({
    unitId: z.string().uuid(),
    academicYearId: z.string().uuid(),
    code: z.string(),
    name: z.string(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }),
});
