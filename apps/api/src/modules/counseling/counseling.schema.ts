import { z } from 'zod';

// Enums matching Prisma
export const CounselingCategory = z.enum([
  'ACADEMIC',
  'CAREER',
  'PERSONAL',
  'SOCIAL',
  'FAMILY',
  'SPIRITUAL',
  'PSYCHOLOGICAL_OBSERVATION',
  'OTHER',
]);

export const CounselingStatus = z.enum([
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
]);

export const CounselingPriority = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const ReferralType = z.enum(['INTERNAL', 'EXTERNAL', 'PARENT', 'MEDICAL']);

// List sessions query
export const listSessionsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  unitId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  counselorId: z.string().uuid().optional(),
  category: CounselingCategory.optional(),
  status: CounselingStatus.optional(),
  priority: CounselingPriority.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type ListSessionsQuery = z.infer<typeof listSessionsQuerySchema>;

// Create session
export const createSessionSchema = z.object({
  unitId: z.string().uuid(),
  studentId: z.string().uuid(),
  counselorId: z.string().uuid(),
  category: CounselingCategory,
  priority: CounselingPriority.default('MEDIUM'),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  scheduledAt: z.string().datetime().or(z.date()),
  duration: z.number().int().positive().optional(),
  location: z.string().optional(),
  isConfidential: z.boolean().default(true),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

// Update session
export const updateSessionSchema = z.object({
  category: CounselingCategory.optional(),
  priority: CounselingPriority.optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  scheduledAt: z.string().datetime().or(z.date()).optional(),
  duration: z.number().int().positive().optional(),
  location: z.string().optional(),
  status: CounselingStatus.optional(),
  summary: z.string().optional(),
  recommendations: z.string().optional(),
  followUpDate: z.string().datetime().or(z.date()).optional().nullable(),
  isConfidential: z.boolean().optional(),
  parentNotified: z.boolean().optional(),
});

export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;

// Start session
export const startSessionSchema = z.object({
  notes: z.string().optional(),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;

// Complete session
export const completeSessionSchema = z.object({
  summary: z.string().min(1),
  recommendations: z.string().optional(),
  followUpDate: z.string().datetime().or(z.date()).optional(),
});

export type CompleteSessionInput = z.infer<typeof completeSessionSchema>;

// Create note
export const createNoteSchema = z.object({
  sessionId: z.string().uuid(),
  content: z.string().min(1),
  noteType: z.enum(['general', 'observation', 'assessment']).default('general'),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;

// Create referral
export const createReferralSchema = z.object({
  sessionId: z.string().uuid(),
  type: ReferralType,
  referredTo: z.string().min(1),
  institution: z.string().optional(),
  reason: z.string().min(1),
  contactInfo: z.string().optional(),
  followUpDate: z.string().datetime().or(z.date()).optional(),
});

export type CreateReferralInput = z.infer<typeof createReferralSchema>;

// Update referral
export const updateReferralSchema = z.object({
  outcome: z.string().optional(),
  followUpDate: z.string().datetime().or(z.date()).optional().nullable(),
});

export type UpdateReferralInput = z.infer<typeof updateReferralSchema>;

// Student counseling history
export const studentHistoryQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  category: CounselingCategory.optional(),
  status: CounselingStatus.optional(),
});

export type StudentHistoryQuery = z.infer<typeof studentHistoryQuerySchema>;
