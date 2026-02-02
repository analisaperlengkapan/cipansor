import { Router } from 'express';
import { psychologyController } from './psychology.controller';
import { authenticate, authorize } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import {
  createPsychologyTestSchema,
  updatePsychologyTestSchema,
  createStudentPsychologyRecordSchema,
  updateStudentPsychologyRecordSchema
} from './psychology.schema';

const router = Router();

router.use(authenticate);

// Tests
router.get('/tests', psychologyController.getTests);
router.get('/tests/:id', psychologyController.getTestById);
router.post(
    '/tests',
    authorize(['SUPER_ADMIN', 'UNIT_ADMIN']),
    validate(createPsychologyTestSchema),
    psychologyController.createTest
);
router.patch(
    '/tests/:id',
    authorize(['SUPER_ADMIN', 'UNIT_ADMIN']),
    validate(updatePsychologyTestSchema),
    psychologyController.updateTest
);
router.delete(
    '/tests/:id',
    authorize(['SUPER_ADMIN', 'UNIT_ADMIN']),
    psychologyController.deleteTest
);

// Records
router.get('/records', psychologyController.getRecords);
router.get('/records/:id', psychologyController.getRecordById);
router.post(
    '/records',
    authorize(['SUPER_ADMIN', 'UNIT_ADMIN', 'TEACHER']), // Teachers (Counselors) can add records
    validate(createStudentPsychologyRecordSchema),
    psychologyController.createRecord
);
router.patch(
    '/records/:id',
    authorize(['SUPER_ADMIN', 'UNIT_ADMIN', 'TEACHER']),
    validate(updateStudentPsychologyRecordSchema),
    psychologyController.updateRecord
);
router.delete(
    '/records/:id',
    authorize(['SUPER_ADMIN', 'UNIT_ADMIN', 'TEACHER']),
    psychologyController.deleteRecord
);

export default router;
