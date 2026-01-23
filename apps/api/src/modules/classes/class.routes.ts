import { Router } from 'express';
import { authenticate, isAdmin } from '@/middleware/auth';
import { validate, validateQuery, validateParams } from '@/middleware/error';
import * as controller from './class.controller';
import {
  createClassSchema,
  updateClassSchema,
  listClassesQuerySchema,
  classIdParamSchema,
  enrollStudentSchema,
  updateEnrollmentSchema,
} from './class.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/classes:
 *   get:
 *     summary: List classes
 *     tags: [Classes]
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
 *         name: level
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of classes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Class'
 */
router.get('/', validateQuery(listClassesQuerySchema), controller.list);

/**
 * @swagger
 * /api/classes/{id}:
 *   get:
 *     summary: Get class by ID
 *     tags: [Classes]
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
 *         description: Class details with enrollments
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', validateParams(classIdParamSchema), controller.getById);

/**
 * @swagger
 * /api/classes:
 *   post:
 *     summary: Create class (Admin only)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [unitId, academicYearId, name, level]
 *             properties:
 *               unitId:
 *                 type: string
 *                 format: uuid
 *               academicYearId:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *                 example: Kelas 7A
 *               level:
 *                 type: integer
 *                 example: 7
 *               homeroomTeacherId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Class created
 */
router.post('/', isAdmin, validate(createClassSchema), controller.create);

/**
 * @swagger
 * /api/classes/{id}:
 *   put:
 *     summary: Update class (Admin only)
 *     tags: [Classes]
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
 *               name:
 *                 type: string
 *               level:
 *                 type: integer
 *               homeroomTeacherId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Class updated
 */
router.put(
  '/:id',
  isAdmin,
  validateParams(classIdParamSchema),
  validate(updateClassSchema),
  controller.update
);

/**
 * @swagger
 * /api/classes/{id}:
 *   delete:
 *     summary: Delete class (Admin only)
 *     tags: [Classes]
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
 *         description: Class deleted
 */
router.delete('/:id', isAdmin, validateParams(classIdParamSchema), controller.remove);

/**
 * @swagger
 * /api/classes/{id}/enrollments:
 *   get:
 *     summary: Get class enrollments
 *     tags: [Classes]
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
 *         description: List of enrollments
 */
router.get('/:id/enrollments', validateParams(classIdParamSchema), controller.getEnrollments);

/**
 * @swagger
 * /api/classes/{id}/enrollments:
 *   post:
 *     summary: Enroll student in class (Admin only)
 *     tags: [Classes]
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
 *             required: [studentId]
 *             properties:
 *               studentId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Student enrolled
 */
router.post(
  '/:id/enrollments',
  isAdmin,
  validateParams(classIdParamSchema),
  validate(enrollStudentSchema),
  controller.enrollStudent
);

/**
 * @swagger
 * /api/classes/{id}/enrollments/{studentId}:
 *   patch:
 *     summary: Update enrollment (Admin only)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Enrollment updated
 */
router.patch(
  '/:id/enrollments/:studentId',
  isAdmin,
  validateParams(classIdParamSchema),
  validate(updateEnrollmentSchema),
  controller.updateEnrollment
);

/**
 * @swagger
 * /api/classes/{id}/enrollments/{studentId}:
 *   delete:
 *     summary: Remove student from class (Admin only)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Student removed from class
 */
router.delete(
  '/:id/enrollments/:studentId',
  isAdmin,
  validateParams(classIdParamSchema),
  controller.removeStudent
);

export default router;
