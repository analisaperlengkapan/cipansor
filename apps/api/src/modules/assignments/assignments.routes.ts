import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { validate } from '@/middleware/error';
import { UserRole } from '@prisma/client';
import { assignmentsController } from './assignments.controller';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  submitAssignmentSchema,
  gradeSubmissionSchema,
} from './assignments.schema';

const router = Router();

router.use(authenticate);

// Teacher/Admin routes
router.post(
  '/',
  authorize(UserRole.TEACHER, UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(createAssignmentSchema),
  assignmentsController.create
);
router.put(
  '/:id',
  authorize(UserRole.TEACHER, UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(updateAssignmentSchema),
  assignmentsController.update
);
router.delete(
  '/:id',
  authorize(UserRole.TEACHER, UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  assignmentsController.delete
);
router.get(
  '/:id/submissions',
  authorize(UserRole.TEACHER, UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  assignmentsController.getSubmissions
);
router.post(
  '/:id/submissions/:studentId/grade',
  authorize(UserRole.TEACHER, UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(gradeSubmissionSchema),
  assignmentsController.grade
);

// Student routes
router.post(
  '/:id/submit',
  authorize(UserRole.STUDENT),
  validate(submitAssignmentSchema),
  assignmentsController.submit
);

// Shared routes
router.get('/', assignmentsController.findAll);
router.get('/:id', assignmentsController.findOne);

export default router;
