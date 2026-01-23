import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as controller from './controller';
import * as accreditationController from './accreditation.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validateQuery } from '../../middleware/error';
import { queryFoundationSchema, queryBoardMemberSchema, queryDocumentSchema } from './schema';

const router = Router();

router.use(authenticate);

// ==================== FOUNDATIONS ====================

/**
 * @swagger
 * /api/foundation:
 *   get:
 *     summary: List foundations
 *     tags: [Foundation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: List of foundations
 */
router.get(
  '/',
  authorize(UserRole.SUPER_ADMIN),
  validateQuery(queryFoundationSchema),
  controller.getFoundations
);

/**
 * @swagger
 * /api/foundation:
 *   post:
 *     summary: Create foundation
 *     tags: [Foundation]
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
 *               - legalNumber
 *             properties:
 *               name:
 *                 type: string
 *               legalNumber:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               website:
 *                 type: string
 *               establishedDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Foundation created
 */
router.post('/', authorize(UserRole.SUPER_ADMIN), controller.createFoundation);

/**
 * @swagger
 * /api/foundation/{id}:
 *   get:
 *     summary: Get foundation by ID
 *     tags: [Foundation]
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
 *         description: Foundation details
 */
router.get('/:id', authorize(UserRole.SUPER_ADMIN), controller.getFoundationById);

/**
 * @swagger
 * /api/foundation/{id}/stats:
 *   get:
 *     summary: Get foundation statistics
 *     tags: [Foundation]
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
 *         description: Foundation statistics (units, students, staff)
 */
router.get('/:id/stats', authorize(UserRole.SUPER_ADMIN), controller.getFoundationStats);

// ==================== EXECUTIVE DASHBOARD ANALYTICS ====================

/**
 * @swagger
 * /api/foundation/stats/executive:
 *   get:
 *     summary: Get executive summary statistics
 *     tags: [Foundation - Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Executive summary with totals and growth
 */
router.get('/stats/executive', authorize(UserRole.SUPER_ADMIN), controller.getExecutiveSummary);

/**
 * @swagger
 * /api/foundation/stats/financial:
 *   get:
 *     summary: Get financial overview
 *     tags: [Foundation - Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Financial data with month comparison and unit breakdown
 */
router.get('/stats/financial', authorize(UserRole.SUPER_ADMIN), controller.getFinancialOverview);

/**
 * @swagger
 * /api/foundation/stats/units:
 *   get:
 *     summary: Get unit comparison metrics
 *     tags: [Foundation - Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unit comparison with student/teacher ratios
 */
router.get('/stats/units', authorize(UserRole.SUPER_ADMIN), controller.getUnitComparison);

/**
 * @swagger
 * /api/foundation/{id}:
 *   put:
 *     summary: Update foundation
 *     tags: [Foundation]
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
 *         description: Foundation updated
 */
router.put('/:id', authorize(UserRole.SUPER_ADMIN), controller.updateFoundation);

/**
 * @swagger
 * /api/foundation/{id}:
 *   delete:
 *     summary: Delete foundation
 *     tags: [Foundation]
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
 *         description: Foundation deleted
 */
router.delete('/:id', authorize(UserRole.SUPER_ADMIN), controller.deleteFoundation);

// ==================== BOARD MEMBERS ====================

/**
 * @swagger
 * /api/foundation/board-members/list:
 *   get:
 *     summary: List board members
 *     tags: [Foundation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: foundationId
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
 *         description: List of board members
 */
router.get(
  '/board-members/list',
  authorize(UserRole.SUPER_ADMIN),
  validateQuery(queryBoardMemberSchema),
  controller.getBoardMembers
);

/**
 * @swagger
 * /api/foundation/board-members:
 *   post:
 *     summary: Add board member
 *     tags: [Foundation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - foundationId
 *               - name
 *               - position
 *               - startDate
 *             properties:
 *               foundationId:
 *                 type: string
 *               name:
 *                 type: string
 *               position:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Board member added
 */
router.post('/board-members', authorize(UserRole.SUPER_ADMIN), controller.createBoardMember);

/**
 * @swagger
 * /api/foundation/board-members/{id}:
 *   get:
 *     summary: Get board member by ID
 *     tags: [Foundation]
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
 *         description: Board member details
 */
router.get('/board-members/:id', authorize(UserRole.SUPER_ADMIN), controller.getBoardMemberById);

/**
 * @swagger
 * /api/foundation/board-members/{id}:
 *   put:
 *     summary: Update board member
 *     tags: [Foundation]
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
 *         description: Board member updated
 */
router.put('/board-members/:id', authorize(UserRole.SUPER_ADMIN), controller.updateBoardMember);

