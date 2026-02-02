import { z } from 'zod';

// ============================================
// Enums
// ============================================

export const MurojaahTypeEnum = z.enum(['YAUMIYAH', 'USBUIYAH', 'SYAHRIYAH', 'TASMI']);
export const SimaanTypeEnum = z.enum(['BIN_NAZHR', 'BIL_GHAIB', 'TAHDIR', 'TASMI', 'KHATAM']);

// ============================================
// Murojaah Schemas
// ============================================

const mistakeSchema = z.object({
  mistakeType: z.enum(['LAHIN_JALI', 'LAHIN_KHAFI', 'TAJWID', 'LUPA', 'URUTAN']),
  juz: z.number().int(),
  surahNumber: z.number().int(),
  ayahNumber: z.number().int().optional(),
  description: z.string().optional(),
});

export const createMurojaahSchema = z.object({
  studentId: z.string().uuid(),
  teacherId: z.string().uuid(),
  murojaahDate: z.string().datetime(), // ISO Date string
  murojaahType: MurojaahTypeEnum,
  juzStart: z.number().int().min(1).max(30),
  juzEnd: z.number().int().min(1).max(30),
  pagesReviewed: z.number().int().min(0),
  durationMinutes: z.number().int().min(0),
  qualityScore: z.number().min(0).max(100),
  fluencyLevel: z.number().min(0).max(10), // 0-10 scale
  notes: z.string().optional(),
  mistakes: z.array(mistakeSchema).optional(),
});

export const updateMurojaahSchema = createMurojaahSchema.partial();

export const listMurojaahQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  studentId: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  type: MurojaahTypeEnum.optional(),
});

// ============================================
// Simaan Schemas
// ============================================

export const createSimaanSchema = z.object({
  studentId: z.string().uuid(),
  examDate: z.string().datetime(),
  simaanType: SimaanTypeEnum,
  juzStart: z.number().int().min(1).max(30),
  juzEnd: z.number().int().min(1).max(30),
  durationMinutes: z.number().int().min(0).optional(),
  examinerIds: z.array(z.string().uuid()).min(1),
  notes: z.string().optional(),
  startJuz: z.number().optional(),
  endJuz: z.number().optional(),
  examType: z.string().optional(), // JUZ_30, etc.
});

export const updateSimaanResultSchema = z.object({
  overallScore: z.number().min(0).max(100),
  tajwidScore: z.number().min(0).max(100).optional(),
  fashohaScore: z.number().min(0).max(100).optional(),
  tartilScore: z.number().min(0).max(100).optional(),
  grade: z.string().optional(),
  passed: z.boolean(),
  notes: z.string().optional(),
  recommendations: z.string().optional(),
});

export const listSimaanQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  studentId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'PASSED', 'FAILED']).optional(),
});

// ============================================
// Sanad Schemas
// ============================================

export const createSanadSchema = z.object({
  enrollmentId: z.string().uuid(),
  teacherId: z.string().uuid(),
  juz: z.number().int().min(1).max(30),
  surahStart: z.number().optional(),
  surahEnd: z.number().optional(),
  certifiedAt: z.string().datetime(),
  grade: z.string().optional(),
  notes: z.string().optional(),
});

export const updateSanadSchema = createSanadSchema.partial();

// ============================================
// Halaqoh Schemas (Added)
// ============================================

export const createHalaqohSchema = z.object({
  unitId: z.string().uuid(),
  name: z.string().min(3),
  teacherId: z.string().uuid(),
  level: z.number().int().min(1),
  scheduleDay: z.array(z.string()),
  scheduleTime: z.string(),
  location: z.string().optional(),
});

export const updateHalaqohSchema = createHalaqohSchema.partial();

// ============================================
// Enrollment Schemas (Added)
// ============================================

export const createEnrollmentSchema = z.object({
  studentId: z.string().uuid(),
  halaqohId: z.string().uuid(),
  status: z.string().optional(),
  targetJuz: z.number().int().min(1).max(30).optional(),
  targetCompletionDate: z.string().datetime().optional(),
});

export const updateEnrollmentSchema = createEnrollmentSchema.partial();

// ============================================
// Target Schemas (Added)
// ============================================

export const createTargetSchema = z.object({
  studentId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  targetJuz: z.number().int().min(1),
  targetAyah: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});

export const updateTargetSchema = createTargetSchema.partial();

// ============================================
// Types
// ============================================

export type CreateMurojaahInput = z.infer<typeof createMurojaahSchema>;
export type UpdateMurojaahInput = z.infer<typeof updateMurojaahSchema>;
export type ListMurojaahQuery = z.infer<typeof listMurojaahQuerySchema>;

export type CreateSimaanInput = z.infer<typeof createSimaanSchema>;
export type UpdateSimaanResultInput = z.infer<typeof updateSimaanResultSchema>;
export type ListSimaanQuery = z.infer<typeof listSimaanQuerySchema>;

export type CreateSanadInput = z.infer<typeof createSanadSchema>;
export type UpdateSanadInput = z.infer<typeof updateSanadSchema>;

export type CreateHalaqohInput = z.infer<typeof createHalaqohSchema>;
export type UpdateHalaqohInput = z.infer<typeof updateHalaqohSchema>;

export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>;

export type CreateTargetInput = z.infer<typeof createTargetSchema>;
export type UpdateTargetInput = z.infer<typeof updateTargetSchema>;
