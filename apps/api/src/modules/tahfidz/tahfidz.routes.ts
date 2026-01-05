import { Router } from 'express';
import { authenticate, isAdmin } from '@/middleware/auth';
import { validate, validateQuery, validateParams } from '@/middleware/error';
import * as controller from './tahfidz.controller';
import {
  createTahfidzSchema,
  updateTahfidzSchema,
  listTahfidzQuerySchema,
  tahfidzIdParamSchema,
  studentIdParamSchema,
  generateCertificateSchema,
} from './tahfidz.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/tahfidz:
 *   get:
 *     summary: List tahfidz records
 *     tags: [Tahfidz]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *         description: Filter by student ID
 *       - in: query
 *         name: surahNumber
 *         schema:
 *           type: integer
 *         description: Filter by surah number
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [MEMORIZING, MEMORIZED, REVIEWING]
 *         description: Filter by status
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
 *         description: List of tahfidz records
 *       401:
 *         description: Unauthorized
 */
// List tahfidz records
router.get('/', validateQuery(listTahfidzQuerySchema), controller.list);

/**
 * @swagger
 * /api/tahfidz/dashboard:
 *   get:
 *     summary: Get tahfidz dashboard statistics
 *     tags: [Tahfidz]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *         description: Filter by unit ID
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by year
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 11
 *         description: Filter by month (0-11)
 *     responses:
 *       200:
 *         description: Dashboard statistics including progress by juz, activity types, top students
 *       401:
 *         description: Unauthorized
 */
// Dashboard stats (before :id to avoid conflict)
router.get('/dashboard', controller.getDashboard);

/**
 * @swagger
 * /api/tahfidz/certificates:
 *   post:
 *     summary: Generate certificate
 *     tags: [Tahfidz]
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
 *               - certificateType
 *     responses:
 *       201:
 *         description: Certificate generated
 *       401:
 *         description: Unauthorized
 */
router.post('/certificates', validate(generateCertificateSchema), controller.generateCertificate);

/**
 * @swagger
 * /api/tahfidz/students/{studentId}/summary:
 *   get:
 *     summary: Get student's tahfidz summary
 *     tags: [Tahfidz]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student tahfidz summary with total memorized, progress, etc.
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Student not found
 */
// Get student summary (before :id to avoid conflict)
router.get('/students/:studentId/summary', validateParams(studentIdParamSchema), controller.getStudentSummary);

/**
 * @swagger
 * /api/tahfidz/{id}:
 *   get:
 *     summary: Get tahfidz record by ID
 *     tags: [Tahfidz]
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
 *         description: Tahfidz record details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Record not found
 */
// Get by ID
router.get('/:id', validateParams(tahfidzIdParamSchema), controller.getById);

/**
 * @swagger
 * /api/tahfidz:
 *   post:
 *     summary: Create tahfidz record
 *     tags: [Tahfidz]
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
 *               - surahNumber
 *               - startAyah
 *               - endAyah
 *             properties:
 *               studentId:
 *                 type: string
 *               surahNumber:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 114
 *               startAyah:
 *                 type: integer
 *               endAyah:
 *                 type: integer
 *               grade:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tahfidz record created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
// Admin/Teacher routes
router.post('/', isAdmin, validate(createTahfidzSchema), controller.create);

/**
 * @swagger
 * /api/tahfidz/{id}:
 *   put:
 *     summary: Update tahfidz record
 *     tags: [Tahfidz]
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
 *               grade:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [MEMORIZING, MEMORIZED, REVIEWING]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated tahfidz record
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Record not found
 */
router.put('/:id', isAdmin, validateParams(tahfidzIdParamSchema), validate(updateTahfidzSchema), controller.update);

/**
 * @swagger
 * /api/tahfidz/{id}:
 *   delete:
 *     summary: Delete tahfidz record
 *     tags: [Tahfidz]
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
 *         description: Record deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Record not found
 */
router.delete('/:id', isAdmin, validateParams(tahfidzIdParamSchema), controller.remove);

export default router;
