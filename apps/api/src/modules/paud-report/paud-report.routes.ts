import { Router, type IRouter } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { validate, validateQuery } from '@/middleware/validate';
import { UserRole } from '@prisma/client';
import * as controller from './paud-report.controller';
import {
  listReportsQuerySchema,
  createReportSchema,
  updateReportSchema,
  generateReportSchema,
  bulkGenerateReportSchema,
  finalizeReportSchema,
  addPhotoSchema,
  updatePhotoSchema,
} from './paud-report.schema';

const router: IRouter = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     PAUDNarrativeReport:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         studentId:
 *           type: string
 *           format: uuid
 *         unitId:
 *           type: string
 *           format: uuid
 *         academicYearId:
 *           type: string
 *           format: uuid
 *         semester:
 *           type: string
 *           enum: [GANJIL, GENAP]
 *         narrativeNAM:
 *           type: string
 *           nullable: true
 *         narrativeFM:
 *           type: string
 *           nullable: true
 *         narrativeKOG:
 *           type: string
 *           nullable: true
 *         narrativeBHS:
 *           type: string
 *           nullable: true
 *         narrativeSE:
 *           type: string
 *           nullable: true
 *         narrativeSNI:
 *           type: string
 *           nullable: true
 *         overallStrengths:
 *           type: string
 *           nullable: true
 *         areasForDevelopment:
 *           type: string
 *           nullable: true
 *         parentRecommendations:
 *           type: string
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [DRAFT, FINALIZED, PRINTED]
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     CreatePAUDReport:
 *       type: object
 *       required:
 *         - studentId
 *         - unitId
 *         - academicYearId
 *         - semester
 *       properties:
 *         studentId:
 *           type: string
 *           format: uuid
 *         unitId:
 *           type: string
 *           format: uuid
 *         academicYearId:
 *           type: string
 *           format: uuid
 *         semester:
 *           type: string
 *           enum: [GANJIL, GENAP]
 *         narrativeNAM:
 *           type: string
 *           maxLength: 3000
 *         narrativeFM:
 *           type: string
 *           maxLength: 3000
 *
 *     GeneratePAUDReport:
 *       type: object
 *       required:
 *         - studentId
 *         - unitId
 *         - academicYearId
 *         - semester
 *       properties:
 *         studentId:
 *           type: string
 *           format: uuid
 *         unitId:
 *           type: string
 *           format: uuid
 *         academicYearId:
 *           type: string
 *           format: uuid
 *         semester:
 *           type: string
 *           enum: [GANJIL, GENAP]
 *         regenerate:
 *           type: boolean
 *           default: false
 *
 *     BulkGeneratePAUDReport:
 *       type: object
 *       required:
 *         - classId
 *         - unitId
 *         - academicYearId
 *         - semester
 *       properties:
 *         classId:
 *           type: string
 *           format: uuid
 *         unitId:
 *           type: string
 *           format: uuid
 *         academicYearId:
 *           type: string
 *           format: uuid
 *         semester:
 *           type: string
 *           enum: [GANJIL, GENAP]
 *         regenerate:
 *           type: boolean
 *           default: false
 */

// ============================================
// STATIC ROUTES (before parameter routes)
// ============================================

/**
 * @openapi
 * /api/paud-report:
 *   get:
 *     summary: List PAUD narrative reports
 *     tags: [PAUD Report]
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
 *         name: unitId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: semester
 *         schema:
 *           type: string
 *           enum: [GANJIL, GENAP]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, FINALIZED, PRINTED]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of PAUD reports with pagination
 */
router.get(
  '/',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  validateQuery(listReportsQuerySchema),
  controller.listReports
);

/**
 * @openapi
 * /api/paud-report:
 *   post:
 *     summary: Create a new PAUD narrative report
 *     tags: [PAUD Report]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePAUDReport'
 *     responses:
 *       201:
 *         description: Report created successfully
 *       409:
 *         description: Report already exists for this student/semester
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  validate(createReportSchema),
  controller.createReport
);

/**
 * @openapi
 * /api/paud-report/generate:
 *   post:
 *     summary: Auto-generate report from assessments
 *     tags: [PAUD Report]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GeneratePAUDReport'
 *     responses:
 *       201:
 *         description: Report generated successfully
 *       400:
 *         description: No assessments found or invalid input
 *       409:
 *         description: Report already exists (use regenerate=true)
 */
