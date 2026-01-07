import { Router } from 'express';
import { procurementController } from './procurement.controller';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// Public routes (authenticated)
router.use(authenticate);

// Create Request (Staff/Teacher can create)
// Note: YAYASAN_ADMIN might be missing in older Prisma Client types, casting to any if needed or ensuring generation
router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER, UserRole.STAFF, 'YAYASAN_ADMIN' as any),
  procurementController.create
);

// List Requests
router.get(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER, UserRole.STAFF, 'YAYASAN_ADMIN' as any),
  procurementController.findAll
);

// Get Detail
router.get(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER, UserRole.STAFF, 'YAYASAN_ADMIN' as any),
  procurementController.findById
);

// Approve/Reject (Admins only)
router.patch(
  '/:id/status',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, 'YAYASAN_ADMIN' as any),
  procurementController.updateStatus
);

// Fulfill (Admins only - triggers asset creation)
router.post(
  '/:id/fulfill',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, 'YAYASAN_ADMIN' as any),
  procurementController.fulfill
);

export const procurementRoutes = router;
