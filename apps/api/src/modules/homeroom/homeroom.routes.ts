import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { homeroomController } from './homeroom.controller';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ======================
// MY CLASSES ROUTES
// ======================

// GET /homeroom/my-classes - Get classes where user is homeroom teacher
router.get(
  '/my-classes',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  homeroomController.getMyClasses.bind(homeroomController)
);

// GET /homeroom/performance-overview - Cross-class wali kelas performance
// (teacher evaluation data — admins only)
router.get(
  '/performance-overview',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  homeroomController.getPerformanceOverview.bind(homeroomController)
);

// ======================
// CLASS ROUTES
// ======================

// GET /homeroom/:classId/dashboard - Get class dashboard (Simplified route for frontend)
router.get(
  '/:classId/dashboard',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  homeroomController.getClassDashboard.bind(homeroomController)
);

// GET /homeroom/class/:classId/dashboard - Get class dashboard (Legacy/Alternative)
router.get(
  '/class/:classId/dashboard',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  homeroomController.getClassDashboard.bind(homeroomController)
);

// GET /homeroom/class/:classId/students - Get students in class
router.get(
  '/class/:classId/students',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  homeroomController.getHomeroomStudents.bind(homeroomController)
);

// GET /homeroom/class/:classId/attendance - Get attendance summary
router.get(
  '/class/:classId/attendance',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  homeroomController.getAttendanceSummary.bind(homeroomController)
);

// GET /homeroom/class/:classId/academic - Get academic monitoring
router.get(
  '/class/:classId/academic',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  homeroomController.getAcademicMonitoring.bind(homeroomController)
);

// ======================
// STUDENT ROUTES
// ======================

// GET /homeroom/student/:studentId - Get student detail
router.get(
  '/student/:studentId',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  homeroomController.getStudentDetail.bind(homeroomController)
);

// GET /homeroom/student/:studentId/notes - Get student notes
router.get(
  '/student/:studentId/notes',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  homeroomController.getStudentNotes.bind(homeroomController)
);

// ======================
// NOTES ROUTES
// ======================

// POST /homeroom/notes - Create student note
router.post(
  '/notes',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  homeroomController.createStudentNote.bind(homeroomController)
);

// PUT /homeroom/notes/:noteId - Update student note
router.put(
  '/notes/:noteId',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  homeroomController.updateStudentNote.bind(homeroomController)
);

// DELETE /homeroom/notes/:noteId - Delete student note
router.delete(
  '/notes/:noteId',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  homeroomController.deleteStudentNote.bind(homeroomController)
);

// ======================
// BEHAVIOR ROUTES
// ======================

// GET /homeroom/behavior - Get behavior records
router.get(
  '/behavior',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  homeroomController.getBehaviorRecords.bind(homeroomController)
);

// POST /homeroom/behavior - Record behavior
router.post(
  '/behavior',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  homeroomController.recordBehavior.bind(homeroomController)
);

export default router;
