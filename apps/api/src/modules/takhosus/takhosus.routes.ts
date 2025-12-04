import { Router } from 'express';
import { halaqohController, enrollmentController, sanadController, progressController } from './takhosus.controller';
import { authenticate, authorize } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { UserRole } from '@prisma/client';
import {
  createHalaqohSchema,
  updateHalaqohSchema,
  createEnrollmentSchema,
  updateEnrollmentSchema,
  createSanadSchema,
  updateSanadSchema,
} from './takhosus.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// =====================================
// HALAQOH ROUTES
// =====================================

/**
 * @route GET /api/takhosus/halaqoh
 * @desc Get all halaqoh with pagination
 * @access Private - All authenticated users
 */
router.get('/halaqoh', halaqohController.list);

/**
 * @route GET /api/takhosus/halaqoh/:id
 * @desc Get halaqoh by ID
 * @access Private - All authenticated users
 */
router.get('/halaqoh/:id', halaqohController.getById);

/**
 * @route GET /api/takhosus/halaqoh/:id/progress
 * @desc Get halaqoh progress summary
 * @access Private - Admin, Teacher
 */
router.get(
  '/halaqoh/:id/progress',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  halaqohController.getProgress
);

/**
 * @route POST /api/takhosus/halaqoh
 * @desc Create new halaqoh
 * @access Private - Admin
 */
router.post(
  '/halaqoh',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(createHalaqohSchema),
  halaqohController.create
);

/**
 * @route PUT /api/takhosus/halaqoh/:id
 * @desc Update halaqoh
 * @access Private - Admin
 */
router.put(
  '/halaqoh/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(updateHalaqohSchema),
  halaqohController.update
);

/**
 * @route DELETE /api/takhosus/halaqoh/:id
 * @desc Delete halaqoh (soft delete)
 * @access Private - Admin only
 */
router.delete(
  '/halaqoh/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  halaqohController.delete
);

// =====================================
// ENROLLMENT ROUTES
// =====================================

/**
 * @route GET /api/takhosus/enrollment/stats
 * @desc Get enrollment statistics
 * @access Private - Admin, Teacher
 */
router.get(
  '/enrollment/stats',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  enrollmentController.getStats
);

/**
 * @route GET /api/takhosus/enrollment
 * @desc Get all enrollments with pagination
 * @access Private - Admin, Teacher
 */
router.get(
  '/enrollment',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  enrollmentController.list
);

/**
 * @route GET /api/takhosus/enrollment/:id
 * @desc Get enrollment by ID
 * @access Private - Admin, Teacher
 */
router.get(
  '/enrollment/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  enrollmentController.getById
);

/**
 * @route GET /api/takhosus/enrollment/student/:studentId
 * @desc Get enrollment by student ID
 * @access Private - Admin, Teacher
 */
router.get(
  '/enrollment/student/:studentId',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  enrollmentController.getByStudentId
);

/**
 * @route POST /api/takhosus/enrollment
 * @desc Enroll student in Takhosus program
 * @access Private - Admin, Teacher
 */
router.post(
  '/enrollment',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  validate(createEnrollmentSchema),
  enrollmentController.create
);

/**
 * @route PUT /api/takhosus/enrollment/:id
 * @desc Update enrollment
 * @access Private - Admin, Teacher
 */
router.put(
  '/enrollment/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  validate(updateEnrollmentSchema),
  enrollmentController.update
);

/**
 * @route DELETE /api/takhosus/enrollment/:id
 * @desc Delete enrollment
 * @access Private - Admin only
 */
router.delete(
  '/enrollment/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  enrollmentController.delete
);

// =====================================
// SANAD ROUTES
// =====================================

/**
 * @route GET /api/takhosus/sanad
 * @desc Get all sanad records with pagination
 * @access Private - Admin, Teacher
 */
router.get(
  '/sanad',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  sanadController.list
);

/**
 * @route GET /api/takhosus/sanad/:id
 * @desc Get sanad by ID
 * @access Private - Admin, Teacher
 */
router.get(
  '/sanad/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  sanadController.getById
);

/**
 * @route POST /api/takhosus/sanad
 * @desc Create sanad record (certify juz completion)
 * @access Private - Teacher (musyrif)
 */
router.post(
  '/sanad',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  validate(createSanadSchema),
  sanadController.create
);

/**
 * @route PUT /api/takhosus/sanad/:id
 * @desc Update sanad record
 * @access Private - Admin, Teacher
 */
router.put(
  '/sanad/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  validate(updateSanadSchema),
  sanadController.update
);

/**
 * @route DELETE /api/takhosus/sanad/:id
 * @desc Delete sanad record
 * @access Private - Admin only
 */
router.delete(
  '/sanad/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  sanadController.delete
);

// =====================================
// PROGRESS ROUTES
// =====================================

/**
 * @route GET /api/takhosus/progress/me
 * @desc Get my (student's) progress
 * @access Private - Student
 */
router.get(
  '/progress/me',
  authorize(UserRole.STUDENT),
  progressController.getMyProgress
);

/**
 * @route GET /api/takhosus/progress/student/:studentId
 * @desc Get student's takhosus progress
 * @access Private - Admin, Teacher
 */
router.get(
  '/progress/student/:studentId',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  progressController.getStudentProgress
);

export default router;
