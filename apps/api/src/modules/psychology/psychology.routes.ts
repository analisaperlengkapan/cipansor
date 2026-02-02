import { Router } from 'express';
import { psychologyController } from './psychology.controller';
import { authenticate, authorize } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { UserRole } from '@prisma/client';
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
    authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
    validate(createPsychologyTestSchema),
    psychologyController.createTest
);
router.patch(
    '/tests/:id',
    authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
    validate(updatePsychologyTestSchema),
    psychologyController.updateTest
);
router.delete(
    '/tests/:id',
    authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
    psychologyController.deleteTest
);

// Records
router.get('/records', psychologyController.getRecords);
router.get('/records/:id', psychologyController.getRecordById);
router.post(
    '/records',
    authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER), // Teachers (Counselors) can add records
    validate(createStudentPsychologyRecordSchema),
    psychologyController.createRecord
);
router.patch(
    '/records/:id',
    authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
    validate(updateStudentPsychologyRecordSchema),
    psychologyController.updateRecord
);
router.delete(
    '/records/:id',
    authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
    psychologyController.deleteRecord
);

export default router;
