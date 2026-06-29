import { Router } from 'express';
import { UserRole, RoleCode } from '@prisma/client';
import * as controller from './controller';
import * as forecastController from './forecast.controller';
import * as exportController from './export.controller';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

const forecastViewer = authorize(
  UserRole.SUPER_ADMIN,
  RoleCode.YAYASAN_ADMIN,
  UserRole.UNIT_ADMIN
);

router.get('/dashboard', controller.getDashboardStats);

router.get('/parent-engagement', controller.getParentEngagementStats);
router.get('/homeroom-performance', controller.getHomeroomPerformance);
router.get('/accreditation-readiness', controller.getAccreditationReadiness);

router.get('/students', controller.getStudentStats);
router.get('/tahfidz', controller.getTahfidzStats);
router.get('/finance', controller.getFinanceStats);
router.get('/attendance', controller.getAttendanceStats);
router.get('/academic', controller.getAcademicStats);
router.get('/library', controller.getLibraryStats);
router.get('/psb', controller.getPSBStats);
router.get('/grc', controller.getGRCStats);

router.get('/forecast', forecastViewer, forecastController.getAllForecasts);
router.get('/forecast/enrollment', forecastViewer, forecastController.getEnrollmentForecast);
router.get('/forecast/payment', forecastViewer, forecastController.getPaymentForecast);
router.get('/forecast/outstanding', forecastViewer, forecastController.getOutstandingPrediction);
router.get('/forecast/tahfidz', forecastViewer, forecastController.getTahfidzForecast);
router.get('/forecast/cash-flow', forecastViewer, forecastController.getCashFlowForecast);

router.get('/export/all', exportController.exportAll);
router.get('/export/students', exportController.exportStudents);
router.get('/export/attendance', exportController.exportAttendance);
router.get('/export/finance', exportController.exportFinance);
router.get('/export/tahfidz', exportController.exportTahfidz);

import * as benchmarkController from './benchmark.controller';
router.get('/benchmark', benchmarkController.getBenchmarkSummary);
router.get('/benchmark/compare', benchmarkController.compareUnits);
router.get('/benchmark/rankings', benchmarkController.getUnitRankings);
router.get('/benchmark/yoy/:unitId', benchmarkController.getYearOverYear);

export default router;
