import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { mealsController } from './meals.controller';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ======================
// MEAL SCHEDULE ROUTES
// ======================

// GET /meals/schedules - List all meal schedules
router.get(
  '/schedules',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.UNIT_ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT
  ),
  mealsController.listSchedules.bind(mealsController)
);

// GET /meals/schedules/:id - Get meal schedule by ID
router.get(
  '/schedules/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  mealsController.getScheduleById.bind(mealsController)
);

// POST /meals/schedules - Create meal schedule
router.post(
  '/schedules',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  mealsController.createSchedule.bind(mealsController)
);

// PUT /meals/schedules/:id - Update meal schedule
router.put(
  '/schedules/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  mealsController.updateSchedule.bind(mealsController)
);

// DELETE /meals/schedules/:id - Delete meal schedule
router.delete(
  '/schedules/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  mealsController.deleteSchedule.bind(mealsController)
);

// ======================
// MENU ROUTES
// ======================

// GET /meals/menus - List all menus
router.get(
  '/menus',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.UNIT_ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT
  ),
  mealsController.listMenus.bind(mealsController)
);

// GET /meals/menus/today/:unitId - Get today's menu for a unit
router.get(
  '/menus/today/:unitId',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.UNIT_ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT
  ),
  mealsController.getTodayMenu.bind(mealsController)
);

// GET /meals/menus/:id - Get menu by ID
router.get(
  '/menus/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  mealsController.getMenuById.bind(mealsController)
);

// POST /meals/menus - Create menu
router.post(
  '/menus',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  mealsController.createMenu.bind(mealsController)
);

// POST /meals/menus/bulk - Bulk create menus
router.post(
  '/menus/bulk',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  mealsController.bulkCreateMenus.bind(mealsController)
);

// PUT /meals/menus/:id - Update menu
router.put(
  '/menus/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  mealsController.updateMenu.bind(mealsController)
);

// DELETE /meals/menus/:id - Delete menu
router.delete(
  '/menus/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  mealsController.deleteMenu.bind(mealsController)
);

// ======================
// ATTENDANCE ROUTES
// ======================

// GET /meals/attendance - List all attendance records
router.get(
  '/attendance',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  mealsController.listAttendances.bind(mealsController)
);

// POST /meals/attendance - Record single attendance
router.post(
  '/attendance',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  mealsController.recordAttendance.bind(mealsController)
);

// POST /meals/attendance/bulk - Bulk record attendance
router.post(
  '/attendance/bulk',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  mealsController.bulkRecordAttendance.bind(mealsController)
);

// PUT /meals/attendance/:id - Update attendance record
router.put(
  '/attendance/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  mealsController.updateAttendance.bind(mealsController)
);

// ======================
// STUDENT & STATISTICS ROUTES
// ======================

// GET /meals/student/:studentId - Get student meal history
router.get(
  '/student/:studentId',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.UNIT_ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT
  ),
  mealsController.getStudentHistory.bind(mealsController)
);

// GET /meals/statistics - Get meal statistics
router.get(
  '/statistics',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  mealsController.getStatistics.bind(mealsController)
);

export default router;
