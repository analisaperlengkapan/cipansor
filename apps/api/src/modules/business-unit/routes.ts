import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@prisma/client';
import { businessUnitController } from './controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/business-units - List business units (any authenticated user)
router.get('/', businessUnitController.list);

// GET /api/business-units/:id - Get business unit by ID
router.get('/:id', businessUnitController.getById);

// GET /api/business-units/:id/performance - Get business unit performance
router.get('/:id/performance', businessUnitController.getPerformance);

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
