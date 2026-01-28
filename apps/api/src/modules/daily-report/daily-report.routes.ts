import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { validate, validateQuery } from '@/middleware/validate';
import * as controller from './daily-report.controller';
import {
  listDailyReportsQuerySchema,
  createDailyReportSchema,
  updateDailyReportSchema,
  confirmReportSchema,
  bulkCreateDailyReportsSchema,
  studentDailySummarySchema,
  classDailySummarySchema,
} from './daily-report.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// DAILY REPORT ROUTES
// ============================================

/**
 * @swagger
 * /api/daily-report:
 *   get:
 *     summary: List daily reports
 *     tags: [Daily Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: mood
 *         schema:
 *           type: string
 *           enum: [HAPPY, NEUTRAL, SAD, SICK, TIRED]
 *       - in: query
 *         name: isConfirmedByParent
 *         schema:
 *           type: boolean
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
 *     responses:
 *       200:
 *         description: List of daily reports
 */
router.get('/', validateQuery(listDailyReportsQuerySchema), controller.listDailyReports);

/**
 * @swagger
 * /api/daily-report/summary/student:
 *   get:
 *     summary: Get student monthly summary
 *     tags: [Daily Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: academicYearId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Student monthly summary
 */
router.get(
  '/summary/student',
  validateQuery(studentDailySummarySchema),
  controller.getStudentMonthlySummary
);

/**
 * @swagger
 * /api/daily-report/summary/class:
 *   get:
 *     summary: Get class daily summary
 *     tags: [Daily Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *       - in: query
 *         name: academicYearId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Class daily summary
 */
router.get(
  '/summary/class',
  validateQuery(classDailySummarySchema),
  controller.getClassDailySummary
);

/**
 * @swagger
 * /api/daily-report/{id}:
 *   get:
 *     summary: Get daily report by ID
 *     tags: [Daily Report]
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
 *         description: Daily report details
 *       404:
 *         description: Report not found
 */
router.get('/:id', controller.getDailyReportById);

/**
 * @swagger
 * /api/daily-report:
 *   post:
 *     summary: Create daily report
 *     tags: [Daily Report]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - unitId
 *               - academicYearId
 *               - reportDate
 *             properties:
 *               studentId:
 *                 type: string
 *               unitId:
 *                 type: string
 *               academicYearId:
 *                 type: string
 *               reportDate:
 *                 type: string
 *                 format: date
 *               morningMood:
 *                 type: string
 *                 enum: [HAPPY, NEUTRAL, SAD, SICK, TIRED]
 *               afternoonMood:
 *                 type: string
 *                 enum: [HAPPY, NEUTRAL, SAD, SICK, TIRED]
 *               healthNotes:
 *                 type: string
 *               breakfastConsumption:
 *                 type: string
 *                 enum: [HABIS, SETENGAH, SEDIKIT, TIDAK_MAU]
 *               lunchConsumption:
 *                 type: string
 *                 enum: [HABIS, SETENGAH, SEDIKIT, TIDAK_MAU]
 *               activitiesSummary:
 *                 type: string
 *               ibadahNotes:
 *                 type: string
 *               parentNotes:
 *                 type: string
 *               photoUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Daily report created
 */
router.post('/', validate(createDailyReportSchema), controller.createDailyReport);

/**
 * @swagger
 * /api/daily-report/bulk:
 *   post:
 *     summary: Bulk create daily reports for a class
 *     tags: [Daily Report]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - unitId
 *               - academicYearId
 *               - reportDate
 *               - reports
 *             properties:
 *               unitId:
 *                 type: string
 *               academicYearId:
 *                 type: string
 *               reportDate:
 *                 type: string
 *                 format: date
 *               reports:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     studentId:
 *                       type: string
 *                     morningMood:
 *                       type: string
 *                     afternoonMood:
 *                       type: string
 *                     activitiesSummary:
 *                       type: string
 *     responses:
 *       201:
 *         description: Daily reports created
 */
router.post('/bulk', validate(bulkCreateDailyReportsSchema), controller.bulkCreateDailyReports);

/**
 * @swagger
 * /api/daily-report/{id}:
 *   put:
 *     summary: Update daily report
 *     tags: [Daily Report]
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
 *               morningMood:
 *                 type: string
 *               activitiesSummary:
 *                 type: string
 *               parentNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Daily report updated
 */
router.put('/:id', validate(updateDailyReportSchema), controller.updateDailyReport);

/**
 * @swagger
 * /api/daily-report/{id}/confirm:
 *   post:
 *     summary: Parent confirms daily report
 *     tags: [Daily Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               parentFeedback:
 *                 type: string
 *     responses:
 *       200:
 *         description: Daily report confirmed
 */
router.post('/:id/confirm', validate(confirmReportSchema), controller.confirmDailyReport);

/**
 * @swagger
 * /api/daily-report/{id}:
 *   delete:
 *     summary: Delete daily report
 *     tags: [Daily Report]
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
 *         description: Daily report deleted
 */
router.delete('/:id', controller.deleteDailyReport);

export default router;
