import { Router } from 'express';
import * as service from './rapor-pesantren.service';
import {
  getRaporQuerySchema,
  listRaporQuerySchema,
  generateBatchRaporSchema,
  updateRaporSchema,
  raporConfigSchema,
  getLegerQuerySchema,
} from './rapor-pesantren.schema';
import { authenticate, authorize } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { ApiResponse } from '@/utils/response';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: RaporPesantren
 *   description: Integrated Pesantren Report Card Management
 */

/**
 * @swagger
 * /api/rapor-pesantren/generate:
 *   post:
 *     summary: Generate rapor pesantren for a student
 *     tags: [RaporPesantren]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/generate',
  authenticate,
  validate(getRaporQuerySchema),
  async (req, res, next) => {
    try {
      const result = await service.generateRaporPesantren(req.body);
      res.status(201).json(ApiResponse.success(result, 'Rapor generated successfully'));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/rapor-pesantren/generate-batch:
 *   post:
 *     summary: Generate rapor for multiple students
 *     tags: [RaporPesantren]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/generate-batch',
  authenticate,
  authorize('SUPER_ADMIN', 'UNIT_ADMIN'),
  validate(generateBatchRaporSchema),
  async (req, res, next) => {
    try {
      const result = await service.generateBatchRaporPesantren(req.body);
      res.json(ApiResponse.success(result, `Generated ${result.success}/${result.total} rapor`));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/rapor-pesantren/leger:
 *   get:
 *     summary: Get leger pesantren for a class
 *     tags: [RaporPesantren]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/leger',
  authenticate,
  authorize('SUPER_ADMIN', 'UNIT_ADMIN', 'TEACHER'),
  validate(getLegerQuerySchema),
  async (req, res, next) => {
    try {
      const result = await service.getLegerPesantren(req.query as any);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/rapor-pesantren:
 *   get:
 *     summary: List all rapor pesantren
 *     tags: [RaporPesantren]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const query = listRaporQuerySchema.parse(req.query);
    const result = await service.listRaporPesantren(query);
    res.json(ApiResponse.paginated(result.data, result.meta.page, result.meta.limit, result.meta.total));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/rapor-pesantren/{id}:
 *   get:
 *     summary: Get rapor pesantren by ID
 *     tags: [RaporPesantren]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const rapor = await service.getRaporPesantrenById(req.params.id);
    if (!rapor) {
      return res.status(404).json(ApiResponse.error('Rapor not found'));
    }
    res.json(ApiResponse.success(rapor));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/rapor-pesantren/{id}:
 *   put:
 *     summary: Update rapor pesantren
 *     tags: [RaporPesantren]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  authenticate,
  validate(updateRaporSchema),
  async (req, res, next) => {
    try {
      const result = await service.updateRaporPesantren(req.params.id, req.body);
      res.json(ApiResponse.success(result, 'Rapor updated successfully'));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/rapor-pesantren/{id}:
 *   delete:
 *     summary: Delete rapor pesantren
 *     tags: [RaporPesantren]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'UNIT_ADMIN'),
  async (req, res, next) => {
    try {
      await service.deleteRaporPesantren(req.params.id);
      res.json(ApiResponse.success(null, 'Rapor deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/rapor-pesantren/config/{unitId}:
 *   get:
 *     summary: Get rapor configuration for a unit
 *     tags: [RaporPesantren]
 *     security:
 *       - bearerAuth: []
 */
router.get('/config/:unitId', authenticate, async (req, res, next) => {
  try {
    const config = await service.getRaporConfig(req.params.unitId);
    res.json(ApiResponse.success(config));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/rapor-pesantren/config:
 *   put:
 *     summary: Update rapor configuration
 *     tags: [RaporPesantren]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/config',
  authenticate,
  authorize('SUPER_ADMIN', 'UNIT_ADMIN'),
  validate(raporConfigSchema),
  async (req, res, next) => {
    try {
      const config = await service.saveRaporConfig(req.body);
      res.json(ApiResponse.success(config, 'Configuration saved successfully'));
    } catch (error) {
      next(error);
    }
  }
);

export default router;
