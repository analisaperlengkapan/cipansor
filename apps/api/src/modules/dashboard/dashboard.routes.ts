/**
 * Dashboard Routes
 * REST API endpoints for dashboard data
 */

import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { getDashboardMetrics, getQuickStats } from './dashboard.controller';

const router = Router();

/**
 * @openapi
 * /api/dashboard/metrics:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get current dashboard metrics with history and alerts
 *     description: Returns current metrics, recent history, and active alerts for dashboard display
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *         description: Optional unit ID to filter metrics by specific unit
 *     responses:
 *       200:
 *         description: Dashboard metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     current:
 *                       type: object
 *                       description: Current metrics snapshot
 *                       properties:
 *                         students:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: number
 *                             active:
 *                               type: number
 *                             change:
 *                               type: number
 *                         teachers:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: number
 *                         attendance:
 *                           type: object
 *                           properties:
 *                             rate:
 *                               type: number
 *                             present:
 *                               type: number
 *                             total:
 *                               type: number
 *                         tahfidz:
 *                           type: object
 *                           properties:
 *                             totalHafidz:
 *                               type: number
 *                             avgQuality:
 *                               type: number
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                     recent:
 *                       type: array
 *                       description: Recent metrics history
 *                       items:
 *                         type: object
 *                     alerts:
 *                       type: array
 *                       description: Active alerts
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           message:
 *                             type: string
 *                           severity:
 *                             type: string
 *                             enum: [INFO, WARNING, CRITICAL]
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - No access to specified unit
 *       500:
 *         description: Internal server error
 */
router.get('/metrics', authenticate, getDashboardMetrics);

/**
 * @openapi
 * /api/dashboard/quick-stats:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get dashboard quick stats
 *     description: Returns simplified metrics for dashboard cards (faster response)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *         description: Optional unit ID to filter stats by specific unit
 *     responses:
 *       200:
 *         description: Quick stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalStudents:
 *                       type: number
 *                       example: 798
 *                     activeStudents:
 *                       type: number
 *                       example: 750
 *                     totalTeachers:
 *                       type: number
 *                       example: 85
 *                     todayAttendance:
 *                       type: number
 *                       example: 708
 *                     attendanceRate:
 *                       type: number
 *                       example: 94
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/quick-stats', authenticate, getQuickStats);

export default router;
