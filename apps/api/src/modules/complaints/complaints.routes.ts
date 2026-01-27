import { Router } from 'express';
import { complaintsController } from './complaints.controller';
import { authenticate } from '@/middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', complaintsController.create);
router.get('/', complaintsController.findAll);
router.get('/:id', complaintsController.findOne);
router.patch('/:id/status', complaintsController.updateStatus);
router.patch('/:id/assign', complaintsController.assignHandler);
router.post('/:id/comments', complaintsController.addComment);

export const complaintsRoutes = router;
