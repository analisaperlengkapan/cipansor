import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as controller from './controller';
import { bosController } from './bos.controller';
import * as accountingController from './accounting.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate, validateQuery } from '../../middleware/error';
import {
  queryPaymentTypeSchema,
  queryInvoiceSchema,
  queryPaymentSchema,
  createAccountSchema,
  updateAccountSchema,
  queryAccountSchema,
  createJournalSchema,
  queryJournalSchema,
  queryReportSchema,
} from './schema';

const router = Router();

router.use(authenticate);

// ==================== PAYMENT TYPES ====================

/**
 * @swagger
 * /api/finance/payment-types:
 *   get:
 *     summary: List payment types
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of payment types
 */
router.get(
  '/payment-types',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  validateQuery(queryPaymentTypeSchema),
  controller.getPaymentTypes
);

/**
 * @swagger
 * /api/finance/payment-types:
 *   post:
 *     summary: Create payment type
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - amount
 *             properties:
 *               name:
 *                 type: string
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               unitId:
 *                 type: string
 *               isRecurring:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Payment type created
 */
router.post(
  '/payment-types',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  controller.createPaymentType
);

/**
 * @swagger
 * /api/finance/payment-types/{id}:
 *   get:
 *     summary: Get payment type by ID
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment type details
 *       404:
 *         description: Payment type not found
 */
router.get(
  '/payment-types/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  controller.getPaymentTypeById
);

/**
 * @swagger
 * /api/finance/payment-types/{id}:
 *   put:
 *     summary: Update payment type
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Payment type updated
 */
router.put(
  '/payment-types/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  controller.updatePaymentType
);

/**
 * @swagger
 * /api/finance/payment-types/{id}:
 *   delete:
 *     summary: Delete payment type
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Payment type deleted
 */
router.delete(
  '/payment-types/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  controller.deletePaymentType
);

// ==================== INVOICES ====================

/**
 * @swagger
 * /api/finance/invoices:
 *   get:
 *     summary: List invoices
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PARTIAL, PAID, OVERDUE, CANCELLED]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of invoices
 */
router.get(
  '/invoices',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  validateQuery(queryInvoiceSchema),
  controller.getInvoices
);

/**
 * @swagger
 * /api/finance/invoices:
 *   post:
 *     summary: Create invoice
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - items
 *               - dueDate
 *             properties:
 *               studentId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     paymentTypeId:
 *                       type: string
 *                     amount:
 *                       type: number
 *               dueDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Invoice created
 */
router.post(
  '/invoices',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  controller.createInvoice
);

/**
 * @swagger
 * /api/finance/invoices/{id}:
 *   get:
 *     summary: Get invoice by ID
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice details with items and payments
 *       404:
 *         description: Invoice not found
 */
router.get(
  '/invoices/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF, UserRole.PARENT),
  controller.getInvoiceById
);

/**
 * @swagger
 * /api/finance/invoices/{id}:
 *   put:
 *     summary: Update invoice
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice updated
 */
router.put(
  '/invoices/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  controller.updateInvoice
);

/**
 * @swagger
 * /api/finance/invoices/{id}:
 *   delete:
 *     summary: Delete invoice
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Invoice deleted
 */
router.delete(
  '/invoices/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  controller.deleteInvoice
);

// ==================== PAYMENTS ====================

/**
 * @swagger
 * /api/finance/payments:
 *   get:
 *     summary: List payments
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: invoiceId
 *         schema:
 *           type: string
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [CASH, TRANSFER, QRIS, VA]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of payments
 */
router.get(
  '/payments',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  validateQuery(queryPaymentSchema),
  controller.getPayments
);

/**
 * @swagger
 * /api/finance/payments:
 *   post:
 *     summary: Create payment
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invoiceId
 *               - amount
 *               - method
 *             properties:
 *               invoiceId:
 *                 type: string
 *               amount:
 *                 type: number
 *               method:
 *                 type: string
 *                 enum: [CASH, TRANSFER, QRIS, VA]
 *               reference:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment created
 */
router.post(
  '/payments',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  controller.createPayment
);

