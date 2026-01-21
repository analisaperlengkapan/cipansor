import { Router } from 'express';
import { authenticate, isSuperAdmin, isAdmin } from '@/middleware/auth';
import { validate, validateQuery, validateParams } from '@/middleware/error';
import * as controller from './unit.controller';
import {
  createUnitSchema,
  updateUnitSchema,
  listUnitsQuerySchema,
  unitIdParamSchema,
} from './unit.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/units:
 *   get:
 *     summary: List units
 *     description: Get list of all units/lembaga
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [PESANTREN, PAUD, SD_IT, SMP_IT, SMA_QURAN, OTHER]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of units
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Unit'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', validateQuery(listUnitsQuerySchema), controller.list);

/**
 * @swagger
 * /api/units/{id}:
 *   get:
 *     summary: Get unit by ID
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Unit details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', validateParams(unitIdParamSchema), controller.getById);

/**
 * @swagger
 * /api/units:
 *   post:
 *     summary: Create unit (Super Admin only)
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Pondok Pesantren Al-Hikmah
 *               type:
 *                 type: string
 *                 enum: [PESANTREN, PAUD, SD_IT, SMP_IT, SMA_QURAN, OTHER]
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               foundationId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Unit created successfully
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', isSuperAdmin, validate(createUnitSchema), controller.create);

/**
 * @swagger
 * /api/units/{id}:
 *   put:
 *     summary: Update unit (Admin only)
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [PESANTREN, PAUD, SD_IT, SMP_IT, SMA_QURAN, OTHER]
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Unit updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put(
  '/:id',
  isAdmin,
  validateParams(unitIdParamSchema),
  validate(updateUnitSchema),
  controller.update
);

/**
 * @swagger
 * /api/units/{id}:
 *   delete:
 *     summary: Delete unit (Super Admin only)
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Unit deleted
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.delete('/:id', isSuperAdmin, validateParams(unitIdParamSchema), controller.remove);

export default router;
