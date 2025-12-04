import { Router } from 'express';
import { authenticate, isSuperAdmin } from '@/middleware/auth';
import { validate, validateQuery, validateParams } from '@/middleware/error';
import * as controller from './academic-year.controller';
import {
  createAcademicYearSchema,
  updateAcademicYearSchema,
  listAcademicYearsQuerySchema,
  academicYearIdParamSchema,
} from './academic-year.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/academic-years:
 *   get:
 *     summary: List academic years
 *     tags: [Academic Years]
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
 *         description: List of academic years
 */
// List academic years
router.get('/', validateQuery(listAcademicYearsQuerySchema), controller.list);

/**
 * @swagger
 * /api/academic-years/active:
 *   get:
 *     summary: Get active academic year
 *     tags: [Academic Years]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Active academic year details
 *       404:
 *         description: No active academic year found
 */
// Get active academic year
router.get('/active', controller.getActive);

/**
 * @swagger
 * /api/academic-years/{id}:
 *   get:
 *     summary: Get academic year by ID
 *     tags: [Academic Years]
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
 *         description: Academic year details
 *       404:
 *         description: Academic year not found
 */
// Get academic year by ID
router.get('/:id', validateParams(academicYearIdParamSchema), controller.getById);

/**
 * @swagger
 * /api/academic-years:
 *   post:
 *     summary: Create academic year
 *     tags: [Academic Years]
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
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *                 description: e.g., "2024/2025"
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               isActive:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Academic year created
 *       403:
 *         description: Super admin access required
 */
// Super admin only routes
router.post('/', isSuperAdmin, validate(createAcademicYearSchema), controller.create);

/**
 * @swagger
 * /api/academic-years/{id}:
 *   put:
 *     summary: Update academic year
 *     tags: [Academic Years]
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
 *             properties:
 *               name:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Academic year updated
 *       403:
 *         description: Super admin access required
 *       404:
 *         description: Academic year not found
 */
router.put('/:id', isSuperAdmin, validateParams(academicYearIdParamSchema), validate(updateAcademicYearSchema), controller.update);

/**
 * @swagger
 * /api/academic-years/{id}:
 *   delete:
 *     summary: Delete academic year
 *     tags: [Academic Years]
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
 *         description: Academic year deleted
 *       403:
 *         description: Super admin access required
 *       404:
 *         description: Academic year not found
 */
router.delete('/:id', isSuperAdmin, validateParams(academicYearIdParamSchema), controller.remove);

export default router;