/**
 * @swagger
 * /api/finance/payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment details
 *       404:
 *         description: Payment not found
 */
router.get(
  '/payments/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF, UserRole.PARENT),
  controller.getPaymentById
);

// ==================== ANALYTICS ====================

/**
 * @swagger
 * /api/finance/student/{studentId}/summary:
 *   get:
 *     summary: Get student finance summary
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student finance summary (total paid, outstanding, invoices)
 */
router.get(
  '/student/:studentId/summary',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF, UserRole.PARENT),
  controller.getStudentFinanceSummary
);

/**
 * @swagger
 * /api/finance/unit/{unitId}/stats:
 *   get:
 *     summary: Get unit finance statistics
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: unitId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unit finance statistics (revenue, collection rate, etc.)
 */
router.get(
  '/unit/:unitId/stats',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  controller.getUnitFinanceStats
);

// ==================== SPP MATRIX ====================

/**
 * @swagger
 * /api/finance/spp-matrix:
 *   get:
 *     summary: Get SPP payment matrix (12 months x students)
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: paymentTypeId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: SPP matrix with payment status per student per month
 */
router.get(
  '/spp-matrix',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  controller.getSppMatrix
);

/**
 * @swagger
 * /api/finance/spp-matrix/generate:
 *   post:
 *     summary: Generate bulk SPP invoices for a month
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentTypeId
 *               - year
 *               - month
 *             properties:
 *               unitId:
 *                 type: string
 *               classId:
 *                 type: string
 *               paymentTypeId:
 *                 type: string
 *               year:
 *                 type: integer
 *               month:
 *                 type: integer
 *                 description: 0-11 (January = 0)
 *               dueDay:
 *                 type: integer
 *                 default: 10
 *     responses:
 *       201:
 *         description: Bulk invoices generated
 */
router.post(
  '/spp-matrix/generate',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  controller.generateBulkSppInvoices
);

// ==================== BOS MANAGEMENT ====================

/**
 * @swagger
 * /api/finance/bos/components:
 *   get:
 *     summary: Get BOS component categories
 *     tags: [Finance - BOS]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of BOS components (8 komponen)
 */
router.get(
  '/bos/components',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  bosController.getComponents
);

/**
 * @swagger
 * /api/finance/bos/summary:
 *   get:
 *     summary: Get BOS usage summary
 *     tags: [Finance - BOS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: quarter
 *         schema:
 *           type: integer
 *           enum: [1, 2, 3, 4]
 *     responses:
 *       200:
 *         description: BOS summary with component breakdown
 */
router.get(
  '/bos/summary',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  bosController.getSummary
);

/**
 * @swagger
 * /api/finance/bos/allocations:
 *   post:
 *     summary: Create BOS allocation plan
 *     tags: [Finance - BOS]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - unitId
 *               - year
 *               - quarter
 *               - totalAmount
 *               - allocations
 *             properties:
 *               unitId:
 *                 type: string
 *               year:
 *                 type: integer
 *               quarter:
 *                 type: integer
 *               totalAmount:
 *                 type: number
 *               allocations:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     componentCode:
 *                       type: string
 *                     amount:
 *                       type: number
 *     responses:
 *       201:
 *         description: BOS allocation created
 */
router.post(
  '/bos/allocations',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  bosController.createAllocation
);

/**
 * @swagger
 * /api/finance/bos/expenses:
 *   post:
 *     summary: Record BOS expense
 *     tags: [Finance - BOS]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - unitId
 *               - componentCode
 *               - date
 *               - amount
 *               - description
 *             properties:
 *               unitId:
 *                 type: string
 *               componentCode:
 *                 type: string
 *                 enum: [BOS-01, BOS-02, BOS-03, BOS-04, BOS-05, BOS-06, BOS-07, BOS-08]
 *               date:
 *                 type: string
 *                 format: date
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               receiptNumber:
 *                 type: string
 *               vendor:
 *                 type: string
 *     responses:
 *       201:
 *         description: BOS expense recorded
 */
router.post(
  '/bos/expenses',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  bosController.recordExpense
);

