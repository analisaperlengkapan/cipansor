import { Router } from 'express';
import { higherEducationController } from './higher-education.controller';
import { asyncHandler } from '../../middleware/async-handler';

const router = Router();

// Faculties
router.post('/units/:unitId/faculties', asyncHandler(higherEducationController.createFaculty));
router.get('/units/:unitId/faculties', asyncHandler(higherEducationController.getFaculties));

// Study Programs
router.post('/programs', asyncHandler(higherEducationController.createStudyProgram));

// Courses
router.post('/courses', asyncHandler(higherEducationController.createCourse));

// Student Enrollment
router.post('/enroll', asyncHandler(higherEducationController.enrollStudent));

// Academic Records (KRS/Transcript)
router.post('/krs', asyncHandler(higherEducationController.createKRS));
router.post('/krs/add-course', asyncHandler(higherEducationController.addCourseToKRS));
router.get('/students/:studentHeId/transcript', asyncHandler(higherEducationController.getTranscript));

export default router;
