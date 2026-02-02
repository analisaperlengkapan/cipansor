import { Router } from 'express';
import { requireAuth, requireRole } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import * as controller from './controller';
import * as schema from './schema';

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
router.post('/:id/approve', requireRole(['SUPER_ADMIN', 'UNIT_ADMIN', 'TEACHER']), controller.approveProposal);
router.post('/:id/reject', requireRole(['SUPER_ADMIN', 'UNIT_ADMIN', 'TEACHER']), controller.rejectProposal);
router.post('/:id/reviews', requireRole(['SUPER_ADMIN', 'UNIT_ADMIN', 'TEACHER']), validate(schema.createReviewSchema), controller.addReview);

export default router;
