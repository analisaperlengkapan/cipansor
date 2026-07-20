/**
 * Portfolio API Routes
 *
 * Endpoints untuk manajemen portofolio digital siswa
 */

import { Router } from 'express';
import { authenticate, isTeacherOrAbove } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import * as controller from './portfolio.controller';
import {
  createPortfolioSchema,
  updatePortfolioSchema,
  addFileSchema,
  addCommentSchema,
  reviewPortfolioSchema,
} from './portfolio.schema';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// ==================== PORTFOLIO ====================
router.get('/types', controller.getTypes);
router.get('/', controller.list);
router.post('/', validate(createPortfolioSchema), controller.create);
router.get('/:id', controller.getById);
router.put('/:id', validate(updatePortfolioSchema), controller.update);
router.delete('/:id', controller.remove);

// ==================== FILES ====================
router.post('/:id/files', validate(addFileSchema), controller.addFile);
router.patch('/files/:fileId', controller.updateFile);
router.delete('/files/:fileId', controller.deleteFile);

// ==================== COMMENTS ====================
router.post('/:id/comments', validate(addCommentSchema), controller.addComment);
router.patch('/comments/:commentId', controller.updateComment);
router.delete('/comments/:commentId', controller.deleteComment);

// ==================== REVIEW ====================
router.post('/:id/review', isTeacherOrAbove, validate(reviewPortfolioSchema), controller.review);

// ==================== STATISTICS ====================
router.get('/statistics/summary', controller.getStatistics);
router.get('/showcase/:studentId', controller.getShowcase);

export default router;
