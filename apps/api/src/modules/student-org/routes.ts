import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/error';
import { asyncHandler } from '../../middleware/error';
import { ApiResponse } from '../../utils/response';
import { prisma } from '../../lib/prisma';
import { Errors } from '../../middleware/error';
import { studentOrgService } from './service';
import {
  CreateStudentOrgSchema,
  CreatePositionSchema,
  AddMemberSchema,
  CreateLogbookSchema,
} from './schema';
import { RoleCode } from '@prisma/client';

const router = Router();

// Orgs
router.post(
  '/',
  authenticate,
  authorize(RoleCode.SUPER_ADMIN, RoleCode.YAYASAN_ADMIN),
  validate(CreateStudentOrgSchema),
  asyncHandler(async (req, res) => {
    const data = await studentOrgService.createOrg(req.body);
    res.json(ApiResponse.success(data));
  })
);

router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { unitId, academicYearId } = req.query as any;
    const data = await studentOrgService.getOrgs(unitId, academicYearId);
    res.json(ApiResponse.success(data));
  })
);

// Positions
router.post(
  '/positions',
  authenticate,
  authorize(RoleCode.SUPER_ADMIN),
  validate(CreatePositionSchema),
  asyncHandler(async (req, res) => {
    const data = await studentOrgService.createPosition(req.body);
    res.json(ApiResponse.success(data));
  })
);

// Members
router.post(
  '/members',
  authenticate,
  authorize(RoleCode.SUPER_ADMIN),
  validate(AddMemberSchema),
  asyncHandler(async (req, res) => {
    const data = await studentOrgService.addMember(req.body);
    res.json(ApiResponse.success(data));
  })
);

router.get(
  '/members/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const data = await studentOrgService.getMemberById(req.params.id);
    res.json(ApiResponse.success(data));
  })
);

// Logbooks
router.post(
  '/logbooks',
  authenticate,
  validate(CreateLogbookSchema),
  asyncHandler(async (req, res) => {
    // Ownership guard: a student may only write logbook entries for their
    // own membership. Admins/teachers (any non-student role) may backfill.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = req.user as any;
    if (user.role === 'STUDENT') {
      const member = await prisma.studentOrgMember.findUnique({
        where: { id: req.body.memberId },
        select: { student: { select: { userId: true } } },
      });
      if (!member || member.student.userId !== user.sub) {
        throw Errors.forbidden('Logbook hanya bisa diisi untuk keanggotaan sendiri');
      }
    }
    const data = await studentOrgService.createLogbook(req.body);
    res.json(ApiResponse.success(data));
  })
);

export { router as studentOrgRoutes };
