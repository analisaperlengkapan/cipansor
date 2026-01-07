import { z } from 'zod';

// Enums matching Prisma schema
export const TakhosusStatusEnum = z.enum(['ACTIVE', 'COMPLETED', 'DROPPED', 'SUSPENDED']);
export const HalaqohDayEnum = z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']);
export const MurojaahTypeEnum = z.enum(['YAUMIYAH', 'USBUIYAH', 'SYAHRIYAH', 'TASMI']);
export const SimaanTypeEnum = z.enum(['BIN_NAZHR', 'BIL_GHAIB', 'TAHDIR', 'TASMI', 'KHATAM']);
export const TahfidzMistakeTypeEnum = z.enum(['LAHIN_JALI', 'LAHIN_KHAFI', 'TAJWID', 'LUPA', 'URUTAN']);

// =====================================
// HALAQOH SCHEMAS
// =====================================

export const listHalaqohQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  unitId: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
  level: z.coerce.number().min(1).max(5).optional(),
});

export const createHalaqohSchema = z.object({
  unitId: z.string().uuid('Invalid unit ID'),
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().min(1, 'Code is required').max(20),
  teacherId: z.string().uuid('Invalid teacher ID'),
  level: z.coerce.number().min(1).max(5).default(1),
  capacity: z.coerce.number().min(1).default(15),
  scheduleDay: z.array(HalaqohDayEnum).min(1, 'At least one schedule day is required'),
  scheduleTime: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateHalaqohSchema = createHalaqohSchema.partial();

// =====================================
// TAKHOSUS ENROLLMENT SCHEMAS
// =====================================

export const listEnrollmentQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  halaqohId: z.string().uuid().optional(),
  status: TakhosusStatusEnum.optional(),
  studentId: z.string().uuid().optional(),
});

export const createEnrollmentSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  halaqohId: z.string().uuid().optional(),
  targetJuz: z.coerce.number().min(1).max(30).default(30),
  targetCompletionDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const updateEnrollmentSchema = z.object({
  halaqohId: z.string().uuid().optional().nullable(),
  status: TakhosusStatusEnum.optional(),
  targetJuz: z.coerce.number().min(1).max(30).optional(),
  targetCompletionDate: z.string().datetime().optional().nullable(),
  completedJuz: z.coerce.number().min(0).max(30).optional(),
  currentJuz: z.coerce.number().min(1).max(30).optional(),
  notes: z.string().optional(),
});

// =====================================
// SANAD RECORD SCHEMAS
// =====================================

export const listSanadQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  enrollmentId: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional(),
});

export const createSanadSchema = z.object({
  enrollmentId: z.string().uuid('Invalid enrollment ID'),
  teacherId: z.string().uuid('Invalid teacher ID'),
  juz: z.coerce.number().min(1).max(30, 'Juz must be between 1-30'),
  surahStart: z.coerce.number().min(1).max(114).optional(),
  surahEnd: z.coerce.number().min(1).max(114).optional(),
  certifiedAt: z.string().datetime().optional(),
  grade: z.enum(['MUMTAZ', 'JAYYID_JIDDAN', 'JAYYID', 'MAQBUL']).optional(),
  notes: z.string().optional(),
});

export const updateSanadSchema = createSanadSchema.partial().omit({ enrollmentId: true });

// =====================================
// TARGET SCHEMAS
// =====================================

export const createTargetSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  academicYearId: z.string().uuid('Invalid academic year ID'),
  targetJuz: z.coerce.number().min(1).max(30),
  targetAyah: z.coerce.number().optional(),
  notes: z.string().optional(),
});

export const updateTargetSchema = createTargetSchema.partial();

// =====================================
// MUROJAAH SCHEMAS
// =====================================

export const listMurojaahQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  studentId: z.string().uuid().optional(),
  halaqohId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  type: MurojaahTypeEnum.optional(),
});

export const createMurojaahSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  murojaahType: MurojaahTypeEnum,
  murojaahDate: z.string().datetime(),
  juzStart: z.coerce.number().min(1).max(30),
  juzEnd: z.coerce.number().min(1).max(30),
  pagesReviewed: z.coerce.number().min(0).default(0),
  durationMinutes: z.coerce.number().min(0).default(0),
  qualityScore: z.coerce.number().min(0).max(100),
  mistakeCount: z.coerce.number().min(0).default(0),
  fluencyLevel: z.coerce.number().min(0).max(5).default(0), // 1-5 scale
  tajwidScore: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  mistakes: z.array(z.object({
    mistakeType: TahfidzMistakeTypeEnum,
    juz: z.coerce.number(),
    surahNumber: z.coerce.number(),
    ayahNumber: z.coerce.number().optional(),
    description: z.string().optional(),
  })).optional(),
});

export const updateMurojaahSchema = createMurojaahSchema.partial().omit({ studentId: true });

// =====================================
// SIMAAN SCHEMAS
// =====================================

export const listSimaanQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  studentId: z.string().uuid().optional(),
  halaqohId: z.string().uuid().optional(),
  status: z.enum(['PASSED', 'FAILED', 'PENDING']).optional(),
});

export const createSimaanSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  simaanType: SimaanTypeEnum,
  examDate: z.string().datetime(),
  juzStart: z.coerce.number().min(1).max(30),
  juzEnd: z.coerce.number().min(1).max(30),
  sessionNumber: z.coerce.number().default(1),
  totalSessions: z.coerce.number().default(1),
  notes: z.string().optional(),
});

export const gradeSimaanSchema = z.object({
  overallScore: z.coerce.number().min(0).max(100),
  tajwidScore: z.coerce.number().min(0).max(100).optional(),
  fashohaScore: z.coerce.number().min(0).max(100).optional(),
  tartilScore: z.coerce.number().min(0).max(100).optional(),
  grade: z.string().optional(),
  passed: z.boolean(),
  notes: z.string().optional(),
  recommendations: z.string().optional(),
});

// =====================================
// PROGRESS SCHEMAS
// =====================================

export const studentProgressQuerySchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
});

// Type exports
export type CreateHalaqohInput = z.infer<typeof createHalaqohSchema>;
export type UpdateHalaqohInput = z.infer<typeof updateHalaqohSchema>;
export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>;
export type CreateSanadInput = z.infer<typeof createSanadSchema>;
export type UpdateSanadInput = z.infer<typeof updateSanadSchema>;
export type CreateTargetInput = z.infer<typeof createTargetSchema>;
export type UpdateTargetInput = z.infer<typeof updateTargetSchema>;
export type CreateMurojaahInput = z.infer<typeof createMurojaahSchema>;
export type UpdateMurojaahInput = z.infer<typeof updateMurojaahSchema>;
export type CreateSimaanInput = z.infer<typeof createSimaanSchema>;
export type GradeSimaanInput = z.infer<typeof gradeSimaanSchema>;
