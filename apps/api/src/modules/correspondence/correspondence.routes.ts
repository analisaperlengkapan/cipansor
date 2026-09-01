import { Router } from 'express';
import { CorrespondenceController } from './correspondence.controller';
import { authenticate } from '@/middleware/auth';
import { validate, validateQuery } from '@/middleware/error';
import { upload } from '@/middleware/upload';
import {
  createLetterSchema,
  reviewLetterSchema,
  createDispositionSchema,
  updateDispositionStatusSchema,
  letterNoteSchema,
  listParticipantsQuerySchema,
} from './correspondence.schema';

const router = Router();

// Public route for letter verification
// Note: defaultLimiter is already applied globally in app.ts for non-dev/test environments.
// Omitting local defaultLimiter prevents double-counting against rate limit counters in production.
router.get('/public/verify', CorrespondenceController.verifyPublic);
router.get('/public/verify/:token', CorrespondenceController.verifyPublic);
router.post('/public/verify', upload.single('file'), CorrespondenceController.verifyPublic);

router.use(authenticate);

router.get(
  '/participants',
  validateQuery(listParticipantsQuerySchema),
  CorrespondenceController.getParticipants
);
router.post('/letters', validate(createLetterSchema), CorrespondenceController.create);
router.get('/letters', CorrespondenceController.findAll);
router.get('/stats', CorrespondenceController.getStats);
router.get('/letters/:id', CorrespondenceController.findOne);
router.post('/letters/:id/review', validate(reviewLetterSchema), CorrespondenceController.review);
router.post(
  '/letters/:id/submit',
  validate(letterNoteSchema),
  CorrespondenceController.submitForReview
);
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