/**
 * @swagger
 * /api/foundation/board-members/{id}/end-term:
 *   patch:
 *     summary: End board member term
 *     tags: [Foundation]
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
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Board member term ended
 */
router.patch(
  '/board-members/:id/end-term',
  authorize(UserRole.SUPER_ADMIN),
  controller.endBoardMemberTerm
);

/**
 * @swagger
 * /api/foundation/board-members/{id}:
 *   delete:
 *     summary: Delete board member
 *     tags: [Foundation]
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
 *         description: Board member deleted
 */
router.delete('/board-members/:id', authorize(UserRole.SUPER_ADMIN), controller.deleteBoardMember);

// ==================== DOCUMENTS ====================

/**
 * @swagger
 * /api/foundation/documents/list:
 *   get:
 *     summary: List foundation documents
 *     tags: [Foundation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: foundationId
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
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
 *         description: List of foundation documents
 */
router.get(
  '/documents/list',
  authorize(UserRole.SUPER_ADMIN),
  validateQuery(queryDocumentSchema),
  controller.getDocuments
);

/**
 * @swagger
 * /api/foundation/documents:
 *   post:
 *     summary: Add foundation document
 *     tags: [Foundation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - foundationId
 *               - name
 *               - type
 *               - url
 *             properties:
 *               foundationId:
 *                 type: string
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [LEGAL, PERMIT, FINANCIAL, OTHER]
 *               url:
 *                 type: string
 *               description:
 *                 type: string
 *               issuedDate:
 *                 type: string
 *                 format: date
 *               expiryDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Document added
 */
router.post('/documents', authorize(UserRole.SUPER_ADMIN), controller.createDocument);

/**
 * @swagger
 * /api/foundation/documents/{id}:
 *   get:
 *     summary: Get document by ID
 *     tags: [Foundation]
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
 *         description: Document details
 */
router.get('/documents/:id', authorize(UserRole.SUPER_ADMIN), controller.getDocumentById);

/**
 * @swagger
 * /api/foundation/documents/{id}:
 *   put:
 *     summary: Update document
 *     tags: [Foundation]
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
 *         description: Document updated
 */
router.put('/documents/:id', authorize(UserRole.SUPER_ADMIN), controller.updateDocument);

/**
 * @swagger
 * /api/foundation/documents/{id}:
 *   delete:
 *     summary: Delete document
 *     tags: [Foundation]
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
router.delete('/documents/:id', authorize(UserRole.SUPER_ADMIN), controller.deleteDocument);

// ==================== ACCREDITATION ====================

/**
 * @swagger
 * /api/foundation/accreditation/standards:
 *   get:
 *     summary: Get 8 SNP standards for accreditation
 *     tags: [Foundation - Accreditation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of 8 SNP standards with indicators
 */
router.get('/accreditation/standards', accreditationController.getStandards);

/**
 * @swagger
 * /api/foundation/accreditation/units/{unitId}/status:
 *   get:
 *     summary: Get unit accreditation status and statistics
 *     tags: [Foundation - Accreditation]
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
 *         description: Unit accreditation status
 */
router.get('/accreditation/units/:unitId/status', accreditationController.getUnitStatus);

/**
 * @swagger
 * /api/foundation/accreditation/units/{unitId}/dashboard:
 *   get:
 *     summary: Get accreditation dashboard with readiness scores
 *     tags: [Foundation - Accreditation]
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
 *         description: Accreditation dashboard with readiness analysis
 */
router.get('/accreditation/units/:unitId/dashboard', accreditationController.getDashboard);

/**
 * @swagger
 * /api/foundation/accreditation/units/{unitId}/simulate:
 *   post:
 *     summary: Simulate accreditation score
 *     tags: [Foundation - Accreditation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: unitId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scores:
 *                 type: object
 *                 description: Score per standard (0-100)
 *     responses:
 *       200:
 *         description: Simulated accreditation result
 */
router.post('/accreditation/units/:unitId/simulate', accreditationController.simulateScore);

/**
 * @swagger
 * /api/foundation/accreditation/assessment:
 *   post:
 *     summary: Submit accreditation self-assessment
 *     tags: [Foundation - Accreditation]
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
 *               - assessments
 *             properties:
 *               unitId:
 *                 type: string
 *               academicYearId:
 *                 type: string
 *               assessmentDate:
 *                 type: string
 *                 format: date
 *               assessments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     standardCode:
 *                       type: string
 *                     indicatorCode:
 *                       type: string
 *                     score:
 *                       type: number
 *                     evidence:
 *                       type: string
 *                     notes:
 *                       type: string
 *     responses:
 *       201:
 *         description: Assessment submitted
 */
router.post(
  '/accreditation/assessment',
  authorize(UserRole.SUPER_ADMIN),
  accreditationController.submitAssessment
);

export default router;
