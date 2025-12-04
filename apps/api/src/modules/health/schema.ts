import { z } from "zod";

const MedicalRecordType = z.enum(["CHECKUP", "ILLNESS", "INJURY", "FIRST_AID", "REFERRAL"]);

// Medical Record schemas
export const createMedicalRecordSchema = z.object({
  studentId: z.string().uuid(),
  type: MedicalRecordType,
  visitDate: z.coerce.date(),
  complaint: z.string().min(1),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  prescription: z.string().optional(),
  notes: z.string().optional(),
  referredTo: z.string().optional(),
  followUpDate: z.coerce.date().optional(),
});

export const updateMedicalRecordSchema = createMedicalRecordSchema.partial().omit({ studentId: true });

export const queryMedicalRecordSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  studentId: z.string().uuid().optional(),
  type: MedicalRecordType.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// Medication schemas
export const createMedicationSchema = z.object({
  unitId: z.string().uuid(),
  name: z.string().min(1).max(255),
  genericName: z.string().optional(),
  type: z.string().min(1).max(50), // tablet, sirup, salep
  dosageForm: z.string().min(1).max(50), // 500mg, 60ml
  quantity: z.number().int().nonnegative().default(0),
  minStock: z.number().int().positive().default(10),
  expiryDate: z.coerce.date().optional(),
  supplier: z.string().optional(),
  notes: z.string().optional(),
});

export const updateMedicationSchema = createMedicationSchema.partial().omit({ unitId: true });

export const queryMedicationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  unitId: z.string().uuid().optional(),
  search: z.string().optional(),
  lowStock: z.coerce.boolean().optional(),
  expired: z.coerce.boolean().optional(),
});

// Medication Usage Log schemas
export const createMedicationUsageSchema = z.object({
  medicationId: z.string().uuid(),
  studentId: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
  reason: z.string().min(1),
});

export const queryMedicationUsageSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  medicationId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type CreateMedicalRecordInput = z.infer<typeof createMedicalRecordSchema>;
export type UpdateMedicalRecordInput = z.infer<typeof updateMedicalRecordSchema>;
export type QueryMedicalRecordInput = z.infer<typeof queryMedicalRecordSchema>;
export type CreateMedicationInput = z.infer<typeof createMedicationSchema>;
export type UpdateMedicationInput = z.infer<typeof updateMedicationSchema>;
export type QueryMedicationInput = z.infer<typeof queryMedicationSchema>;
export type CreateMedicationUsageInput = z.infer<typeof createMedicationUsageSchema>;
export type QueryMedicationUsageInput = z.infer<typeof queryMedicationUsageSchema>;
