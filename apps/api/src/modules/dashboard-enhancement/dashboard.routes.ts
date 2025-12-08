import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { validate, validateQuery } from '@/middleware/validate';
import {
  dashboardOverviewQuerySchema,
  metricsQuerySchema,
  unitComparisonQuerySchema,
  trendQuerySchema,
  createMetricSnapshotSchema,
  generateReportSchema,
} from './dashboard.schema';
import * as controller from './dashboard.controller';
import { UserRole } from '@prisma/client';

const router: Router = Router();

/**
 * @openapi
 * /api/dashboard-enhancement/overview:
 *   get:
 *     tags:
 *       - Dashboard Enhancement
 *     summary: Get dashboard overview
 *     description: Get comprehensive dashboard overview with all key metrics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Dashboard overview data
 */
router.get(
  '/overview',
  authenticate,
  validateQuery(dashboardOverviewQuerySchema),
  controller.getOverview
);

/**
 * @openapi
 * /api/dashboard-enhancement/quick-stats:
 *   get:
 *     tags:
 *       - Dashboard Enhancement
 *     summary: Get quick stats
 *     description: Get quick summary stats for dashboard widgets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Quick stats data
 */
router.get(
  '/quick-stats',
  authenticate,
  controller.getQuickStats
);

/**
 * @openapi
 * /api/dashboard-enhancement/metrics:
 *   get:
 *     tags:
 *       - Dashboard Enhancement
 *     summary: List metric snapshots
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
 *         name: unitId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: metricType
 *         schema:
 *           type: string
 *       - in: query
 *         name: periodType
 *         schema:
 *           type: string
 *           enum: [DAILY, WEEKLY, MONTHLY, YEARLY]
 *     responses:
 *       200:
 *         description: List of metric snapshots
 */
router.get(
  '/metrics',
  authenticate,
  validateQuery(metricsQuerySchema),
  controller.getMetrics
);

/**
 * @openapi
 * /api/dashboard-enhancement/metrics:
 *   post:
 *     tags:
 *       - Dashboard Enhancement
 *     summary: Create metric snapshot
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - metricType
 *               - metricValue
 *               - periodType
 *               - periodDate
 *             properties:
 *               unitId:
 *                 type: string
 *                 format: uuid
 *               academicYearId:
 *                 type: string
 *                 format: uuid
 *               metricType:
 *                 type: string
 *               metricValue:
 *                 type: number
 *               metricData:
 *                 type: object
 *               periodType:
 *                 type: string
 *                 enum: [DAILY, WEEKLY, MONTHLY, YEARLY]
 *               periodDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Metric snapshot created
 */
router.post(
  '/metrics',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(createMetricSnapshotSchema),
  controller.createMetricSnapshot
);

/**
 * @openapi
 * /api/dashboard-enhancement/trends:
 *   get:
 *     tags:
 *       - Dashboard Enhancement
 *     summary: Get metric trends
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: metricType
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: periodType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [DAILY, WEEKLY, MONTHLY, YEARLY]
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Trend data with summary
 */
router.get(
  '/trends',
  authenticate,
  validateQuery(trendQuerySchema),
  controller.getTrend
);

/**
 * @openapi
 * /api/dashboard-enhancement/comparison:
 *   get:
 *     tags:
 *       - Dashboard Enhancement
 *     summary: Get unit comparison
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: metricType
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: periodStart
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: periodEnd
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Unit comparison data
 */
router.get(
  '/comparison',
  authenticate,
  validateQuery(unitComparisonQuerySchema),
  controller.getUnitComparison
);

/**
 * @openapi
 * /api/dashboard-enhancement/reports:
 *   post:
 *     tags:
 *       - Dashboard Enhancement
 *     summary: Generate report
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reportType
 *               - periodType
 *               - periodStart
 *               - periodEnd
 *             properties:
 *               unitId:
 *                 type: string
 *                 format: uuid
 *               academicYearId:
 *                 type: string
 *                 format: uuid
 *               reportType:
 *                 type: string
 *                 enum: [ACADEMIC, ATTENDANCE, TAHFIDZ, ENROLLMENT]
 *               periodType:
 *                 type: string
 *                 enum: [DAILY, WEEKLY, MONTHLY, YEARLY]
 *               periodStart:
 *                 type: string
 *                 format: date
 *               periodEnd:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Report generated
 */
router.post(
  '/reports',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(generateReportSchema),
  controller.generateReport
);

/**
 * @openapi
 * /api/dashboard-enhancement/jobs/trigger:
 *   post:
 *     tags:
 *       - Dashboard Enhancement
 *     summary: Trigger a snapshot job manually
 *     description: Super admin only - manually trigger daily snapshot, weekly summary, or cleanup jobs
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobType
 *             properties:
 *               jobType:
 *                 type: string
 *                 enum: [daily-snapshot, weekly-summary, cleanup]
 *     responses:
 *       200:
 *         description: Job started
 *       400:
 *         description: Invalid job type
 */
router.post(
  '/jobs/trigger',
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  controller.triggerSnapshotJob
);

export default router;
