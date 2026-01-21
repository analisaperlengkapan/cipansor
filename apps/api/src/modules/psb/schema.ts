import { z } from 'zod';
import { AdmissionStatus } from '@prisma/client';

// Admission Period schemas
export const createAdmissionPeriodSchema = z.object({
  unitId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  name: z.string().min(3).max(200),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  quota: z.number().int().min(0).default(0),
  registrationFee: z.number().min(0).default(0),
  requirements: z.string().optional(),
});

export const updateAdmissionPeriodSchema = createAdmissionPeriodSchema
  .partial()
  .omit({ unitId: true, academicYearId: true });

export const queryAdmissionPeriodSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  unitId: z.string().uuid().optional(),
  academicYearId: z.string().uuid().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

// Registrant schemas
export const createRegistrantSchema = z.object({
  admissionPeriodId: z.string().uuid(),
  name: z.string().min(2).max(100),
  gender: z.enum(['MALE', 'FEMALE']),
  birthPlace: z.string().min(2).max(100),
  birthDate: z.string().datetime(),
  address: z.string().min(5),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  previousSchool: z.string().max(200).optional(),
  parentName: z.string().min(2).max(100),
  parentPhone: z.string().min(8).max(20),
  parentEmail: z.string().email().optional(),
  parentOccupation: z.string().max(100).optional(),
  // Marketing fields
  source: z.string().optional(),
  campaignId: z.string().uuid().optional(),
});

export const updateRegistrantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  address: z.string().min(5).optional(),
  previousSchool: z.string().max(200).optional(),
  parentName: z.string().min(2).max(100).optional(),
  parentPhone: z.string().min(8).max(20).optional(),
  parentEmail: z.string().email().optional(),
  parentOccupation: z.string().max(100).optional(),
  notes: z.string().optional(),
});

export const updateRegistrantScoreSchema = z.object({
  testScore: z.number().min(0).max(100).optional(),
  interviewScore: z.number().min(0).max(100).optional(),
  tahfidzScore: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

export const updateRegistrantStatusSchema = z.object({
  status: z.nativeEnum(AdmissionStatus),
  notes: z.string().optional(),
});

export const queryRegistrantSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  admissionPeriodId: z.string().uuid().optional(),
  status: z.nativeEnum(AdmissionStatus).optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  search: z.string().optional(),
});

// Registrant Document schemas
export const createRegistrantDocumentSchema = z.object({
  registrantId: z.string().uuid(),
  name: z.string().min(2).max(200),
  type: z.enum(['akta', 'ijazah', 'kk', 'foto', 'rapor', 'lainnya']),
  fileUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

export const verifyDocumentSchema = z.object({
  isVerified: z.boolean(),
  notes: z.string().optional(),
});

export type CreateAdmissionPeriodInput = z.infer<typeof createAdmissionPeriodSchema>;
export type UpdateAdmissionPeriodInput = z.infer<typeof updateAdmissionPeriodSchema>;
export type CreateRegistrantInput = z.infer<typeof createRegistrantSchema>;
export type UpdateRegistrantInput = z.infer<typeof updateRegistrantSchema>;
export type UpdateRegistrantScoreInput = z.infer<typeof updateRegistrantScoreSchema>;
export type UpdateRegistrantStatusInput = z.infer<typeof updateRegistrantStatusSchema>;
export type CreateRegistrantDocumentInput = z.infer<typeof createRegistrantDocumentSchema>;
