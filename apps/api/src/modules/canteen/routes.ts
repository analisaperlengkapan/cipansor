import { Router, Request, Response, NextFunction } from 'express';
import { RoleCode } from '@prisma/client';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  ListCategoriesQuerySchema,
  CreateItemSchema,
  UpdateItemSchema,
  ListItemsQuerySchema,
  CreateTransactionSchema,
  UpdateTransactionStatusSchema,
  ListTransactionsQuerySchema,
  CreateStockMovementSchema,
  ListStockMovementsQuerySchema,
} from './canteen.schema';
import { categoryService, itemService, transactionService, stockMovementService } from './service';
import { ApiResponse } from '../../utils/response';
import { resolveUnitId, isSuperAdminUser } from '../../utils/resolve-unit-id';

const router = Router();

// =============================================================================
// CATEGORY ROUTES
// =============================================================================

// GET /api/canteen/categories - Get all categories
router.get('/categories', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const unitId = resolveUnitId(req);
    // SUPER_ADMIN may list across all units (no unitId scoping required)
    if (!unitId && !isSuperAdminUser(req)) {
      return res.status(400).json(ApiResponse.error('Unit ID tidak ditemukan', 'UNIT_REQUIRED'));
    }

    const parsedQuery = ListCategoriesQuerySchema.parse(req.query);
    const categories = await categoryService.getAll(unitId, parsedQuery.businessUnitId);
    return res.json(ApiResponse.success(categories, 'Berhasil mengambil data kategori'));
  } catch (err) {
    next(err);
  }
});

