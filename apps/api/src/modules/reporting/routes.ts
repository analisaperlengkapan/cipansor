/**
 * Reporting Routes
 * Phase 7A.3 - Advanced Reporting
 */

import { Router } from 'express';
import * as controller from './controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/reports/types:
 *   get:
 *     summary: Get available report types
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available report types
 */
router.get('/types', controller.getReportTypes);

/**
 * @swagger
 * /api/reports/formats:
 *   get:
 *     summary: Get available report formats
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available report formats
 */
router.get('/formats', controller.getReportFormats);

/**
 * @swagger
 * /api/reports/generate:
 *   post:
 *     summary: Generate a report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [STUDENT_LIST, STUDENT_DETAIL, ATTENDANCE_SUMMARY, TAHFIDZ_PROGRESS, GRADE_REPORT, FINANCIAL_SUMMARY, INVOICE_LIST, PAYMENT_LIST, VIOLATION_REPORT, REWARD_REPORT, HEALTH_REPORT, HR_SUMMARY, LIBRARY_USAGE]
 *               format:
 *                 type: string
 *                 enum: [JSON, CSV, PDF, EXCEL]
 *                 default: JSON
 *               filters:
 *                 type: object
 *                 properties:
 *                   unitId:
 *                     type: string
 *                     format: uuid
 *                   classId:
 *                     type: string
 *                     format: uuid
 *                   academicYearId:
 *                     type: string
 *                     format: uuid
 *                   startDate:
 *                     type: string
 *                     format: date-time
 *                   endDate:
 *                     type: string
 *                     format: date-time
 *                   studentId:
 *                     type: string
 *                     format: uuid
 *                   status:
 *                     type: string
 *     responses:
 *       200:
 *         description: Generated report
 */
router.post('/generate', authorize('SUPER_ADMIN', 'UNIT_ADMIN'), controller.generateReport);

/**
 * @swagger
 * /api/reports/students:
 *   get:
 *     summary: Quick student list report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [JSON, CSV]
 *     responses:
 *       200:
 *         description: Student list report
 */
router.get('/students', authorize('SUPER_ADMIN', 'UNIT_ADMIN', 'TEACHER'), controller.getStudentReport);

/**
 * @swagger
 * /api/reports/attendance:
 *   get:
 *     summary: Quick attendance summary report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *       - in: query
 *         name: classId
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
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [JSON, CSV]
 *     responses:
 *       200:
 *         description: Attendance summary report
 */
router.get('/attendance', authorize('SUPER_ADMIN', 'UNIT_ADMIN', 'TEACHER'), controller.getAttendanceReport);

/**
 * @swagger
 * /api/reports/finance:
 *   get:
 *     summary: Quick financial summary report
 *     tags: [Reports]
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
 *         description: Financial summary report
 */
router.get('/finance', authorize('SUPER_ADMIN', 'UNIT_ADMIN'), controller.getFinanceReport);

/**
 * @swagger
 * /api/reports/tahfidz:
 *   get:
 *     summary: Quick tahfidz progress report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *       - in: query
 *         name: classId
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
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [JSON, CSV]
 *     responses:
 *       200:
 *         description: Tahfidz progress report
 */
router.get('/tahfidz', authorize('SUPER_ADMIN', 'UNIT_ADMIN', 'TEACHER'), controller.getTahfidzReport);

export default router;
