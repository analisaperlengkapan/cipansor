import { Router } from 'express';
import { complaintsController } from './complaints.controller';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.post('/', complaintsController.create);
router.get('/', complaintsController.findAll);
router.get('/:id', complaintsController.findOne);

// Only Admin and Staff can update status and assign handlers
router.patch(
  '/:id/status',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  complaintsController.updateStatus
);

router.patch(
  '/:id/assign',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  complaintsController.assignHandler
);

router.post('/:id/comments', complaintsController.addComment);

export const complaintsRoutes = router;
