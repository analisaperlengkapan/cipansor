import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { dutyRosterController } from './duty-roster.controller';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ======================
// DUTY TYPE ROUTES
// ======================

// GET /duty-roster/types - List all duty types
router.get(
  '/types',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  dutyRosterController.listTypes.bind(dutyRosterController)
);

// GET /duty-roster/types/:id - Get duty type by ID
router.get(
  '/types/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  dutyRosterController.getTypeById.bind(dutyRosterController)
);

// POST /duty-roster/types - Create duty type
router.post(
  '/types',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  dutyRosterController.createType.bind(dutyRosterController)
);

// PUT /duty-roster/types/:id - Update duty type
router.put(
  '/types/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  dutyRosterController.updateType.bind(dutyRosterController)
);

// DELETE /duty-roster/types/:id - Delete duty type
router.delete(
  '/types/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  dutyRosterController.deleteType.bind(dutyRosterController)
);

// ======================
// ROSTER ROUTES
// ======================

// GET /duty-roster - List all rosters
router.get(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  dutyRosterController.listRosters.bind(dutyRosterController)
);

// GET /duty-roster/today/:unitId - Get today's duties for a unit
router.get(
  '/today/:unitId',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER, UserRole.STUDENT),
  dutyRosterController.getTodayDuties.bind(dutyRosterController)
);

// GET /duty-roster/statistics/:unitId - Get duty statistics
router.get(
  '/statistics/:unitId',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  dutyRosterController.getStatistics.bind(dutyRosterController)
);

// GET /duty-roster/student/:studentId - Get student duty history
router.get(
  '/student/:studentId',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.UNIT_ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT
  ),
  dutyRosterController.getStudentHistory.bind(dutyRosterController)
);

// GET /duty-roster/:id - Get roster by ID
router.get(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  dutyRosterController.getRosterById.bind(dutyRosterController)
);

// POST /duty-roster - Create single roster
router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  dutyRosterController.createRoster.bind(dutyRosterController)
);

// POST /duty-roster/bulk - Bulk create rosters
router.post(
  '/bulk',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  dutyRosterController.bulkCreateRosters.bind(dutyRosterController)
);

// PUT /duty-roster/:id - Update roster
router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  dutyRosterController.updateRoster.bind(dutyRosterController)
);

// DELETE /duty-roster/:id - Delete roster
router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  dutyRosterController.deleteRoster.bind(dutyRosterController)
);

// ======================
// ROSTER ACTION ROUTES
// ======================

// POST /duty-roster/:id/complete - Mark duty as completed
router.post(
  '/:id/complete',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  dutyRosterController.completeDuty.bind(dutyRosterController)
);

// POST /duty-roster/:id/absent - Mark student as absent
router.post(
  '/:id/absent',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  dutyRosterController.markAbsent.bind(dutyRosterController)
);

// POST /duty-roster/:id/substitute - Assign substitute
router.post(
  '/:id/substitute',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  dutyRosterController.assignSubstitute.bind(dutyRosterController)
);

// POST /duty-roster/:id/verify - Verify completed duty
router.post(
  '/:id/verify',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  dutyRosterController.verifyDuty.bind(dutyRosterController)
);

export default router;
