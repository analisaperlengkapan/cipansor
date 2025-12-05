import { Router, Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  CreatePricingSchema,
  UpdatePricingSchema,
  CreateTransactionSchema,
  UpdateStatusSchema,
  ProcessPaymentSchema,
  ListTransactionsQuerySchema,
} from './laundry.schema';
import { pricingService, transactionService } from './service';
import { ApiResponse } from '../../utils/response';

const router = Router();

// =============================================================================
// PRICING ROUTES
// =============================================================================

// GET /api/laundry/pricing - Get all pricing
router.get(
  '/pricing',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = req.user?.unitId;
      if (!unitId) {
        return res.status(400).json(ApiResponse.error('Unit ID tidak ditemukan', 'UNIT_REQUIRED'));
      }

      const pricing = await pricingService.getAll(unitId);
      return res.json(ApiResponse.success(pricing, 'Berhasil mengambil data harga layanan'));
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/laundry/pricing/:id - Get pricing by ID
router.get(
  '/pricing/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = req.user?.unitId;
      if (!unitId) {
        return res.status(400).json(ApiResponse.error('Unit ID tidak ditemukan', 'UNIT_REQUIRED'));
      }

      const pricing = await pricingService.getById(req.params.id, unitId);
      if (!pricing) {
        return res.status(404).json(ApiResponse.error('Harga layanan tidak ditemukan', 'NOT_FOUND'));
      }

      return res.json(ApiResponse.success(pricing, 'Berhasil mengambil data harga layanan'));
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/laundry/pricing - Create pricing
router.post(
  '/pricing',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(CreatePricingSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = req.user?.unitId;
      if (!unitId) {
        return res.status(400).json(ApiResponse.error('Unit ID tidak ditemukan', 'UNIT_REQUIRED'));
      }

      const pricing = await pricingService.create(unitId, req.body);
      return res.status(201).json(ApiResponse.success(pricing, 'Harga layanan berhasil dibuat'));
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/laundry/pricing/:id - Update pricing
router.put(
  '/pricing/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(UpdatePricingSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = req.user?.unitId;
      if (!unitId) {
        return res.status(400).json(ApiResponse.error('Unit ID tidak ditemukan', 'UNIT_REQUIRED'));
      }

      const pricing = await pricingService.update(req.params.id, unitId, req.body);
      return res.json(ApiResponse.success(pricing, 'Harga layanan berhasil diperbarui'));
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/laundry/pricing/:id - Delete pricing
router.delete(
  '/pricing/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = req.user?.unitId;
      if (!unitId) {
        return res.status(400).json(ApiResponse.error('Unit ID tidak ditemukan', 'UNIT_REQUIRED'));
      }

      await pricingService.delete(req.params.id, unitId);
      return res.json(ApiResponse.success(null, 'Harga layanan berhasil dihapus'));
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// TRANSACTION ROUTES
// =============================================================================

// GET /api/laundry/transactions - Get all transactions
router.get(
  '/transactions',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = req.user?.unitId;
      if (!unitId) {
        return res.status(400).json(ApiResponse.error('Unit ID tidak ditemukan', 'UNIT_REQUIRED'));
      }

      const parsedQuery = ListTransactionsQuerySchema.parse(req.query);
      const result = await transactionService.getAll(unitId, parsedQuery);
      return res.json(ApiResponse.success(result.data, 'Berhasil mengambil data transaksi', result.pagination));
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/laundry/transactions/stats - Get statistics
router.get(
  '/transactions/stats',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = req.user?.unitId;
      if (!unitId) {
        return res.status(400).json(ApiResponse.error('Unit ID tidak ditemukan', 'UNIT_REQUIRED'));
      }

      const { startDate, endDate } = req.query;
      const stats = await transactionService.getStats(
        unitId,
        startDate as string,
        endDate as string
      );
      return res.json(ApiResponse.success(stats, 'Berhasil mengambil statistik laundry'));
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/laundry/transactions/ready - Get ready for pickup
router.get(
  '/transactions/ready',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = req.user?.unitId;
      if (!unitId) {
        return res.status(400).json(ApiResponse.error('Unit ID tidak ditemukan', 'UNIT_REQUIRED'));
      }

      const transactions = await transactionService.getReadyForPickup(unitId);
      return res.json(ApiResponse.success(transactions, 'Berhasil mengambil data laundry siap diambil'));
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/laundry/transactions/student/:studentId - Get student's active laundry
router.get(
  '/transactions/student/:studentId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = req.user?.unitId;
      if (!unitId) {
        return res.status(400).json(ApiResponse.error('Unit ID tidak ditemukan', 'UNIT_REQUIRED'));
      }

      const transactions = await transactionService.getByStudent(req.params.studentId, unitId);
      return res.json(ApiResponse.success(transactions, 'Berhasil mengambil data laundry santri'));
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/laundry/transactions/:id - Get transaction by ID
router.get(
  '/transactions/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = req.user?.unitId;
      if (!unitId) {
        return res.status(400).json(ApiResponse.error('Unit ID tidak ditemukan', 'UNIT_REQUIRED'));
      }

      const transaction = await transactionService.getById(req.params.id, unitId);
      if (!transaction) {
        return res.status(404).json(ApiResponse.error('Transaksi tidak ditemukan', 'NOT_FOUND'));
      }

      return res.json(ApiResponse.success(transaction, 'Berhasil mengambil data transaksi'));
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/laundry/transactions - Create transaction
router.post(
  '/transactions',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  validate(CreateTransactionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = req.user?.unitId;
      const userId = req.user?.sub;
      if (!unitId || !userId) {
        return res.status(400).json(ApiResponse.error('Unit ID atau User ID tidak ditemukan', 'REQUIRED'));
      }

      const transaction = await transactionService.create(unitId, userId, req.body);
      return res.status(201).json(ApiResponse.success(transaction, 'Transaksi laundry berhasil dibuat'));
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/laundry/transactions/:id/status - Update status
router.patch(
  '/transactions/:id/status',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  validate(UpdateStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = req.user?.unitId;
      const userId = req.user?.sub;
      if (!unitId || !userId) {
        return res.status(400).json(ApiResponse.error('Unit ID atau User ID tidak ditemukan', 'REQUIRED'));
      }

      const transaction = await transactionService.updateStatus(
        req.params.id,
        unitId,
        userId,
        req.body
      );
      return res.json(ApiResponse.success(transaction, 'Status laundry berhasil diperbarui'));
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/laundry/transactions/:id/pay - Process payment
router.post(
  '/transactions/:id/pay',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  validate(ProcessPaymentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = req.user?.unitId;
      const userId = req.user?.sub;
      if (!unitId || !userId) {
        return res.status(400).json(ApiResponse.error('Unit ID atau User ID tidak ditemukan', 'REQUIRED'));
      }

      const transaction = await transactionService.processPayment(
        req.params.id,
        unitId,
        userId,
        req.body
      );
      return res.json(ApiResponse.success(transaction, 'Pembayaran laundry berhasil'));
    } catch (err) {
      next(err);
    }
  }
);

export default router;
