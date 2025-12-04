import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { kitabProgressController } from './kitab-progress.controller';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ======================
// KITAB MASTER DATA ROUTES
// ======================

// GET /kitab-progress/kitab - List all kitab
router.get(
  '/kitab',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  kitabProgressController.listKitab.bind(kitabProgressController)
);

// GET /kitab-progress/kitab/:id - Get kitab by ID
router.get(
  '/kitab/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  kitabProgressController.getKitabById.bind(kitabProgressController)
);

// POST /kitab-progress/kitab - Create kitab
router.post(
  '/kitab',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  kitabProgressController.createKitab.bind(kitabProgressController)
);

// PUT /kitab-progress/kitab/:id - Update kitab
router.put(
  '/kitab/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  kitabProgressController.updateKitab.bind(kitabProgressController)
);

// DELETE /kitab-progress/kitab/:id - Delete kitab
router.delete(
  '/kitab/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  kitabProgressController.deleteKitab.bind(kitabProgressController)
);

// ======================
// ASSIGNMENT ROUTES
// ======================

// GET /kitab-progress/assignments - List all assignments
router.get(
  '/assignments',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  kitabProgressController.listAssignments.bind(kitabProgressController)
);

// POST /kitab-progress/assignments - Create assignment
router.post(
  '/assignments',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  kitabProgressController.createAssignment.bind(kitabProgressController)
);

// PUT /kitab-progress/assignments/:id - Update assignment
router.put(
  '/assignments/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  kitabProgressController.updateAssignment.bind(kitabProgressController)
);

// DELETE /kitab-progress/assignments/:id - Delete assignment
router.delete(
  '/assignments/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  kitabProgressController.deleteAssignment.bind(kitabProgressController)
);

// ======================
// PROGRESS ROUTES
// ======================

// GET /kitab-progress/progress - List student progress
router.get(
  '/progress',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT),
  kitabProgressController.listProgress.bind(kitabProgressController)
);

// POST /kitab-progress/progress - Update student progress
router.post(
  '/progress',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  kitabProgressController.updateProgress.bind(kitabProgressController)
);

// ======================
// RECORDS (SETORAN) ROUTES
// ======================

// GET /kitab-progress/records - List progress records
router.get(
  '/records',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT),
  kitabProgressController.listRecords.bind(kitabProgressController)
);

// POST /kitab-progress/records - Create progress record
router.post(
  '/records',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  kitabProgressController.createRecord.bind(kitabProgressController)
);

// POST /kitab-progress/records/bulk - Bulk create progress records
router.post(
  '/records/bulk',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  kitabProgressController.bulkCreateRecords.bind(kitabProgressController)
);

// ======================
// STATISTICS & REPORTS
// ======================

// GET /kitab-progress/statistics - Get statistics
router.get(
  '/statistics',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  kitabProgressController.getStatistics.bind(kitabProgressController)
);

// GET /kitab-progress/student/:studentId/report - Get student report
router.get(
  '/student/:studentId/report',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT),
  kitabProgressController.getStudentReport.bind(kitabProgressController)
);

export default router;
