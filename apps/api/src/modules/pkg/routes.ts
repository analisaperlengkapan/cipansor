/**
 * PKG (Penilaian Kinerja Guru) API Routes
 *
 * Endpoints untuk manajemen PKG berdasarkan Permendiknas No. 35 Tahun 2010
 */

import { Router } from 'express';
import { authenticate, authorize, isTeacherOrAbove } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import * as controller from './controller';
import {
  createPeriodSchema,
  updatePeriodSchema,
  createEvaluationSchema,
  submitScoresSchema,
  addDocumentSchema,
} from './schema';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// ==================== PERIOD ====================
router.get('/indicators', controller.getIndicators);
router.get('/periods', controller.listPeriods);
router.post('/periods', authorize('SUPER_ADMIN', 'UNIT_ADMIN'), validate(createPeriodSchema), controller.createPeriod);
router.get('/periods/:id', controller.getPeriod);
router.put('/periods/:id', authorize('SUPER_ADMIN', 'UNIT_ADMIN'), validate(updatePeriodSchema), controller.updatePeriod);
router.delete('/periods/:id', authorize('SUPER_ADMIN', 'UNIT_ADMIN'), controller.deletePeriod);

// ==================== EVALUATION ====================
router.get('/evaluations', controller.listEvaluations);
router.post('/evaluations', authorize('SUPER_ADMIN', 'UNIT_ADMIN'), validate(createEvaluationSchema), controller.createEvaluation);
router.post('/evaluations/bulk', authorize('SUPER_ADMIN', 'UNIT_ADMIN'), controller.bulkCreateEvaluations);
router.get('/evaluations/:id', controller.getEvaluation);
router.post('/evaluations/:id/scores', isTeacherOrAbove, validate(submitScoresSchema), controller.submitScores);
router.patch('/evaluations/:id/status', isTeacherOrAbove, controller.updateEvaluationStatus);

// ==================== DOCUMENT ====================
router.post('/evaluations/:id/documents', isTeacherOrAbove, validate(addDocumentSchema), controller.addDocument);
router.delete('/documents/:id', isTeacherOrAbove, controller.deleteDocument);

// ==================== TEACHER HISTORY & STATISTICS ====================
router.get('/teachers/:teacherId/history', controller.getTeacherHistory);
router.get('/statistics', controller.getStatistics);

export default router;
