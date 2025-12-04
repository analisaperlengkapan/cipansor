import { Router } from "express";
import * as controller from "./controller";
import { authenticate } from "@/middleware/auth";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get dashboard overview statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics including student count, revenue, attendance, etc.
 */
// Dashboard overview
router.get("/dashboard", controller.getDashboardStats);

/**
 * @swagger
 * /api/analytics/students:
 *   get:
 *     summary: Get student statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student statistics (enrollment, demographics, etc.)
 */
// Domain-specific statistics
router.get("/students", controller.getStudentStats);

/**
 * @swagger
 * /api/analytics/tahfidz:
 *   get:
 *     summary: Get tahfidz statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tahfidz statistics (total juz, progress, achievements)
 */
router.get("/tahfidz", controller.getTahfidzStats);

/**
 * @swagger
 * /api/analytics/finance:
 *   get:
 *     summary: Get finance statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Finance statistics (revenue, payments, outstanding)
 */
router.get("/finance", controller.getFinanceStats);

/**
 * @swagger
 * /api/analytics/attendance:
 *   get:
 *     summary: Get attendance statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Attendance statistics (rates, trends)
 */
router.get("/attendance", controller.getAttendanceStats);

/**
 * @swagger
 * /api/analytics/academic:
 *   get:
 *     summary: Get academic statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Academic statistics (grades, performance)
 */
router.get("/academic", controller.getAcademicStats);

/**
 * @swagger
 * /api/analytics/library:
 *   get:
 *     summary: Get library statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Library statistics (borrowings, popular books)
 */
router.get("/library", controller.getLibraryStats);

/**
 * @swagger
 * /api/analytics/psb:
 *   get:
 *     summary: Get PSB (admissions) statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: periodId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PSB statistics (applications, admissions rate)
 */
router.get("/psb", controller.getPSBStats);

export default router;
