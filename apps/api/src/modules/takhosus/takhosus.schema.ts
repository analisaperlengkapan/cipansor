import { z } from 'zod';

// Enums matching Prisma schema
export const TakhosusStatusEnum = z.enum(['ACTIVE', 'COMPLETED', 'DROPPED', 'SUSPENDED']);
export const HalaqohDayEnum = z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']);

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
