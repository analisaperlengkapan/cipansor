import { Router } from 'express';
import { muhadatsahController } from './muhadatsah.controller';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// List and create
router.get('/', muhadatsahController.list);
router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  muhadatsahController.create
);

// Queries
router.get('/upcoming', muhadatsahController.getUpcoming);
router.get('/statistics', muhadatsahController.getStatistics);
router.get('/top-performers', muhadatsahController.getTopPerformers);
router.get('/match-partners', muhadatsahController.matchPartners);
router.get('/student/:studentId/history', muhadatsahController.getStudentHistory);

// CRUD by ID
router.get('/:id', muhadatsahController.getById);
router.patch(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  muhadatsahController.update
);
router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  muhadatsahController.delete
);

// Actions
router.post(
  '/:id/evaluate',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  muhadatsahController.evaluate
);
router.post(
  '/:id/cancel',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  muhadatsahController.cancel
);

export default router;
