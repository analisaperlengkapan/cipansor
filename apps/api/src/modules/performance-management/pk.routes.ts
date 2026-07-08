import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@prisma/client';
import * as pkController from './pk.controller';
import * as evalController from './evaluation.controller';
import * as analyticsController from './analytics.controller';

const router = Router();

router.use(authenticate);

// Dashboards & Analytics
router.get('/dashboard', analyticsController.getDashboard);
router.get('/dashboard/drilldown/:unitId', analyticsController.getDrilldown);
router.get('/reports/consolidated', analyticsController.getConsolidatedReport);

// Performance Agreements
router.get('/', pkController.listPKs);
router.post('/', pkController.createPK);
router.get('/:id', pkController.getPK);
router.put('/:id', pkController.updatePK);
router.post('/:id/propose', pkController.proposePK);
router.post('/:id/approve', pkController.approvePK);

// Indicators
router.post('/indicators', pkController.createIndicator);
router.put('/indicators/:id', pkController.updateIndicator);
router.delete('/indicators/:id', pkController.deleteIndicator);

// Evaluations
router.post('/evaluations', evalController.createEvaluation);
router.get('/evaluations/:id', evalController.getEvaluation);
router.post('/evaluations/:id/indicators', evalController.updateIndicatorRealization);
router.post('/evaluations/:id/behavior', evalController.updateBehaviorScore);
router.post('/evaluations/:id/approve', evalController.approveEvaluation);

// Master Data: Behavioral Values (Admin only)
router.get('/settings/behavioral-values', evalController.listBehavioralValues);
router.post(
  '/settings/behavioral-values',
  authorize(UserRole.SUPER_ADMIN),
  evalController.createBehavioralValue
);
router.put(
  '/settings/behavioral-values/:id',
  authorize(UserRole.SUPER_ADMIN),
  evalController.updateBehavioralValue
);
router.delete(
  '/settings/behavioral-values/:id',
  authorize(UserRole.SUPER_ADMIN),
  evalController.deleteBehavioralValue
);

export default router;
