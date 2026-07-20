import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@prisma/client';
import * as controller from './student-compliance.controller';

const router = Router();

// All routes require authentication.
router.use(authenticate);

// Roles allowed to edit / report on student compliance data.
const MANAGE_ROLES = [UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF] as const;

// Static routes first (before the dynamic /:studentId).
/** @route GET /api/student-compliance/report/completeness */
router.get('/report/completeness', authorize(...MANAGE_ROLES), controller.completenessReport);

/** @route GET /api/student-compliance/report/dapodik-ready */
router.get('/report/dapodik-ready', authorize(...MANAGE_ROLES), controller.dapodikReady);

/** @route POST /api/student-compliance/bulk-update */
router.post('/bulk-update', authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN), controller.bulkUpdate);

/** @route GET /api/student-compliance/:studentId */
router.get('/:studentId', controller.getByStudent);

/** @route PUT /api/student-compliance/:studentId */
router.put('/:studentId', authorize(...MANAGE_ROLES), controller.update);

export default router;
