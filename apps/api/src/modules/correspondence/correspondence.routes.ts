import { Router } from 'express';
import { CorrespondenceController } from './correspondence.controller';
import { authenticate } from '@/middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/letters', CorrespondenceController.create);
router.get('/letters', CorrespondenceController.findAll);
router.get('/letters/:id', CorrespondenceController.findOne);
router.post('/letters/:id/review', CorrespondenceController.review);
router.post('/dispositions', CorrespondenceController.createDisposition);

export default router;
