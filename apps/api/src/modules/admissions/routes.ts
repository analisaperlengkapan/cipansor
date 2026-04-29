import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as controller from './controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validateQuery } from '../../middleware/error';
import { queryAdmissionPeriodSchema, queryRegistrantSchema } from './schema';
import waveRoutes from './ppdb-wave.routes';

const router = Router();

// Mount wave sub-router. `ppdb-wave.routes.ts` applies its own `authenticate`
// middleware (and exposes a public `/active/:periodId` route), so we mount it
// BEFORE the admissions-wide `authenticate` below.
router.use('/waves', waveRoutes);

router.use(authenticate);

// Lead scoring / priority leads.
// `controller.getPriorityLeads` exempts SUPER_ADMIN and YAYASAN_ADMIN from
// unit-level scoping (they may query any/all units), but the route-level
// `authorize` previously omitted YAYASAN_ADMIN — making the controller's
// branch unreachable for that role and surfacing 403s instead of the
// intended cross-unit view. Add YAYASAN_ADMIN here so the two layers agree.
router.get(
  '/leads/priority',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.YAYASAN_ADMIN,
    UserRole.UNIT_ADMIN,
    UserRole.STAFF
  ),
  controller.getPriorityLeads
);

// ==================== ADMISSION PERIODS ====================

/**
 * @swagger
 * /api/admissions/periods:
 *   get:
 *     summary: List admission periods
 *     tags: [Admissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of admission periods
 */
router.get(
  '/periods',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validateQuery(queryAdmissionPeriodSchema),
  controller.getAdmissionPeriods
);

/**
 * @swagger
 * /api/admissions/periods:
 *   post:
 *     summary: Create admission period
 *     tags: [Admissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - unitId
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *               unitId:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               quota:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Admission period created
 */
router.post(
  '/periods',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  controller.createAdmissionPeriod
);

/**
 * @swagger
 * /api/admissions/periods/{id}:
 *   get:
 *     summary: Get admission period by ID
 *     tags: [Admissions]
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
 *         description: Admission period details
 */
router.get(
  '/periods/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  controller.getAdmissionPeriodById
);

/**
 * @swagger
 * /api/admissions/periods/{id}/stats:
 *   get:
 *     summary: Get admission period statistics
 *     tags: [Admissions]
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
 *         description: Admission period statistics (registrants, accepted, etc.)
 */
router.get(
  '/periods/:id/stats',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  controller.getAdmissionPeriodStats
);

/**
 * @swagger
 * /api/admissions/periods/{id}:
 *   put:
 *     summary: Update admission period
 *     tags: [Admissions]
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
 *         description: Admission period updated
 */
router.put(
  '/periods/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  controller.updateAdmissionPeriod
);

/**
 * @swagger
 * /api/admissions/periods/{id}:
 *   delete:
 *     summary: Delete admission period
 *     tags: [Admissions]
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
 *         description: Admission period deleted
 */
router.delete(
  '/periods/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  controller.deleteAdmissionPeriod
);

// ==================== REGISTRANTS ====================

/**
 * @swagger
 * /api/admissions/registrants:
 *   get:
 *     summary: List registrants
 *     tags: [Admissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: periodId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [REGISTERED, VERIFIED, TESTED, ACCEPTED, REJECTED, ENROLLED]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of registrants
 */
router.get(
  '/registrants',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  validateQuery(queryRegistrantSchema),
  controller.getRegistrants
);

/**
 * @swagger
 * /api/admissions/registrants:
 *   post:
 *     summary: Create registrant
 *     tags: [Admissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - periodId
 *               - name
 *               - birthDate
 *               - gender
 *             properties:
 *               periodId:
 *                 type: string
 *               name:
 *                 type: string
 *               birthDate:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE]
 *               parentName:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registrant created
 */
router.post(
  '/registrants',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  controller.createRegistrant
);

/**
 * @swagger
 * /api/admissions/registrants/{id}:
 *   get:
 *     summary: Get registrant by ID
 *     tags: [Admissions]
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
 *         description: Registrant details
 */
router.get(
  '/registrants/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  controller.getRegistrantById
);

/**
 * @swagger
 * /api/admissions/registrants/{id}:
 *   put:
 *     summary: Update registrant
 *     tags: [Admissions]
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
 *         description: Registrant updated
 */
router.put(
  '/registrants/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  controller.updateRegistrant
);

/**
 * @swagger
 * /api/admissions/registrants/{id}/score:
 *   patch:
 *     summary: Update registrant test score
 *     tags: [Admissions]
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
 *             required:
 *               - score
 *             properties:
 *               score:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Score updated
 */
router.patch(
  '/registrants/:id/score',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  controller.updateRegistrantScore
);

/**
 * @swagger
 * /api/admissions/registrants/{id}/status:
 *   patch:
 *     summary: Update registrant status (accept/reject)
 *     tags: [Admissions]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [VERIFIED, TESTED, ACCEPTED, REJECTED]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch(
  '/registrants/:id/status',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  controller.updateRegistrantStatus
);

/**
 * @swagger
 * /api/admissions/registrants/{id}/enroll:
 *   post:
 *     summary: Enroll accepted registrant as student
 *     tags: [Admissions]
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
 *               classId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registrant enrolled as student
 */
router.post(
  '/registrants/:id/enroll',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  controller.enrollRegistrant
);

/**
 * @swagger
 * /api/admissions/registrants/{id}:
 *   delete:
 *     summary: Delete registrant
 *     tags: [Admissions]
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
 *         description: Registrant deleted
 */
router.delete(
  '/registrants/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  controller.deleteRegistrant
);

// ==================== DOCUMENTS ====================

/**
 * @swagger
 * /api/admissions/registrants/{registrantId}/documents:
 *   get:
 *     summary: Get registrant documents
 *     tags: [Admissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: registrantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of registrant documents
 */
router.get(
  '/registrants/:registrantId/documents',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  controller.getRegistrantDocuments
);

/**
 * @swagger
 * /api/admissions/registrants/{registrantId}/documents:
 *   post:
 *     summary: Upload registrant document
 *     tags: [Admissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: registrantId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - url
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [BIRTH_CERTIFICATE, FAMILY_CARD, PHOTO, REPORT_CARD, OTHER]
 *               url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Document uploaded
 */
router.post(
  '/registrants/:registrantId/documents',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  controller.createRegistrantDocument
);

/**
 * @swagger
 * /api/admissions/documents/{id}/verify:
 *   patch:
 *     summary: Verify document
 *     tags: [Admissions]
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
 *             required:
 *               - isVerified
 *             properties:
 *               isVerified:
 *                 type: boolean
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document verified
 */
router.patch(
  '/documents/:id/verify',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  controller.verifyDocument
);

/**
 * @swagger
 * /api/admissions/documents/{id}:
 *   delete:
 *     summary: Delete document
 *     tags: [Admissions]
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
 *         description: Document deleted
 */
router.delete(
  '/documents/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  controller.deleteRegistrantDocument
);

export default router;