router.post(
  '/generate',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  validate(generateReportSchema),
  controller.generateReport
);

/**
 * @openapi
 * /api/paud-report/bulk-generate:
 *   post:
 *     summary: Bulk generate reports for a class
 *     tags: [PAUD Report]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkGeneratePAUDReport'
 *     responses:
 *       200:
 *         description: Bulk generation results
 */
router.post(
  '/bulk-generate',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  validate(bulkGenerateReportSchema),
  controller.bulkGenerateReports
);

/**
 * @openapi
 * /api/paud-report/photos/{photoId}:
 *   put:
 *     summary: Update photo caption/order
 *     tags: [PAUD Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: photoId
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
 *               caption:
 *                 type: string
 *                 maxLength: 500
 *               orderNumber:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Photo updated successfully
 */
router.put(
  '/photos/:photoId',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  validate(updatePhotoSchema),
  controller.updatePhoto
);

/**
 * @openapi
 * /api/paud-report/photos/{photoId}:
 *   delete:
 *     summary: Delete photo from report
 *     tags: [PAUD Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: photoId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Photo deleted successfully
 */
router.delete(
  '/photos/:photoId',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  controller.deletePhoto
);

// ============================================
// PARAMETER ROUTES (after static routes)
// ============================================

/**
 * @openapi
 * /api/paud-report/{id}:
 *   get:
 *     summary: Get PAUD report by ID
 *     tags: [PAUD Report]
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
 *         description: PAUD report details
 *       404:
 *         description: Report not found
 */
router.get(
  '/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER, UserRole.PARENT),
  controller.getReportById
);

/**
 * @openapi
 * /api/paud-report/{id}:
 *   put:
 *     summary: Update a PAUD narrative report
 *     tags: [PAUD Report]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePAUDReport'
 *     responses:
 *       200:
 *         description: Report updated successfully
 *       400:
 *         description: Cannot update finalized/printed report
 *       404:
 *         description: Report not found
 */
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  validate(updateReportSchema),
  controller.updateReport
);

/**
 * @openapi
 * /api/paud-report/{id}:
 *   delete:
 *     summary: Delete a PAUD narrative report
 *     tags: [PAUD Report]
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
 *         description: Report deleted successfully
 *       400:
 *         description: Cannot delete finalized/printed report
 *       404:
 *         description: Report not found
 */
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  controller.deleteReport
);

/**
 * @openapi
 * /api/paud-report/{id}/finalize:
 *   post:
 *     summary: Finalize a PAUD narrative report
 *     tags: [PAUD Report]
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
 *               teacherSignature:
 *                 type: string
 *               principalSignature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Report finalized successfully
 *       400:
 *         description: Report is already finalized
 *       404:
 *         description: Report not found
 */
router.post(
  '/:id/finalize',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(finalizeReportSchema),
  controller.finalizeReport
);

/**
 * @openapi
 * /api/paud-report/{id}/print:
 *   post:
 *     summary: Mark report as printed
 *     tags: [PAUD Report]
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
 *         description: Report marked as printed
 *       400:
 *         description: Cannot print draft report
 */
router.post(
  '/:id/print',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  controller.markAsPrinted
);

/**
 * @openapi
 * /api/paud-report/{id}/pdf:
 *   get:
 *     summary: Get report as printable HTML/PDF
 *     tags: [PAUD Report]
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
 *         description: HTML document for printing
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
router.get(
  '/:id/pdf',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER, UserRole.PARENT),
  controller.getReportPdf
);

/**
 * @openapi
 * /api/paud-report/{id}/photos:
 *   post:
 *     summary: Add photo to report
 *     tags: [PAUD Report]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - photoUrl
 *             properties:
 *               photoUrl:
 *                 type: string
 *                 format: uri
 *               caption:
 *                 type: string
 *                 maxLength: 500
 *               orderNumber:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Photo added successfully
 *       400:
 *         description: Maximum photos reached or invalid report status
 */
router.post(
  '/:id/photos',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  validate(addPhotoSchema),
  controller.addPhoto
);

export default router;
