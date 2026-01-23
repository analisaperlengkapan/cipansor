import { z } from 'zod';

// Transaction types
export const TRANSACTION_TYPES = ['TOPUP', 'PURCHASE', 'REFUND', 'TRANSFER'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

// Reference types
export const REFERENCE_TYPES = ['CANTEEN', 'LAUNDRY', 'TRANSFER', 'OTHER'] as const;
export type ReferenceType = (typeof REFERENCE_TYPES)[number];

// List wallets query
export const listWalletsQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
  search: z.string().optional(),
  unitId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  minBalance: z.coerce.number().optional(),
  maxBalance: z.coerce.number().optional(),
});
export type ListWalletsQuery = z.infer<typeof listWalletsQuerySchema>;

// Get wallet by student
export const getWalletByStudentSchema = z.object({
  studentId: z.string().uuid(),
});

// Top up wallet
export const topUpWalletSchema = z.object({
  studentId: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'QRIS']).optional().default('CASH'),
});
export type TopUpWalletInput = z.infer<typeof topUpWalletSchema>;

// Deduct from wallet (purchase)
export const deductWalletSchema = z.object({
  studentId: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional(),
  referenceType: z.enum(REFERENCE_TYPES).optional(),
  reference: z.string().optional(),
});
export type DeductWalletInput = z.infer<typeof deductWalletSchema>;

// Transfer between wallets
export const transferWalletSchema = z.object({
  fromStudentId: z.string().uuid(),
  toStudentId: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional(),
});
export type TransferWalletInput = z.infer<typeof transferWalletSchema>;

// Refund to wallet
export const refundWalletSchema = z.object({
  studentId: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  description: z.string(),
  referenceType: z.enum(REFERENCE_TYPES).optional(),
  reference: z.string().optional(),
});
export type RefundWalletInput = z.infer<typeof refundWalletSchema>;

// List transactions query
export const listTransactionsQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  walletId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  type: z.enum(TRANSACTION_TYPES).optional(),
  referenceType: z.enum(REFERENCE_TYPES).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;

// Bulk top up (for admin)
export const bulkTopUpSchema = z.object({
  studentIds: z.array(z.string().uuid()).min(1, 'At least one student required'),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional(),
});
export type BulkTopUpInput = z.infer<typeof bulkTopUpSchema>;

// Wallet summary response
export const walletSummarySchema = z.object({
  totalWallets: z.number(),
  totalBalance: z.number(),
  averageBalance: z.number(),
  walletsWithLowBalance: z.number(),
  todayTransactions: z.number(),
  todayTopUps: z.number(),
  todayPurchases: z.number(),
});
export type WalletSummary = z.infer<typeof walletSummarySchema>;
