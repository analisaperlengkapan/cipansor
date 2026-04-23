import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@prisma/client';
import { businessUnitController } from './controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/business-units - List business units (any authenticated user)
router.get('/', businessUnitController.list);

// GET /api/business-units/:id - Get business unit by ID (admin/staff only)
router.get(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  businessUnitController.getById
);

// GET /api/business-units/:id/performance - Get business unit performance (admin/staff only)
router.get(
  '/:id/performance',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  businessUnitController.getPerformance
);

// POST /api/business-units - Create business unit (admin only)
router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  businessUnitController.create
);

// PUT /api/business-units/:id - Update business unit (admin only)
router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  businessUnitController.update
);

// DELETE /api/business-units/:id - Delete business unit (admin only)
router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  businessUnitController.delete
);

export default router;
