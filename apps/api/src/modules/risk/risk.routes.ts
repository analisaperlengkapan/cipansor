import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@prisma/client';
import * as riskController from './risk.controller';

const router = Router();

router.use(authenticate);

// Restrict Risk Management to Admin and Yayasan roles
router.use(
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.YAYASAN_ADMIN,
    UserRole.YAYASAN_KETUA,
    UserRole.UNIT_ADMIN,
    UserRole.TKQ_ADMIN,
    UserRole.TKQ_KEPALA_SEKOLAH,
    UserRole.SDIT_ADMIN,
    UserRole.SDIT_KEPALA_SEKOLAH,
    UserRole.SMPIT_ADMIN,
    UserRole.SMPIT_KEPALA_SEKOLAH,
    UserRole.SMAQ_ADMIN,
    UserRole.SMAQ_KEPALA_SEKOLAH
  )
);

router.get('/', riskController.listRisks);
router.post('/', riskController.createRisk);
router.get('/:id', riskController.getRisk);
router.put('/:id', riskController.updateRisk);
router.delete('/:id', riskController.deleteRisk);

// Mitigations
router.post('/mitigation', riskController.addMitigation);
router.put('/mitigation/:id', riskController.updateMitigation);
router.delete('/mitigation/:id', riskController.deleteMitigation);

export default router;
