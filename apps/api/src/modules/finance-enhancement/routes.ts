import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { UserRole } from '@prisma/client';
import { financeEnhancementController } from './finance-enhancement.controller';
import {
  createAccountCodeSchema,
  updateAccountCodeSchema,
  createJournalEntrySchema,
  createScholarshipSchema,
  assignScholarshipSchema,
  createPaymentComponentSchema,
} from './schema';
import { z } from 'zod';

// Minimal schemas for new endpoints (should be moved to schema.ts properly)
const createBudgetSchema = z.object({
  body: z.object({
    unitId: z.string().uuid(),
    academicYearId: z.string().uuid(),
    accountId: z.string().uuid(),
    amount: z.number().positive(),
    periodType: z.enum(['YEARLY', 'MONTHLY']).optional(),
    notes: z.string().optional(),
  }),
});

const updateBudgetSchema = z.object({
  body: z.object({
    amount: z.number().positive().optional(),
    periodType: z.enum(['YEARLY', 'MONTHLY']).optional(),
    notes: z.string().optional(),
  }),
});

const createFinancialPeriodSchema = z.object({
  body: z.object({
    unitId: z.string().uuid(),
    name: z.string().min(1),
    startDate: z.string().datetime().or(z.date()),
    endDate: z.string().datetime().or(z.date()),
    notes: z.string().optional(),
  }),
});

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== ACCOUNT CODES ====================

router.get('/account-codes', financeEnhancementController.getAccountCodes);

router.post(
  '/account-codes',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(createAccountCodeSchema),
  financeEnhancementController.createAccountCode
);

router.put(
  '/account-codes/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(updateAccountCodeSchema),
  financeEnhancementController.updateAccountCode
);

// ==================== JOURNAL ENTRIES ====================

router.get(
  '/journal-entries',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  financeEnhancementController.getJournalEntries
);

router.post(
  '/journal-entries',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(createJournalEntrySchema),
  financeEnhancementController.createJournalEntry
);

router.get('/journal-entries/:id', financeEnhancementController.getJournalEntryById);

// ==================== SCHOLARSHIPS ====================

router.get('/scholarships', financeEnhancementController.getScholarships);

router.post(
  '/scholarships',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(createScholarshipSchema),
  financeEnhancementController.createScholarship
);

router.get('/scholarships/:id', financeEnhancementController.getScholarshipById);

router.get('/scholarships/:id/recipients', financeEnhancementController.getScholarshipRecipients);

router.post(
  '/scholarship-recipients',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(assignScholarshipSchema),
  financeEnhancementController.assignScholarship
);

// ==================== PAYMENT COMPONENTS ====================

router.get('/payment-components', financeEnhancementController.getPaymentComponents);

router.post(
  '/payment-components',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(createPaymentComponentSchema),
  financeEnhancementController.createPaymentComponent
);

// ==================== REPORTS ====================

router.get(
  '/reports/trial-balance',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  financeEnhancementController.getTrialBalance
);

router.get(
  '/reports/income-expense',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  financeEnhancementController.getIncomeExpenseReport
);

router.get(
  '/reports/income-statement',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  financeEnhancementController.getIncomeExpenseReport
);

router.get(
  '/reports/cash-flow',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  financeEnhancementController.getCashFlowStatement
);

router.get(
  '/reports/budget-realization',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  financeEnhancementController.getBudgetRealizationReport
);

// ==================== BUDGETS ====================

router.get(
  '/budgets',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  financeEnhancementController.getBudgets
);

router.post(
  '/budgets',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(createBudgetSchema),
  financeEnhancementController.createBudget
);

router.put(
  '/budgets/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(updateBudgetSchema),
  financeEnhancementController.updateBudget
);

// ==================== FINANCIAL PERIODS ====================

router.get(
  '/financial-periods',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  financeEnhancementController.getFinancialPeriods
);

router.post(
  '/financial-periods',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(createFinancialPeriodSchema),
  financeEnhancementController.createFinancialPeriod
);

router.patch(
  '/financial-periods/:id/close',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  financeEnhancementController.closeFinancialPeriod
);

// ==================== NEW REPORTS ====================

router.get(
  '/reports/balance-sheet',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  financeEnhancementController.getBalanceSheet
);

export default router;
