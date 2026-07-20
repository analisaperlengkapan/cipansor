import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@prisma/client';
import * as controller from './teacher-compliance.controller';

const router = Router();

// All routes require authentication.
router.use(authenticate);

// Roles allowed to edit / report on teacher compliance data.
const MANAGE_ROLES = [UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN] as const;

// Static routes first (before the dynamic /:teacherId).
/** @route GET /api/teacher-compliance/report/completeness */
router.get('/report/completeness', authorize(...MANAGE_ROLES), controller.completenessReport);

/** @route GET /api/teacher-compliance/report/simtun-ready */
router.get('/report/simtun-ready', authorize(...MANAGE_ROLES), controller.simtunReady);

/** @route GET /api/teacher-compliance/report/certification */
router.get('/report/certification', authorize(...MANAGE_ROLES), controller.certificationReport);

/** @route POST /api/teacher-compliance/bulk-update */
router.post('/bulk-update', authorize(...MANAGE_ROLES), controller.bulkUpdate);

/** @route GET /api/teacher-compliance/:teacherId */
router.get('/:teacherId', controller.getByTeacher);

/** @route PUT /api/teacher-compliance/:teacherId */
router.put('/:teacherId', authorize(...MANAGE_ROLES), controller.update);

export default router;
