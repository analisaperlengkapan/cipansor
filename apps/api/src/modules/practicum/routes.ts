import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/error';
import { asyncHandler } from '../../middleware/error';
import { ApiResponse } from '../../utils/response';
import { practicumService } from './service';
import {
  CreateLessonPlanSchema,
  UpdateLessonPlanSchema,
  ReviewLessonPlanSchema,
  CreateScheduleSchema,
  CreateEvaluationSchema,
} from './schema';
import { RoleCode } from '@prisma/client';

const router = Router();

// Lesson Plans
router.post(
  '/lesson-plans',
  authenticate,
  validate(CreateLessonPlanSchema),
  asyncHandler(async (req, res) => {
    const studentId = (req.user as any)?.studentId;
    if (!studentId) throw new Error('User is not a student');
    const data = await practicumService.createLessonPlan(studentId, req.body);
    res.json(ApiResponse.success(data));
  })
);

router.get(
  '/lesson-plans',
  authenticate,
  asyncHandler(async (req, res) => {
    const { studentId, academicYearId } = req.query as any;
    const data = await practicumService.getLessonPlans(studentId, academicYearId);
    res.json(ApiResponse.success(data));
  })
);

router.get(
  '/lesson-plans/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const data = await practicumService.getLessonPlanById(req.params.id);
    res.json(ApiResponse.success(data));
  })
);

router.patch(
  '/lesson-plans/:id',
  authenticate,
  validate(UpdateLessonPlanSchema),
  asyncHandler(async (req, res) => {
    const data = await practicumService.updateLessonPlan(req.params.id, req.body);
    res.json(ApiResponse.success(data));
  })
);

router.post(
  '/lesson-plans/:id/review',
  authenticate,
  authorize(RoleCode.SUPER_ADMIN, RoleCode.SMAQ_GURU, RoleCode.SMPIT_GURU),
  validate(ReviewLessonPlanSchema),
  asyncHandler(async (req, res) => {
    const data = await practicumService.reviewLessonPlan(req.params.id, (req.user as any).id, req.body);
    res.json(ApiResponse.success(data));
  })
);

// Schedules
router.post(
  '/schedules',
  authenticate,
  authorize(RoleCode.SUPER_ADMIN, RoleCode.SMAQ_GURU, RoleCode.SMPIT_GURU, RoleCode.SMAQ_ADMIN),
  validate(CreateScheduleSchema),
  asyncHandler(async (req, res) => {
    const data = await practicumService.createSchedule(req.body);
    res.json(ApiResponse.success(data));
  })
);

router.get(
  '/schedules',
  authenticate,
  asyncHandler(async (req, res) => {
    const { targetClassId, date } = req.query as any;
    const data = await practicumService.getSchedules(targetClassId, date);
    res.json(ApiResponse.success(data));
  })
);

// Evaluations
router.post(
  '/evaluations',
  authenticate,
  validate(CreateEvaluationSchema),
  asyncHandler(async (req, res) => {
    const data = await practicumService.createEvaluation((req.user as any).id, req.body);
    res.json(ApiResponse.success(data));
  })
);

export { router as practicumRoutes };
