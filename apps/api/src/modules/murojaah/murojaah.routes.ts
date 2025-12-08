import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { validate, validateQuery } from '@/middleware/validate';
import {
  listMurojaahQuerySchema,
  createMurojaahSchema,
  updateMurojaahSchema,
  createMistakeSchema,
} from './murojaah.schema';
import * as controller from './murojaah.controller';
import { UserRole } from '@prisma/client';

const router: Router = Router();

/**
 * @openapi
 * /api/murojaah:
 *   get:
 *     tags:
 *       - Murojaah
 *     summary: List murojaah records
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
 *           default: 20
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: halaqohId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: murojaahType
 *         schema:
 *           type: string
 *           enum: [DAILY, WEEKLY, MONTHLY, EXAM_PREP]
 *     responses:
 *       200:
 *         description: List of murojaah records
 */
router.get(
  '/',
  authenticate,
  validateQuery(listMurojaahQuerySchema),
  controller.listMurojaah
);

/**
 * @openapi
 * /api/murojaah/{id}:
 *   get:
 *     tags:
 *       - Murojaah
 *     summary: Get murojaah record by ID
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
 *         description: Murojaah record details
 */
router.get('/:id', authenticate, controller.getMurojaahById);

/**
 * @openapi
 * /api/murojaah:
 *   post:
 *     tags:
 *       - Murojaah
 *     summary: Create murojaah record
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Murojaah record created
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  validate(createMurojaahSchema),
  controller.createMurojaah
);

/**
 * @openapi
 * /api/murojaah/{id}:
 *   patch:
 *     tags:
 *       - Murojaah
 *     summary: Update murojaah record
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Murojaah record updated
 */
router.patch(
  '/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  validate(updateMurojaahSchema),
  controller.updateMurojaah
);

/**
 * @openapi
 * /api/murojaah/{id}:
 *   delete:
 *     tags:
 *       - Murojaah
 *     summary: Delete murojaah record
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Murojaah record deleted
 */
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  controller.deleteMurojaah
);

/**
 * @openapi
 * /api/murojaah/mistakes:
 *   post:
 *     tags:
 *       - Murojaah
 *     summary: Add mistake to murojaah record
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Mistake added
 */
router.post(
  '/mistakes',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  validate(createMistakeSchema),
  controller.addMistake
);

/**
 * @openapi
 * /api/murojaah/mistakes/{id}:
 *   delete:
 *     tags:
 *       - Murojaah
 *     summary: Delete mistake
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mistake deleted
 */
router.delete(
  '/mistakes/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  controller.deleteMistake
);

/**
 * @openapi
 * /api/murojaah/students/{studentId}/history:
 *   get:
 *     tags:
 *       - Murojaah
 *     summary: Get student murojaah history
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student murojaah history
 */
router.get(
  '/students/:studentId/history',
  authenticate,
  validateQuery(listMurojaahQuerySchema),
  controller.getStudentHistory
);

/**
 * @openapi
 * /api/murojaah/students/{studentId}/summary:
 *   get:
 *     tags:
 *       - Murojaah
 *     summary: Get student murojaah summary
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student murojaah summary
 */
router.get(
  '/students/:studentId/summary',
  authenticate,
  controller.getStudentSummary
);

/**
 * @openapi
 * /api/murojaah/students/{studentId}/schedule:
 *   get:
 *     tags:
 *       - Murojaah
 *     summary: Get murojaah schedule recommendation
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Murojaah schedule recommendation
 */
router.get(
  '/students/:studentId/schedule',
  authenticate,
  controller.getMurojaahSchedule
);

/**
 * @openapi
 * /api/murojaah/halaqoh/{halaqohId}:
 *   get:
 *     tags:
 *       - Murojaah
 *     summary: Get halaqoh murojaah records
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Halaqoh murojaah records
 */
router.get(
  '/halaqoh/:halaqohId',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  controller.getHalaqohRecords
);

export default router;
