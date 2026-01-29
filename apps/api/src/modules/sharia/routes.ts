import { Router } from 'express';
import { shariaController } from './sharia.controller';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// Require authentication for all routes
router.use(authenticate);

// Mustahik Routes
router.get(
  '/mustahik',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  shariaController.listMustahik
);

router.get(
  '/mustahik/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  shariaController.getMustahikById
);

router.post(
  '/mustahik',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  shariaController.createMustahik
);

router.put(
  '/mustahik/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  shariaController.updateMustahik
);

router.delete(
  '/mustahik/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  shariaController.deleteMustahik
);

export default router;
