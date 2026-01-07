import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@prisma/client';
import { DapodikController } from './dapodik.controller';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Dapodik
 *     description: Dapodik (Kemendikbud) data export endpoints
 */

/**
 * @openapi
 * /api/dapodik/students:
 *   get:
 *     summary: Export student data in Dapodik format
 *     tags: [Dapodik]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Student data in Dapodik format
 */
router.get(
  '/students',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  DapodikController.exportStudents
);

/**
 * @openapi
 * /api/dapodik/teachers:
 *   get:
 *     summary: Export teacher (PTK) data in Dapodik format
 *     tags: [Dapodik]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Teacher data in Dapodik format
 */
router.get(
  '/teachers',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  DapodikController.exportTeachers
);

/**
 * @openapi
 * /api/dapodik/rombel:
 *   get:
 *     summary: Export rombel (class) data in Dapodik format
 *     tags: [Dapodik]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rombel data in Dapodik format
 */
router.get(
  '/rombel',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  DapodikController.exportRombel
);

/**
 * @openapi
 * /api/dapodik/sekolah/{unitId}:
 *   get:
 *     summary: Export school profile in Dapodik format
 *     tags: [Dapodik]
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
 *         description: School profile in Dapodik format
 */
router.get(
  '/sekolah/:unitId',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  DapodikController.exportSekolah
);

/**
 * @openapi
 * /api/dapodik/summary:
 *   get:
 *     summary: Get export summary and readiness score
 *     tags: [Dapodik]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Export summary with completeness metrics
 */
router.get(
  '/summary',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  DapodikController.getSummary
);

/**
 * @openapi
 * /api/dapodik/validate:
 *   get:
 *     summary: Validate data before export
 *     tags: [Dapodik]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Validation results with issues
 */
router.get(
  '/validate',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  DapodikController.validateData
);

export { router as dapodikRouter };
