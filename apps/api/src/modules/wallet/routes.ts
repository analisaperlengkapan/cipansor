import { Router, Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { walletService } from './service';
import {
  listWalletsQuerySchema,
  topUpWalletSchema,
  deductWalletSchema,
  transferWalletSchema,
  refundWalletSchema,
  listTransactionsQuerySchema,
  bulkTopUpSchema,
} from './wallet.schema';
import { ApiResponse } from '../../utils/response';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/wallet - List all wallets
 */
router.get(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = listWalletsQuerySchema.parse(req.query);
      const result = await walletService.listWallets(query);
      return res.json(ApiResponse.success(result.data, 'Daftar wallet berhasil diambil', result.meta));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/wallet/summary - Get wallet summary/statistics
 */
router.get(
  '/summary',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { unitId } = req.query;
      const summary = await walletService.getSummary(unitId as string);
      return res.json(ApiResponse.success(summary, 'Summary wallet berhasil diambil'));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/wallet/transactions - List all transactions
 */
router.get(
  '/transactions',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = listTransactionsQuerySchema.parse(req.query);
      const result = await walletService.listTransactions(query);
      return res.json(ApiResponse.success(result.data, 'Daftar transaksi berhasil diambil', result.meta));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/wallet/:studentId - Get wallet by student ID
 */
router.get(
  '/:studentId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentId } = req.params;
      const wallet = await walletService.getWalletByStudent(studentId);
      return res.json(ApiResponse.success(wallet, 'Wallet berhasil diambil'));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/wallet/:studentId/transactions - Get transactions for a student
 */
router.get(
  '/:studentId/transactions',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentId } = req.params;
      const query = listTransactionsQuerySchema.parse({
        ...req.query,
        studentId,
      });
      const result = await walletService.listTransactions(query);
      return res.json(ApiResponse.success(result.data, 'Transaksi wallet berhasil diambil', result.meta));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/wallet/topup - Top up wallet
 */
router.post(
  '/topup',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  validate(topUpWalletSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.sub;
      const result = await walletService.topUp(req.body, userId);
      return res.status(201).json(ApiResponse.success(result, 'Top up berhasil'));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/wallet/bulk-topup - Bulk top up wallets
 */
router.post(
  '/bulk-topup',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(bulkTopUpSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.sub;
      const result = await walletService.bulkTopUp(req.body, userId);
      return res.status(201).json(ApiResponse.success(result, 'Bulk top up selesai'));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/wallet/deduct - Deduct from wallet
 */
router.post(
  '/deduct',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  validate(deductWalletSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.sub;
      const result = await walletService.deduct(req.body, userId);
      return res.json(ApiResponse.success(result, 'Pengurangan saldo berhasil'));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/wallet/transfer - Transfer between wallets
 */
router.post(
  '/transfer',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  validate(transferWalletSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.sub;
      const result = await walletService.transfer(req.body, userId);
      return res.json(ApiResponse.success(result, 'Transfer berhasil'));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/wallet/refund - Refund to wallet
 */
router.post(
  '/refund',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  validate(refundWalletSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.sub;
      const result = await walletService.refund(req.body, userId);
      return res.json(ApiResponse.success(result, 'Refund berhasil'));
    } catch (error) {
      next(error);
    }
  }
);

export default router;
