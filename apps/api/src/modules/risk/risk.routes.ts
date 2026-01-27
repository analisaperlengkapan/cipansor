import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import * as riskController from './risk.controller';

const router = Router();

router.use(authenticate);

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
