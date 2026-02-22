import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@prisma/client';
import * as syariahController from './syariah.controller';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER, UserRole.STAFF));

router.get('/', syariahController.listCompliances);
router.get('/summary', syariahController.getSummary);
router.post('/', syariahController.createCompliance);
router.get('/:id', syariahController.getCompliance);
router.put('/:id', syariahController.updateCompliance);
router.delete('/:id', syariahController.deleteCompliance);

// Sharia Audits
router.post('/audits', syariahController.createAudit);

export default router;
