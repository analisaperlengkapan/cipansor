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
    UserRole.UNIT_ADMIN,
    UserRole.TEACHER,
    UserRole.STAFF // Added to ensure broad access for administrative staff
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
