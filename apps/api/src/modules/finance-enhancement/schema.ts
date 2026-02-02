import { z } from 'zod';
import {
  AccountType,
  JournalReferenceType,
  ScholarshipType,
  ScholarshipSource,
  PaymentCategory,
} from '@cipansor/shared';

// ==================== ACCOUNT CODES ====================

export const createAccountCodeSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  type: z.nativeEnum(AccountType),
  parentId: z.string().optional(),
  isActive: z.boolean().optional(),
  normalBalance: z.enum(['DEBIT', 'CREDIT']).optional(),
  cashFlowCategory: z.string().optional(),
});

export const updateAccountCodeSchema = createAccountCodeSchema.partial();

export type CreateAccountCodeInput = z.infer<typeof createAccountCodeSchema>;
export type UpdateAccountCodeInput = z.infer<typeof updateAccountCodeSchema>;

// ==================== JOURNAL ENTRIES ====================

export const createJournalEntrySchema = z
  .object({
    unitId: z.string().uuid(),
    accountId: z.string().uuid(),
    date: z
      .string()
      .datetime()
      .or(z.date().transform((d) => d.toISOString())),
    description: z.string().optional(),
    debit: z.number().min(0).optional(),
    credit: z.number().min(0).optional(),
    reference: z.string().optional(),
    referenceType: z.nativeEnum(JournalReferenceType).optional(),
  })
  .refine((data) => (data.debit || 0) > 0 || (data.credit || 0) > 0, {
    message: 'Either debit or credit must be greater than 0',
  });

export const createManualJournalSchema = z.object({
  unitId: z.string().uuid(),
  date: z
    .string()
    .datetime()
    .or(z.date().transform((d) => d.toISOString())),
  description: z.string().min(1),
  entries: z
    .array(
      z.object({
        accountId: z.string().uuid(),
        debit: z.number().min(0),
        credit: z.number().min(0),
      })
    )
    .min(2, 'Must have at least 2 entries')
    .refine(
      (entries) => {
        const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
        const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);
        return Math.abs(totalDebit - totalCredit) < 0.01;
      },
      { message: 'Journal entries must be balanced (Debit = Credit)' }
    ),
});

export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;
export type CreateManualJournalInput = z.infer<typeof createManualJournalSchema>;

// ==================== SCHOLARSHIPS ====================

export const createScholarshipSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  source: z.nativeEnum(ScholarshipSource),
  type: z.nativeEnum(ScholarshipType),
  quota: z.number().int().positive().optional(),
  requirements: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  unitId: z.string().uuid(),
  isActive: z.boolean().optional(),
});

export const assignScholarshipSchema = z.object({
  scholarshipId: z.string().uuid(),
  studentId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export type CreateScholarshipInput = z.infer<typeof createScholarshipSchema>;
export type AssignScholarshipInput = z.infer<typeof assignScholarshipSchema>;

// ==================== PAYMENT COMPONENTS ====================

export const createPaymentComponentSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.nativeEnum(PaymentCategory),
  amount: z.number().min(0),
  unitId: z.string().uuid(),
  isActive: z.boolean().optional(),
});

export type CreatePaymentComponentInput = z.infer<typeof createPaymentComponentSchema>;
