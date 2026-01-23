import { Router } from 'express';
import { qualityController } from './quality.controller';
import { authenticate, authorize } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { createEvidenceSchema, createAuditSchema } from './schema';
import { UserRole } from '@prisma/client';

const router = Router();

// Public/Shared routes (protected by Auth)
router.get('/standards', authenticate, qualityController.getAllStandards);

router.get('/standards/:id', authenticate, qualityController.getStandardDetails);

router.get('/dashboard/summary', authenticate, qualityController.getDashboardSummary);

// Admin/Staff routes
router.post(
  '/evidence',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF, UserRole.TEACHER),
  validate(createEvidenceSchema),
  qualityController.createEvidence
);

router.delete(
  '/evidence/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  qualityController.deleteEvidence
);

export const qualityRoutes = router;