/**
 * @swagger
 * /api/finance/bos/transparency/{unitId}/{year}:
 *   get:
 *     summary: Get BOS transparency report
 *     tags: [Finance - BOS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: unitId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: BOS transparency report for public display
 */
router.get(
  '/bos/transparency/:unitId/:year',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  bosController.getTransparencyReport
);

/**
 * @swagger
 * /api/finance/bos/quarterly/{unitId}/{year}/{quarter}:
 *   get:
 *     summary: Get BOS quarterly report
 *     tags: [Finance - BOS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: unitId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: quarter
 *         required: true
 *         schema:
 *           type: integer
 *           enum: [1, 2, 3, 4]
 *     responses:
 *       200:
 *         description: BOS quarterly report
 */
router.get(
  '/bos/quarterly/:unitId/:year/:quarter',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  bosController.getQuarterlyReport
);

/**
 * @swagger
 * /api/finance/bos/validate/{unitId}/{year}:
 *   get:
 *     summary: Validate BOS usage compliance
 *     tags: [Finance - BOS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: unitId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: BOS validation result
 */
router.get(
  '/bos/validate/:unitId/:year',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  bosController.validateUsage
);

// ==================== ACCOUNTING ====================

/**
 * @swagger
 * /api/finance/accounting/accounts:
 *   get:
 *     summary: List chart of accounts
 *     tags: [Finance - Accounting]
 */
router.get(
  '/accounting/accounts',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  validateQuery(queryAccountSchema),
  accountingController.getAccounts
);

/**
 * @swagger
 * /api/finance/accounting/accounts:
 *   post:
 *     summary: Create account
 *     tags: [Finance - Accounting]
 */
router.post(
  '/accounting/accounts',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(createAccountSchema),
  accountingController.createAccount
);

/**
 * @swagger
 * /api/finance/accounting/accounts/{id}:
 *   put:
 *     summary: Update account
 *     tags: [Finance - Accounting]
 */
router.put(
  '/accounting/accounts/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(updateAccountSchema),
  accountingController.updateAccount
);

/**
 * @swagger
 * /api/finance/accounting/accounts/{id}:
 *   get:
 *     summary: Get account details
 *     tags: [Finance - Accounting]
 */
router.get(
  '/accounting/accounts/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  accountingController.getAccountById
);

/**
 * @swagger
 * /api/finance/accounting/accounts/{id}:
 *   delete:
 *     summary: Delete account
 *     tags: [Finance - Accounting]
 */
router.delete(
  '/accounting/accounts/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  accountingController.deleteAccount
);

// ==================== JOURNALS ====================

/**
 * @swagger
 * /api/finance/accounting/journals:
 *   get:
 *     summary: Get journal entries (General Ledger)
 *     tags: [Finance - Accounting]
 */
router.get(
  '/accounting/journals',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  validateQuery(queryJournalSchema),
  accountingController.getJournals
);

/**
 * @swagger
 * /api/finance/accounting/journals:
 *   post:
 *     summary: Create manual journal entry
 *     tags: [Finance - Accounting]
 */
router.post(
  '/accounting/journals',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(createJournalSchema),
  accountingController.createJournal
);

// ==================== REPORTS ====================

/**
 * @swagger
 * /api/finance/accounting/reports/trial-balance:
 *   get:
 *     summary: Get Trial Balance report
 *     tags: [Finance - Accounting]
 */
router.get(
  '/accounting/reports/trial-balance',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  validateQuery(queryReportSchema),
  accountingController.getTrialBalance
);

/**
 * @swagger
 * /api/finance/accounting/reports/balance-sheet:
 *   get:
 *     summary: Get Balance Sheet report
 *     tags: [Finance - Accounting]
 */
router.get(
  '/accounting/reports/balance-sheet',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  validateQuery(queryReportSchema),
  accountingController.getBalanceSheet
);

/**
 * @swagger
 * /api/finance/accounting/reports/income-statement:
 *   get:
 *     summary: Get Income Statement report
 *     tags: [Finance - Accounting]
 */
router.get(
  '/accounting/reports/income-statement',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  validateQuery(queryReportSchema),
  accountingController.getIncomeStatement
);

export default router;
