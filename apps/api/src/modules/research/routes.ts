import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/error';
import { asyncHandler } from '../../middleware/error';
import { ApiResponse } from '../../utils/response';
import { researchService } from './service';
import {
  CreateResearchThemeSchema,
  CreateResearchSubmissionSchema,
  AddReferenceSchema,
  ReviewSubmissionSchema,
} from './schema';
import { RoleCode } from '@prisma/client';

const router = Router();

// Themes
router.post(
  '/themes',
  authenticate,
  authorize(RoleCode.SUPER_ADMIN, RoleCode.SMAQ_GURU),
  validate(CreateResearchThemeSchema),
  asyncHandler(async (req, res) => {
    const data = await researchService.createTheme(req.body);
    res.json(ApiResponse.success(data));
  })
);

router.get(
  '/themes',
  authenticate,
  asyncHandler(async (req, res) => {
    const { unitId, academicYearId } = req.query as any;
    const data = await researchService.getThemes(unitId, academicYearId);
    res.json(ApiResponse.success(data));
  })
);

router.get(
  '/themes/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const data = await researchService.getThemeById(req.params.id);
    res.json(ApiResponse.success(data));
  })
);

// Submissions
router.post(
  '/submissions',
  authenticate,
  validate(CreateResearchSubmissionSchema),
  asyncHandler(async (req, res) => {
    const studentId = (req.user as any)?.studentId;
    if (!studentId) throw new Error('User is not a student');
    const data = await researchService.createSubmission(studentId, req.body);
    res.json(ApiResponse.success(data));
  })
);

router.get(
  '/submissions',
  authenticate,
  asyncHandler(async (req, res) => {
    const studentId = (req.user as any)?.studentId;
    if (!studentId) throw new Error('User is not a student');
    const data = await researchService.getSubmissionsByStudent(studentId);
    res.json(ApiResponse.success(data));
  })
);

router.get(
  '/submissions/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const data = await researchService.getSubmissionById(req.params.id);
    res.json(ApiResponse.success(data));
  })
);

router.patch(
  '/submissions/:id/review',
  authenticate,
  authorize(RoleCode.SMAQ_GURU, RoleCode.SUPER_ADMIN),
  validate(ReviewSubmissionSchema),
  asyncHandler(async (req, res) => {
    const data = await researchService.reviewSubmission(req.params.id, (req.user as any).id, req.body);
    res.json(ApiResponse.success(data));
  })
);

// References
router.post(
  '/references',
  authenticate,
  validate(AddReferenceSchema),
  asyncHandler(async (req, res) => {
    const data = await researchService.addReference(req.body);
    res.json(ApiResponse.success(data));
  })
);

export { router as researchRoutes };
