import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { RoleCode } from '@prisma/client';
import { businessUnitController } from './controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/business-units - List business units (admin/staff only)
router.get(
  '/',
  authorize(
    RoleCode.SUPER_ADMIN,
    RoleCode.YAYASAN_ADMIN, RoleCode.TKQ_ADMIN, RoleCode.SDIT_ADMIN, RoleCode.SMPIT_ADMIN, RoleCode.SMAQ_ADMIN,
    RoleCode.TKQ_TATA_USAHA, RoleCode.SDIT_TATA_USAHA, RoleCode.SMPIT_TATA_USAHA, RoleCode.SMAQ_TATA_USAHA,
  ),
  businessUnitController.list
);

// GET /api/business-units/:id - Get business unit by ID (admin/staff only)
router.get(
  '/:id',
  authorize(
    RoleCode.SUPER_ADMIN,
    RoleCode.YAYASAN_ADMIN, RoleCode.TKQ_ADMIN, RoleCode.SDIT_ADMIN, RoleCode.SMPIT_ADMIN, RoleCode.SMAQ_ADMIN,
    RoleCode.TKQ_TATA_USAHA, RoleCode.SDIT_TATA_USAHA, RoleCode.SMPIT_TATA_USAHA, RoleCode.SMAQ_TATA_USAHA,
  ),
  businessUnitController.getById
);

// GET /api/business-units/:id/performance - Get business unit performance (admin/staff only)
router.get(
  '/:id/performance',
  authorize(
    RoleCode.SUPER_ADMIN,
    RoleCode.YAYASAN_ADMIN, RoleCode.TKQ_ADMIN, RoleCode.SDIT_ADMIN, RoleCode.SMPIT_ADMIN, RoleCode.SMAQ_ADMIN,
    RoleCode.TKQ_TATA_USAHA, RoleCode.SDIT_TATA_USAHA, RoleCode.SMPIT_TATA_USAHA, RoleCode.SMAQ_TATA_USAHA,
  ),
  businessUnitController.getPerformance
);

// POST /api/business-units - Create business unit (admin only)
router.post(
  '/',
  authorize(
    RoleCode.SUPER_ADMIN,
    RoleCode.YAYASAN_ADMIN, RoleCode.TKQ_ADMIN, RoleCode.SDIT_ADMIN, RoleCode.SMPIT_ADMIN, RoleCode.SMAQ_ADMIN,
  ),
  businessUnitController.create
);

// PUT /api/business-units/:id - Update business unit (admin only)
router.put(
  '/:id',
  authorize(
    RoleCode.SUPER_ADMIN,
    RoleCode.YAYASAN_ADMIN, RoleCode.TKQ_ADMIN, RoleCode.SDIT_ADMIN, RoleCode.SMPIT_ADMIN, RoleCode.SMAQ_ADMIN,
  ),
  businessUnitController.update
);

// DELETE /api/business-units/:id - Delete business unit (admin only)
router.delete(
  '/:id',
  authorize(
    RoleCode.SUPER_ADMIN,
    RoleCode.YAYASAN_ADMIN, RoleCode.TKQ_ADMIN, RoleCode.SDIT_ADMIN, RoleCode.SMPIT_ADMIN, RoleCode.SMAQ_ADMIN,
  ),
  businessUnitController.delete
);

export default router;
