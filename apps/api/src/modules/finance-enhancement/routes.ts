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
  createPaymentComponentSchema
} from './schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== ACCOUNT CODES ====================

router.get(
  '/account-codes',
  financeEnhancementController.getAccountCodes
);

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

router.get(
  '/journal-entries/:id',
  financeEnhancementController.getJournalEntryById
);

// ==================== SCHOLARSHIPS ====================

router.get(
  '/scholarships',
  financeEnhancementController.getScholarships
);

router.post(
  '/scholarships',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(createScholarshipSchema),
  financeEnhancementController.createScholarship
);

router.get(
  '/scholarships/:id',
  financeEnhancementController.getScholarshipById
);

router.get(
  '/scholarships/:id/recipients',
  financeEnhancementController.getScholarshipRecipients
);

router.post(
  '/scholarship-recipients',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(assignScholarshipSchema),
  financeEnhancementController.assignScholarship
);

// ==================== PAYMENT COMPONENTS ====================

router.get(
  '/payment-components',
  financeEnhancementController.getPaymentComponents
);

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

export default router;
