/**
 * Dashboard Routes
 * REST API endpoints for dashboard data
 */

import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import {
  getDashboardMetrics,
  getQuickStats,
  getStats,
  getAttendanceStats,
  getFinanceStats,
  getTahfidzStats,
  getViolationRewardStats,
} from './dashboard.controller';

const router = Router();

/**
 * @openapi
 * /api/dashboard/metrics:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get current dashboard metrics with history and alerts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dashboard metrics retrieved successfully
 */
router.get('/metrics', authenticate, getDashboardMetrics);

/**
 * @openapi
 * /api/dashboard/quick-stats:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get dashboard quick stats
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quick stats retrieved successfully
 */
router.get('/quick-stats', authenticate, getQuickStats);

/**
 * @openapi
 * /api/dashboard/stats:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get main dashboard stats
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Main stats retrieved successfully
 */
router.get('/stats', authenticate, getStats);

/**
 * @openapi
 * /api/dashboard/attendance:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get attendance stats for dashboard chart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Attendance stats retrieved successfully
 */
router.get('/attendance', authenticate, getAttendanceStats);

/**
 * @openapi
 * /api/dashboard/finance:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get finance stats for dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Finance stats retrieved successfully
 */
router.get('/finance', authenticate, getFinanceStats);

/**
 * @openapi
 * /api/dashboard/tahfidz:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get tahfidz stats for dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tahfidz stats retrieved successfully
 */
router.get('/tahfidz', authenticate, getTahfidzStats);

/**
 * @openapi
 * /api/dashboard/violation-reward:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get violation and reward stats for dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *     responses:
 *       200:
 *         description: Violation and reward stats retrieved successfully
 */
router.get('/violation-reward', authenticate, getViolationRewardStats);

export default router;
