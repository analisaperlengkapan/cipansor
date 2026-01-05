import { Router } from 'express';
import { authenticate, isAdmin } from '@/middleware/auth';
import { validate, validateQuery, validateParams } from '@/middleware/error';
import * as controller from './attendance.controller';
import {
  createAttendanceSchema,
  bulkAttendanceSchema,
  updateAttendanceSchema,
  listAttendanceQuerySchema,
  attendanceIdParamSchema,
  attendanceSummaryQuerySchema,
} from './attendance.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/attendance:
 *   get:
 *     summary: List attendance records
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PRESENT, ABSENT, LATE, SICK, PERMISSION]
 *     responses:
 *       200:
 *         description: List of attendance records
 */
router.get('/', validateQuery(listAttendanceQuerySchema), controller.list);

/**
 * @swagger
 * /api/attendance/summary:
 *   get:
 *     summary: Get attendance summary
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: studentId
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
 *     responses:
 *       200:
 *         description: Attendance summary statistics
 */
router.get('/summary', validateQuery(attendanceSummaryQuerySchema), controller.getSummary);

/**
 * @swagger
 * /api/attendance/calendar/{classId}:
 *   get:
 *     summary: Get attendance calendar for a class (monthly view)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Year (default current year)
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 11
 *         description: Month (0-11)
 *     responses:
 *       200:
 *         description: Monthly attendance calendar with daily stats
 */
router.get('/calendar/:classId', controller.getCalendar);

/**
 * @swagger
 * /api/attendance/{id}:
 *   get:
 *     summary: Get attendance by ID
 *     tags: [Attendance]
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
 *         description: Attendance record
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', validateParams(attendanceIdParamSchema), controller.getById);

/**
 * @swagger
 * /api/attendance:
 *   post:
 *     summary: Record attendance (Admin/Teacher)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, classId, date, status]
 *             properties:
 *               studentId:
 *                 type: string
 *                 format: uuid
 *               classId:
 *                 type: string
 *                 format: uuid
 *               date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [PRESENT, ABSENT, LATE, SICK, PERMISSION]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Attendance recorded
 */
router.post('/', isAdmin, validate(createAttendanceSchema), controller.create);

/**
 * @swagger
 * /api/attendance/bulk:
 *   post:
 *     summary: Bulk record attendance (Admin/Teacher)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [classId, date, records]
 *             properties:
 *               classId:
 *                 type: string
 *                 format: uuid
 *               date:
 *                 type: string
 *                 format: date
 *               records:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     studentId:
 *                       type: string
 *                       format: uuid
 *                     status:
 *                       type: string
 *                       enum: [PRESENT, ABSENT, LATE, SICK, PERMISSION]
 *                     notes:
 *                       type: string
 *     responses:
 *       201:
 *         description: Attendance bulk recorded
 */
router.post('/bulk', isAdmin, validate(bulkAttendanceSchema), controller.bulkCreate);

/**
 * @swagger
 * /api/attendance/{id}:
 *   patch:
 *     summary: Update attendance (Admin/Teacher)
 *     tags: [Attendance]
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PRESENT, ABSENT, LATE, SICK, PERMISSION]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Attendance updated
 */
router.patch('/:id', isAdmin, validateParams(attendanceIdParamSchema), validate(updateAttendanceSchema), controller.update);

/**
 * @swagger
 * /api/attendance/{id}:
 *   delete:
 *     summary: Delete attendance (Admin/Teacher)
 *     tags: [Attendance]
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
 *         description: Attendance deleted
 */
router.delete('/:id', isAdmin, validateParams(attendanceIdParamSchema), controller.remove);

export default router;
