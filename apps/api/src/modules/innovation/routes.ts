import { Router } from 'express';
import { authenticate as requireAuth, authorize as requireRole } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import * as controller from './controller';
import * as schema from './schema';
import { UserRole } from '@prisma/client';

const router = Router();

// Public/Shared routes (Authenticated)
router.use(requireAuth);

router.post('/', validate(schema.createProposalSchema), controller.createProposal);
router.get('/', controller.getProposals);
router.get('/:id', controller.getProposal);
router.patch('/:id', validate(schema.updateProposalSchema), controller.updateProposal);
router.post('/:id/submit', controller.submitProposal);
router.post('/:id/comments', validate(schema.createCommentSchema), controller.addComment);

// Reviewer/Admin routes
router.post('/:id/approve', requireRole(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER), controller.approveProposal);
router.post('/:id/reject', requireRole(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER), controller.rejectProposal);
router.post('/:id/reviews', requireRole(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER), validate(schema.createReviewSchema), controller.addReview);

export default router;
