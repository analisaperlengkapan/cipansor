import { Router } from "express";
import { UserRole } from "@prisma/client";
import * as controller from "./controller";
import { authenticate, authorize } from "../../middleware/auth";
import { validateQuery } from "../../middleware/error";
import { queryPermitSchema } from "./schema";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/permits:
 *   get:
 *     summary: List permits
 *     tags: [Permits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, RETURNED]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [SICK, FAMILY, PERSONAL]
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
 *         description: List of permits
 */
router.get("/", authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER), validateQuery(queryPermitSchema), controller.getPermits);

/**
 * @swagger
 * /api/permits/stats:
 *   get:
 *     summary: Get permit statistics
 *     tags: [Permits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permit statistics (pending, approved, by type, etc.)
 */
router.get("/stats", authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN), controller.getPermitStats);

/**
 * @swagger
 * /api/permits:
 *   post:
 *     summary: Create permit request
 *     tags: [Permits]
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
 *               - startDate
 *               - endDate
 *               - reason
 *             properties:
 *               studentId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [SICK, FAMILY, PERSONAL]
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               reason:
 *                 type: string
 *               parentContact:
 *                 type: string
 *     responses:
 *       201:
 *         description: Permit created
 */
router.post("/", authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER, UserRole.PARENT), controller.createPermit);

/**
 * @swagger
 * /api/permits/student/{studentId}/active:
 *   get:
 *     summary: Get student's active permit
 *     tags: [Permits]
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
 *         description: Student's active permit (if any)
 */
router.get("/student/:studentId/active", authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER, UserRole.PARENT), controller.getStudentActivePermit);

/**
 * @swagger
 * /api/permits/{id}:
 *   get:
 *     summary: Get permit by ID
 *     tags: [Permits]
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
 *         description: Permit details
 *       404:
 *         description: Permit not found
 */
router.get("/:id", authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER, UserRole.PARENT), controller.getPermitById);

/**
 * @swagger
 * /api/permits/{id}/status:
 *   put:
 *     summary: Update permit status (approve/reject)
 *     tags: [Permits]
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
 *                 enum: [APPROVED, REJECTED]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Permit status updated
 */
router.put("/:id/status", authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN), controller.updatePermitStatus);

/**
 * @swagger
 * /api/permits/{id}/return:
 *   put:
 *     summary: Mark student as returned
 *     tags: [Permits]
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
 *               returnDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student marked as returned
 */
router.put("/:id/return", authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER), controller.markReturned);

export default router;
