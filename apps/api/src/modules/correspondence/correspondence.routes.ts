import { Router } from 'express';
import { CorrespondenceController } from './correspondence.controller';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import {
  createLetterSchema,
  reviewLetterSchema,
  createDispositionSchema,
  updateDispositionStatusSchema,
} from './correspondence.schema';

const router = Router();

router.use(authenticate);

router.post('/letters', validate(createLetterSchema), CorrespondenceController.create);
router.get('/letters', CorrespondenceController.findAll);
router.get('/letters/:id', CorrespondenceController.findOne);
router.post('/letters/:id/review', validate(reviewLetterSchema), CorrespondenceController.review);
router.post(
  '/dispositions',
  validate(createDispositionSchema),
  CorrespondenceController.createDisposition
);
router.patch(
  '/dispositions/:id/status',
  validate(updateDispositionStatusSchema),
  CorrespondenceController.updateDispositionStatus
);

export default router;
