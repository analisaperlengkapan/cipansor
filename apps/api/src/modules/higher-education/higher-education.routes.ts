import { Router } from 'express';
import { higherEducationController } from './higher-education.controller';
import { asyncHandler, validate } from '../../middleware/error';
import { authenticate, authorize } from '../../middleware/auth';
import { UserRole, RoleCode } from '@prisma/client';
import {
  CreateFacultySchema,
  CreateStudyProgramSchema,
  CreateCourseSchema,
  EnrollStudentSchema,
  CreateKRSSchema,
  AddCourseToKRSSchema,
} from './higher-education.schema';

const router = Router();

// Academic administration is staff work; reads require a session too.
// (The original PR #312 had no auth on any route and never mounted the
// router at all.)
router.use(authenticate);

const academicAdmin = authorize(
  UserRole.SUPER_ADMIN,
  UserRole.UNIT_ADMIN,
  RoleCode.PT_REKTOR,
  RoleCode.PT_DEKAN,
  RoleCode.PT_KAPRODI,
  RoleCode.PT_STAF_AKADEMIK
);

// Faculties
router.post(
  '/units/:unitId/faculties',
  academicAdmin,
  validate(CreateFacultySchema),
  asyncHandler(higherEducationController.createFaculty)
);
router.get('/units/:unitId/faculties', asyncHandler(higherEducationController.getFaculties));

// Study Programs
router.post(
  '/programs',
  academicAdmin,
  validate(CreateStudyProgramSchema),
  asyncHandler(higherEducationController.createStudyProgram)
);

// Courses (mata kuliah)
router.post(
  '/courses',
  academicAdmin,
  validate(CreateCourseSchema),
  asyncHandler(higherEducationController.createCourse)
);

// Student Enrollment
router.post(
  '/enroll',
  academicAdmin,
  validate(EnrollStudentSchema),
  asyncHandler(higherEducationController.enrollStudent)
);

// Academic Records (KRS/Transcript)
router.post(
  '/krs',
  validate(CreateKRSSchema),
  asyncHandler(higherEducationController.createKrs)
);
router.post(
  '/krs/add-course',
  validate(AddCourseToKRSSchema),
  asyncHandler(higherEducationController.addCourseToKrs)
);
router.get(
  '/students/:studentHeId/transcript',
  asyncHandler(higherEducationController.getTranscript)
);

export default router;