// GET /api/canteen/categories/:id - Get category by ID
router.get(
  '/categories/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = resolveUnitId(req);
      if (!unitId) {
        return res.status(400).json(ApiResponse.error('Unit ID tidak ditemukan', 'UNIT_REQUIRED'));
      }

      const category = await categoryService.getById(req.params.id, unitId);
      if (!category) {
        return res.status(404).json(ApiResponse.error('Kategori tidak ditemukan', 'NOT_FOUND'));
      }

      return res.json(ApiResponse.success(category, 'Berhasil mengambil data kategori'));
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/canteen/efficiency - Get business efficiency
router.get(
  '/efficiency',
  authenticate,
  authorize(
    RoleCode.SUPER_ADMIN,
    RoleCode.TKQ_ADMIN, RoleCode.SDIT_ADMIN, RoleCode.SMPIT_ADMIN, RoleCode.SMAQ_ADMIN, RoleCode.YAYASAN_ADMIN,
    RoleCode.TKQ_TATA_USAHA, RoleCode.SDIT_TATA_USAHA, RoleCode.SMPIT_TATA_USAHA, RoleCode.SMAQ_TATA_USAHA,
    'UNIT_ADMIN', 'STAFF', // Legacy pre-migration token values
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = resolveUnitId(req);
      if (!unitId && !isSuperAdminUser(req)) {
        return res.status(400).json(ApiResponse.error('Unit ID tidak ditemukan', 'UNIT_REQUIRED'));
      }

      const businessUnitId = req.query.businessUnitId as string | undefined;
      const efficiency = await itemService.getBusinessEfficiency(unitId, businessUnitId);
      return res.json(ApiResponse.success(efficiency, 'Berhasil mengambil data efisiensi'));
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/canteen/categories - Create category
router.post(
  '/categories',
  authenticate,
  authorize(
    RoleCode.SUPER_ADMIN,
    RoleCode.TKQ_ADMIN, RoleCode.SDIT_ADMIN, RoleCode.SMPIT_ADMIN, RoleCode.SMAQ_ADMIN, RoleCode.YAYASAN_ADMIN,
    RoleCode.TKQ_TATA_USAHA, RoleCode.SDIT_TATA_USAHA, RoleCode.SMPIT_TATA_USAHA, RoleCode.SMAQ_TATA_USAHA,
    'UNIT_ADMIN', 'STAFF', // Legacy pre-migration token values
  ),
  validate(CreateCategorySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = resolveUnitId(req);
      if (!unitId) {
        return res.status(400).json(ApiResponse.error('Unit ID tidak ditemukan', 'UNIT_REQUIRED'));
      }

      const category = await categoryService.create(unitId, req.body);
      return res.status(201).json(ApiResponse.success(category, 'Kategori berhasil dibuat'));
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/canteen/categories/:id - Update category
router.put(
  '/categories/:id',
  authenticate,
  authorize(
    RoleCode.SUPER_ADMIN,
    RoleCode.TKQ_ADMIN, RoleCode.SDIT_ADMIN, RoleCode.SMPIT_ADMIN, RoleCode.SMAQ_ADMIN, RoleCode.YAYASAN_ADMIN,
    RoleCode.TKQ_TATA_USAHA, RoleCode.SDIT_TATA_USAHA, RoleCode.SMPIT_TATA_USAHA, RoleCode.SMAQ_TATA_USAHA,
    'UNIT_ADMIN', 'STAFF', // Legacy pre-migration token values
  ),
  validate(UpdateCategorySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = resolveUnitId(req);
      if (!unitId) {
        return res.status(400).json(ApiResponse.error('Unit ID tidak ditemukan', 'UNIT_REQUIRED'));
      }

      const category = await categoryService.update(req.params.id, unitId, req.body);
      return res.json(ApiResponse.success(category, 'Kategori berhasil diperbarui'));
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/canteen/categories/:id - Delete category
router.delete(
  '/categories/:id',
  authenticate,
  authorize(
    RoleCode.SUPER_ADMIN,
    RoleCode.TKQ_ADMIN, RoleCode.SDIT_ADMIN, RoleCode.SMPIT_ADMIN, RoleCode.SMAQ_ADMIN, RoleCode.YAYASAN_ADMIN,
    'UNIT_ADMIN', // Legacy pre-migration token value
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = resolveUnitId(req);
      if (!unitId) {
        return res.status(400).json(ApiResponse.error('Unit ID tidak ditemukan', 'UNIT_REQUIRED'));
      }

      await categoryService.delete(req.params.id, unitId);
      return res.json(ApiResponse.success(null, 'Kategori berhasil dihapus'));
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// ITEM ROUTES
// =============================================================================

// GET /api/canteen/items - Get all items
router.get('/items', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const unitId = resolveUnitId(req);
    // SUPER_ADMIN may list across all units (no unitId scoping required)
    if (!unitId && !isSuperAdminUser(req)) {
      return res.status(400).json(ApiResponse.error('Unit ID tidak ditemukan', 'UNIT_REQUIRED'));
    }

    const parsedQuery = ListItemsQuerySchema.parse(req.query);
    const result = await itemService.getAll(unitId, parsedQuery);
    return res.json(
      ApiResponse.success(result.data, 'Berhasil mengambil data item', result.pagination)
    );
  } catch (err) {
    next(err);
  }
});

// GET /api/canteen/items/low-stock - Get low stock items
router.get(
  '/items/low-stock',
  authenticate,
  authorize(
    RoleCode.SUPER_ADMIN,
    RoleCode.TKQ_ADMIN, RoleCode.SDIT_ADMIN, RoleCode.SMPIT_ADMIN, RoleCode.SMAQ_ADMIN, RoleCode.YAYASAN_ADMIN,
    RoleCode.TKQ_TATA_USAHA, RoleCode.SDIT_TATA_USAHA, RoleCode.SMPIT_TATA_USAHA, RoleCode.SMAQ_TATA_USAHA,
    'UNIT_ADMIN', 'STAFF', // Legacy pre-migration token values
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = resolveUnitId(req);
      // SUPER_ADMIN may view low-stock items across all units
      if (!unitId && !isSuperAdminUser(req)) {
        return res.status(400).json(ApiResponse.error('Unit ID tidak ditemukan', 'UNIT_REQUIRED'));
      }

      const items = await itemService.getLowStockItems(unitId);
      return res.json(ApiResponse.success(items, 'Berhasil mengambil data item stok rendah'));
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/canteen/items/:id - Get item by ID
router.get('/items/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const unitId = resolveUnitId(req);
    if (!unitId) {
      return res.status(400).json(ApiResponse.error('Unit ID tidak ditemukan', 'UNIT_REQUIRED'));
    }

    const item = await itemService.getById(req.params.id, unitId);
    if (!item) {
      return res.status(404).json(ApiResponse.error('Item tidak ditemukan', 'NOT_FOUND'));
    }

    return res.json(ApiResponse.success(item, 'Berhasil mengambil data item'));
  } catch (err) {
    next(err);
  }
});

// POST /api/canteen/items - Create item
router.post(
  '/items',
  authenticate,
  authorize(
    RoleCode.SUPER_ADMIN,
    RoleCode.TKQ_ADMIN, RoleCode.SDIT_ADMIN, RoleCode.SMPIT_ADMIN, RoleCode.SMAQ_ADMIN, RoleCode.YAYASAN_ADMIN,
    RoleCode.TKQ_TATA_USAHA, RoleCode.SDIT_TATA_USAHA, RoleCode.SMPIT_TATA_USAHA, RoleCode.SMAQ_TATA_USAHA,
    'UNIT_ADMIN', 'STAFF', // Legacy pre-migration token values
  ),
  validate(CreateItemSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = resolveUnitId(req);
      if (!unitId) {
        return res.status(400).json(ApiResponse.error('Unit ID tidak ditemukan', 'UNIT_REQUIRED'));
      }

      const item = await itemService.create(unitId, req.body);
      return res.status(201).json(ApiResponse.success(item, 'Item berhasil dibuat'));
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/canteen/items/:id - Update item
router.put(
  '/items/:id',
  authenticate,
  authorize(
    RoleCode.SUPER_ADMIN,
    RoleCode.TKQ_ADMIN, RoleCode.SDIT_ADMIN, RoleCode.SMPIT_ADMIN, RoleCode.SMAQ_ADMIN, RoleCode.YAYASAN_ADMIN,
    RoleCode.TKQ_TATA_USAHA, RoleCode.SDIT_TATA_USAHA, RoleCode.SMPIT_TATA_USAHA, RoleCode.SMAQ_TATA_USAHA,
    'UNIT_ADMIN', 'STAFF', // Legacy pre-migration token values
  ),
  validate(UpdateItemSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = resolveUnitId(req);
      if (!unitId) {
        return res.status(400).json(ApiResponse.error('Unit ID tidak ditemukan', 'UNIT_REQUIRED'));
      }

      const item = await itemService.update(req.params.id, unitId, req.body);
      return res.json(ApiResponse.success(item, 'Item berhasil diperbarui'));
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/canteen/items/:id - Delete item
router.delete(
  '/items/:id',
  authenticate,
  authorize(
    RoleCode.SUPER_ADMIN,
    RoleCode.TKQ_ADMIN, RoleCode.SDIT_ADMIN, RoleCode.SMPIT_ADMIN, RoleCode.SMAQ_ADMIN, RoleCode.YAYASAN_ADMIN,
    'UNIT_ADMIN', // Legacy pre-migration token value
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = resolveUnitId(req);
      if (!unitId) {
        return res.status(400).json(ApiResponse.error('Unit ID tidak ditemukan', 'UNIT_REQUIRED'));
      }

      await itemService.delete(req.params.id, unitId);
      return res.json(ApiResponse.success(null, 'Item berhasil dihapus'));
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// TRANSACTION ROUTES
// =============================================================================

// GET /api/canteen/transactions - Get all transactions
router.get(
  '/transactions',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = resolveUnitId(req);
      // SUPER_ADMIN may list transactions across all units (no unitId scoping
      // required). Consistent with sibling list routes for categories, items,
      // low-stock, and transaction stats in this file.
      if (!unitId && !isSuperAdminUser(req)) {
        return res.status(400).json(ApiResponse.error('Unit ID tidak ditemukan', 'UNIT_REQUIRED'));
      }

      const parsedQuery = ListTransactionsQuerySchema.parse(req.query);
      const result = await transactionService.getAll(unitId, parsedQuery);
      return res.json(
        ApiResponse.success(result.data, 'Berhasil mengambil data transaksi', result.pagination)
      );
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/canteen/transactions/stats - Get transaction statistics
router.get(
  '/transactions/stats',
  authenticate,
  authorize(
    RoleCode.SUPER_ADMIN,
    RoleCode.TKQ_ADMIN, RoleCode.SDIT_ADMIN, RoleCode.SMPIT_ADMIN, RoleCode.SMAQ_ADMIN, RoleCode.YAYASAN_ADMIN,
    RoleCode.TKQ_TATA_USAHA, RoleCode.SDIT_TATA_USAHA, RoleCode.SMPIT_TATA_USAHA, RoleCode.SMAQ_TATA_USAHA,
    'UNIT_ADMIN', 'STAFF', // Legacy pre-migration token values
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = resolveUnitId(req);
      // SUPER_ADMIN may view stats across all units (no unitId scoping required)
      if (!unitId && !isSuperAdminUser(req)) {
        return res.status(400).json(ApiResponse.error('Unit ID tidak ditemukan', 'UNIT_REQUIRED'));
      }

      const { startDate, endDate } = req.query;
      const stats = await transactionService.getStats(
        unitId,
        startDate as string,
        endDate as string
      );
      return res.json(ApiResponse.success(stats, 'Berhasil mengambil statistik transaksi'));
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/canteen/transactions/:id - Get transaction by ID
router.get(
  '/transactions/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = resolveUnitId(req);
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

// POST /api/canteen/transactions - Create transaction
router.post(
  '/transactions',
  authenticate,
  authorize(
    RoleCode.SUPER_ADMIN,
    RoleCode.TKQ_ADMIN, RoleCode.SDIT_ADMIN, RoleCode.SMPIT_ADMIN, RoleCode.SMAQ_ADMIN, RoleCode.YAYASAN_ADMIN,
    RoleCode.TKQ_TATA_USAHA, RoleCode.SDIT_TATA_USAHA, RoleCode.SMPIT_TATA_USAHA, RoleCode.SMAQ_TATA_USAHA,
    'UNIT_ADMIN', 'STAFF', // Legacy pre-migration token values
  ),
  validate(CreateTransactionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = resolveUnitId(req);
      const userId = req.user?.sub;
      if (!unitId || !userId) {
        return res
          .status(400)
          .json(ApiResponse.error('Unit ID atau User ID tidak ditemukan', 'REQUIRED'));
      }

      const transaction = await transactionService.create(unitId, userId, req.body);
      return res.status(201).json(ApiResponse.success(transaction, 'Transaksi berhasil dibuat'));
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/canteen/transactions/:id/status - Update transaction status
router.patch(
  '/transactions/:id/status',
  authenticate,
  authorize(
    RoleCode.SUPER_ADMIN,
    RoleCode.TKQ_ADMIN, RoleCode.SDIT_ADMIN, RoleCode.SMPIT_ADMIN, RoleCode.SMAQ_ADMIN, RoleCode.YAYASAN_ADMIN,
    RoleCode.TKQ_TATA_USAHA, RoleCode.SDIT_TATA_USAHA, RoleCode.SMPIT_TATA_USAHA, RoleCode.SMAQ_TATA_USAHA,
    'UNIT_ADMIN', 'STAFF', // Legacy pre-migration token values
  ),
  validate(UpdateTransactionStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = resolveUnitId(req);
      const userId = req.user?.sub;
      if (!unitId || !userId) {
        return res
          .status(400)
          .json(ApiResponse.error('Unit ID atau User ID tidak ditemukan', 'REQUIRED'));
      }

      const transaction = await transactionService.updateStatus(
        req.params.id,
        unitId,
        userId,
        req.body
      );
      return res.json(ApiResponse.success(transaction, 'Status transaksi berhasil diperbarui'));
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// STOCK MOVEMENT ROUTES
// =============================================================================

// GET /api/canteen/stock-movements - Get all stock movements
router.get(
  '/stock-movements',
  authenticate,
  authorize(
    RoleCode.SUPER_ADMIN,
    RoleCode.TKQ_ADMIN, RoleCode.SDIT_ADMIN, RoleCode.SMPIT_ADMIN, RoleCode.SMAQ_ADMIN, RoleCode.YAYASAN_ADMIN,
    RoleCode.TKQ_TATA_USAHA, RoleCode.SDIT_TATA_USAHA, RoleCode.SMPIT_TATA_USAHA, RoleCode.SMAQ_TATA_USAHA,
    'UNIT_ADMIN', 'STAFF', // Legacy pre-migration token values
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = resolveUnitId(req);
      if (!unitId) {
        return res.status(400).json(ApiResponse.error('Unit ID tidak ditemukan', 'UNIT_REQUIRED'));
      }

      const parsedQuery = ListStockMovementsQuerySchema.parse(req.query);
      const result = await stockMovementService.getAll(unitId, parsedQuery);
      return res.json(
        ApiResponse.success(
          result.data,
          'Berhasil mengambil data pergerakan stok',
          result.pagination
        )
      );
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/canteen/stock-movements - Create stock movement
router.post(
  '/stock-movements',
  authenticate,
  authorize(
    RoleCode.SUPER_ADMIN,
    RoleCode.TKQ_ADMIN, RoleCode.SDIT_ADMIN, RoleCode.SMPIT_ADMIN, RoleCode.SMAQ_ADMIN, RoleCode.YAYASAN_ADMIN,
    RoleCode.TKQ_TATA_USAHA, RoleCode.SDIT_TATA_USAHA, RoleCode.SMPIT_TATA_USAHA, RoleCode.SMAQ_TATA_USAHA,
    'UNIT_ADMIN', 'STAFF', // Legacy pre-migration token values
  ),
  validate(CreateStockMovementSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = resolveUnitId(req);
      const userId = req.user?.sub;
      if (!unitId || !userId) {
        return res
          .status(400)
          .json(ApiResponse.error('Unit ID atau User ID tidak ditemukan', 'REQUIRED'));
      }

      const movement = await stockMovementService.create(unitId, userId, req.body);
      return res
        .status(201)
        .json(ApiResponse.success(movement, 'Pergerakan stok berhasil dicatat'));
    } catch (err) {
      next(err);
    }
  }
);

export default router;
