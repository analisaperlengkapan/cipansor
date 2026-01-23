import { z } from 'zod';

// ============================================
// Enums
// ============================================

export const SimaanTypeEnum = z.enum(['JUZ_AMMA', 'ONE_JUZ', 'FIVE_JUZ', 'TEN_JUZ', 'FULL_QURAN']);

// ============================================
// Query Schemas
// ============================================

export const listSimaanQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  studentId: z.string().uuid().optional(),
  enrollmentId: z.string().uuid().optional(),
  halaqohId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  simaanType: SimaanTypeEnum.optional(),
  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  passed: z.coerce.boolean().optional(),
  search: z.string().min(1).optional(),
});

export const studentSimaanSummarySchema = z.object({
  studentId: z.string().uuid(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  simaanType: SimaanTypeEnum.optional(),
});

export const halaqohSimaanQuerySchema = z.object({
  halaqohId: z.string().uuid(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

// ============================================
// Create/Update Schemas
// ============================================

export const createExaminerSchema = z.object({
  simaanId: z.string().uuid(),
  examinerId: z.string().uuid(),
  score: z.number().min(0).max(100).optional(),
  notes: z.string().max(1000).optional(),
});

export const createExaminerForSimaanSchema = z.object({
  examinerId: z.string().uuid(),
  score: z.number().min(0).max(100).optional(),
  notes: z.string().max(1000).optional(),
});

export const createSimaanSchema = z
  .object({
    studentId: z.string().uuid(),
    enrollmentId: z.string().uuid().optional(),
    halaqohId: z.string().uuid().optional(),
    simaanType: SimaanTypeEnum,
    examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    sessionNumber: z.number().int().min(1).default(1),
    totalSessions: z.number().int().min(1).default(1),
    juzStart: z.number().int().min(1).max(30),
    juzEnd: z.number().int().min(1).max(30),
    overallScore: z.number().min(0).max(100).optional(),
    tajwidScore: z.number().min(0).max(100).optional(),
    fashohaScore: z.number().min(0).max(100).optional(),
    tartilScore: z.number().min(0).max(100).optional(),
    grade: z.enum(['MUMTAZ', 'JAYYID_JIDDAN', 'JAYYID', 'MAQBUL', 'RASIB']).optional(),
    passed: z.boolean().default(false),
    notes: z.string().max(2000).optional(),
    recommendations: z.string().max(2000).optional(),
    examiners: z.array(createExaminerForSimaanSchema).optional(),
  })
  .refine((data) => data.juzEnd >= data.juzStart, {
    message: 'juzEnd must be greater than or equal to juzStart',
    path: ['juzEnd'],
  });

export const updateSimaanSchema = z
  .object({
    simaanType: SimaanTypeEnum.optional(),
    examDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    sessionNumber: z.number().int().min(1).optional(),
    totalSessions: z.number().int().min(1).optional(),
    juzStart: z.number().int().min(1).max(30).optional(),
    juzEnd: z.number().int().min(1).max(30).optional(),
    overallScore: z.number().min(0).max(100).nullable().optional(),
    tajwidScore: z.number().min(0).max(100).nullable().optional(),
    fashohaScore: z.number().min(0).max(100).nullable().optional(),
    tartilScore: z.number().min(0).max(100).nullable().optional(),
    grade: z.enum(['MUMTAZ', 'JAYYID_JIDDAN', 'JAYYID', 'MAQBUL', 'RASIB']).nullable().optional(),
    passed: z.boolean().optional(),
    notes: z.string().max(2000).nullable().optional(),
    recommendations: z.string().max(2000).nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.juzStart !== undefined && data.juzEnd !== undefined) {
        return data.juzEnd >= data.juzStart;
      }
      return true;
    },
    {
      message: 'juzEnd must be greater than or equal to juzStart',
      path: ['juzEnd'],
    }
  );

export const updateExaminerSchema = z.object({
  score: z.number().min(0).max(100).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

// ============================================
// Scoring Schemas
// ============================================

export const submitScoresSchema = z.object({
  simaanId: z.string().uuid(),
  overallScore: z.number().min(0).max(100),
  tajwidScore: z.number().min(0).max(100).optional(),
  fashohaScore: z.number().min(0).max(100).optional(),
  tartilScore: z.number().min(0).max(100).optional(),
  grade: z.enum(['MUMTAZ', 'JAYYID_JIDDAN', 'JAYYID', 'MAQBUL', 'RASIB']),
  passed: z.boolean(),
  notes: z.string().max(2000).optional(),
  recommendations: z.string().max(2000).optional(),
});

// ============================================
// Type Exports
// ============================================

export type ListSimaanQuery = z.infer<typeof listSimaanQuerySchema>;
export type CreateSimaanInput = z.infer<typeof createSimaanSchema>;
export type UpdateSimaanInput = z.infer<typeof updateSimaanSchema>;
export type CreateExaminerInput = z.infer<typeof createExaminerSchema>;
export type UpdateExaminerInput = z.infer<typeof updateExaminerSchema>;
export type SubmitScoresInput = z.infer<typeof submitScoresSchema>;
export type StudentSimaanSummaryQuery = z.infer<typeof studentSimaanSummarySchema>;
export type HalaqohSimaanQuery = z.infer<typeof halaqohSimaanQuerySchema>;
