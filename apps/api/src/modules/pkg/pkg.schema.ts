import { z } from 'zod';

export const createPeriodSchema = z.object({
  body: z.object({
    unitId: z.string().uuid(),
    academicYearId: z.string().uuid(),
    name: z.string().min(1).max(200),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    description: z.string().optional(),
  }),
});

export const updatePeriodSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    description: z.string().optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  }),
});

export const createEvaluationSchema = z.object({
  body: z.object({
    periodId: z.string().uuid(),
    teacherId: z.string().uuid(),
    assessorId: z.string().uuid().optional(),
  }),
});

export const submitScoresSchema = z.object({
  body: z.object({
    scores: z.array(
      z.object({
        detailId: z.string().uuid(),
        selfScore: z.number().min(1).max(4).optional(),
        assessorScore: z.number().min(1).max(4).optional(),
        evidence: z.string().optional(),
        notes: z.string().optional(),
      }),
    ),
  }),
});

export const addDocumentSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    type: z.enum(['RPP', 'SILABUS', 'NILAI', 'SERTIFIKAT', 'KEHADIRAN', 'LAINNYA']),
    fileUrl: z.string().url(),
    fileSize: z.number().optional(),
  }),
});
