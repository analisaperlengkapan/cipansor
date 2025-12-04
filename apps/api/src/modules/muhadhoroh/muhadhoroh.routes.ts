import { Router } from 'express';
import { muhadhorohController } from './muhadhoroh.controller';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// List and create
router.get('/', muhadhorohController.list);
router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  muhadhorohController.create
);

// Queries
router.get('/upcoming', muhadhorohController.getUpcoming);
router.get('/statistics', muhadhorohController.getStatistics);
router.get('/top-performers', muhadhorohController.getTopPerformers);
router.get('/student/:studentId/history', muhadhorohController.getStudentHistory);

// CRUD by ID
router.get('/:id', muhadhorohController.getById);
router.patch(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  muhadhorohController.update
);
router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  muhadhorohController.delete
);

// Actions
router.post(
  '/:id/evaluate',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  muhadhorohController.evaluate
);
router.post(
  '/:id/cancel',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  muhadhorohController.cancel
);

export default router;
