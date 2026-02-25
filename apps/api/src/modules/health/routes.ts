import { Router } from 'express';
import * as controller from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== MEDICAL RECORDS ====================

/**
 * @swagger
 * /api/health/records:
 *   get:
 *     summary: List medical records
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [CHECKUP, ILLNESS, INJURY, VACCINATION]
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
 *         description: List of medical records
 */
router.get('/records', controller.getMedicalRecords);

/**
 * @swagger
 * /api/health/records/{id}:
 *   get:
 *     summary: Get medical record by ID
 *     tags: [Health]
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
 *         description: Medical record details
 */
router.get('/records/:id', controller.getMedicalRecordById);

/**
 * @swagger
 * /api/health/records:
 *   post:
 *     summary: Create medical record
 *     tags: [Health]
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
 *               - type
 *               - date
 *             properties:
 *               studentId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [CHECKUP, ILLNESS, INJURY, VACCINATION]
 *               date:
 *                 type: string
 *                 format: date-time
 *               diagnosis:
 *                 type: string
 *               treatment:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Medical record created
 */
router.post('/records', controller.createMedicalRecord);

/**
 * @swagger
 * /api/health/records/{id}:
 *   put:
 *     summary: Update medical record
 *     tags: [Health]
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
 *         description: Medical record updated
 */
router.put('/records/:id', controller.updateMedicalRecord);

/**
 * @swagger
 * /api/health/records/{id}:
 *   delete:
 *     summary: Delete medical record
 *     tags: [Health]
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
 *         description: Medical record deleted
 */
router.delete('/records/:id', controller.deleteMedicalRecord);

/**
 * @swagger
 * /api/health/students/{studentId}/history:
 *   get:
 *     summary: Get student's medical history
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student's complete medical history
 */
router.get('/students/:studentId/history', controller.getStudentMedicalHistory);

// ==================== MEDICATIONS ====================

/**
 * @swagger
 * /api/health/medications:
 *   get:
 *     summary: List medications
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of medications
 */
router.get('/medications', controller.getMedications);

/**
 * @swagger
 * /api/health/medications/{id}:
 *   get:
 *     summary: Get medication by ID
 *     tags: [Health]
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
 *         description: Medication details
 */
router.get('/medications/:id', controller.getMedicationById);

/**
 * @swagger
 * /api/health/medications:
 *   post:
 *     summary: Add medication
 *     tags: [Health]
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
 *             properties:
 *               name:
 *                 type: string
 *               unitId:
 *                 type: string
 *               description:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               minStock:
 *                 type: integer
 *               expiryDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Medication added
 */
router.post('/medications', controller.createMedication);

/**
 * @swagger
 * /api/health/medications/{id}:
 *   put:
 *     summary: Update medication
 *     tags: [Health]
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
 *         description: Medication updated
 */
router.put('/medications/:id', controller.updateMedication);

/**
 * @swagger
 * /api/health/medications/{id}:
 *   delete:
 *     summary: Delete medication
 *     tags: [Health]
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
 *         description: Medication deleted
 */
router.delete('/medications/:id', controller.deleteMedication);

/**
 * @swagger
 * /api/health/medications/{id}/stock:
 *   post:
 *     summary: Add medication stock
 *     tags: [Health]
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
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *               expiryDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Stock added
 */
router.post('/medications/:id/stock', controller.addMedicationStock);

// ==================== MEDICATION USAGE ====================

/**
 * @swagger
 * /api/health/usage:
 *   get:
 *     summary: List medication usage logs
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: medicationId
 *         schema:
 *           type: string
 *       - in: query
 *         name: recordId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of medication usage
 */
router.get('/usage', controller.getMedicationUsageLogs);

/**
 * @swagger
 * /api/health/usage:
 *   post:
 *     summary: Log medication usage
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - medicationId
 *               - recordId
 *               - quantity
 *             properties:
 *               medicationId:
 *                 type: string
 *               recordId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usage logged
 */
router.post('/usage', controller.createMedicationUsage);

// ==================== STATISTICS ====================

/**
 * @swagger
 * /api/health/stats/{unitId}:
 *   get:
 *     summary: Get health statistics for unit
 *     tags: [Health]
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
 *         description: Health statistics (visits, common conditions, etc.)
 */
router.get('/stats/:unitId', controller.getHealthStats);

// ==================== GROWTH RECORDS ====================

/**
 * @swagger
 * /api/health/growth:
 *   post:
 *     summary: Create growth record
 *     tags: [Health]
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
 *               - recordDate
 *             properties:
 *               studentId:
 *                 type: string
 *               unitId:
 *                 type: string
 *               recordDate:
 *                 type: string
 *                 format: date
 *               weight:
 *                 type: number
 *               height:
 *                 type: number
 *               headCircumference:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Growth record created
 */
router.post('/growth', controller.createGrowthRecord);

/**
 * @swagger
 * /api/health/growth:
 *   get:
 *     summary: Get growth records
 *     tags: [Health]
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
 *     responses:
 *       200:
 *         description: List of growth records
 */
router.get('/growth', controller.getGrowthRecords);

// ==================== IMMUNIZATION RECORDS ====================

/**
 * @swagger
 * /api/health/immunization:
 *   post:
 *     summary: Create immunization record
 *     tags: [Health]
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
 *               - vaccineName
 *               - doseNumber
 *     responses:
 *       201:
 *         description: Immunization record created
 */
router.post('/immunization', controller.createImmunizationRecord);

/**
 * @swagger
 * /api/health/immunization:
 *   get:
 *     summary: Get immunization records
 *     tags: [Health]
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
 *     responses:
 *       200:
 *         description: List of immunization records
 */
router.get('/immunization', controller.getImmunizationRecords);

/**
 * @swagger
 * /api/health/immunization/{id}:
 *   put:
 *     summary: Update immunization record
 *     tags: [Health]
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
 *         description: Immunization record updated
 */
router.put('/immunization/:id', controller.updateImmunizationRecord);

/**
 * @swagger
 * /api/health/immunization/{id}:
 *   delete:
 *     summary: Delete immunization record
 *     tags: [Health]
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
 *         description: Immunization record deleted
 */
router.delete('/immunization/:id', controller.deleteImmunizationRecord);

export default router;
