import { z } from "zod";
import { PaymentStatus, PaymentMethod } from "@prisma/client";

// =====================================
// PAYMENT TYPE SCHEMAS
// =====================================

export const createPaymentTypeSchema = z.object({
  unitId: z.string().uuid("Invalid unit ID"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters"),
  description: z.string().optional(),
  amount: z.number().positive("Amount must be positive"),
  isRecurring: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const updatePaymentTypeSchema = createPaymentTypeSchema.partial().omit({
  unitId: true,
});

export const queryPaymentTypeSchema = z.object({
  unitId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
  isRecurring: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// =====================================
// INVOICE SCHEMAS
// =====================================

export const createInvoiceSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  paymentTypeId: z.string().uuid("Invalid payment type ID"),
  amount: z.number().positive("Amount must be positive"),
  dueDate: z.string().datetime("Invalid due date"),
  period: z.string().optional(),
  notes: z.string().optional(),
});

export const updateInvoiceSchema = z.object({
  amount: z.number().positive().optional(),
  dueDate: z.string().datetime().optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
  notes: z.string().optional(),
});

export const queryInvoiceSchema = z.object({
  studentId: z.string().uuid().optional(),
  paymentTypeId: z.string().uuid().optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  overdue: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// =====================================
// PAYMENT SCHEMAS
// =====================================

export const createPaymentSchema = z.object({
  invoiceId: z.string().uuid("Invalid invoice ID"),
  amount: z.number().positive("Amount must be positive"),
  method: z.nativeEnum(PaymentMethod),
  referenceNo: z.string().optional(),
  notes: z.string().optional(),
});

export const queryPaymentSchema = z.object({
  invoiceId: z.string().uuid().optional(),
  method: z.nativeEnum(PaymentMethod).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Type exports
export type CreatePaymentTypeDto = z.infer<typeof createPaymentTypeSchema>;
export type UpdatePaymentTypeDto = z.infer<typeof updatePaymentTypeSchema>;
export type QueryPaymentTypeDto = z.infer<typeof queryPaymentTypeSchema>;

export type CreateInvoiceDto = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceDto = z.infer<typeof updateInvoiceSchema>;
export type QueryInvoiceDto = z.infer<typeof queryInvoiceSchema>;

export type CreatePaymentDto = z.infer<typeof createPaymentSchema>;
export type QueryPaymentDto = z.infer<typeof queryPaymentSchema>;
