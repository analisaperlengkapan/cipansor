import { Router } from 'express';
import { CorrespondenceController } from './correspondence.controller';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import {
  createLetterSchema,
  reviewLetterSchema,
  createDispositionSchema,
  updateDispositionStatusSchema,
  letterNoteSchema,
} from './correspondence.schema';

import { defaultLimiter } from '@/middleware/rate-limit';

const router = Router();

// Public route for letter verification (uses defaultLimiter to prevent NAT gateway lockouts)
router.get('/public/verify', defaultLimiter, CorrespondenceController.verifyPublic);
router.get('/public/verify/:token', defaultLimiter, CorrespondenceController.verifyPublic);

router.use(authenticate);

router.post('/letters', validate(createLetterSchema), CorrespondenceController.create);
router.get('/letters', CorrespondenceController.findAll);
router.get('/stats', CorrespondenceController.getStats);
router.get('/letters/:id', CorrespondenceController.findOne);
router.post('/letters/:id/review', validate(reviewLetterSchema), CorrespondenceController.review);
// The way back from REVISION_NEEDED, which previously had none.
router.post(
  '/letters/:id/resubmit',
  validate(letterNoteSchema),
  CorrespondenceController.resubmit
);
// The end of the chain: the last official to hold the letter files it.
router.post(
  '/letters/:id/archive',
  validate(letterNoteSchema),
  CorrespondenceController.archive
);
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
