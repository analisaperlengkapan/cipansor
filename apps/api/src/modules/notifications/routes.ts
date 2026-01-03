import { Router } from "express";
import * as controller from "./controller";
import { authenticate, authorize } from "../../middleware/auth";
import { UserRole } from "@prisma/client";

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== NOTIFICATIONS ====================

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get my notifications (Inbox)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get("/", controller.getMyNotifications);

/**
 * @swagger
 * /api/notifications/admin:
 *   get:
 *     summary: Get all notifications (Admin View)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
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
 *         description: List of all notifications
 */
// Protected Admin Routes
router.get("/admin", authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN), controller.getAllNotifications);

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Create notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - title
 *               - message
 *             properties:
 *               userId:
 *                 type: string
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *               link:
 *                 type: string
 *     responses:
 *       201:
 *         description: Notification created
 */
// Creating notifications usually requires admin/staff privileges
router.post("/", authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER, UserRole.STAFF), controller.createNotification);

/**
 * @swagger
 * /api/notifications/bulk:
 *   post:
 *     summary: Send bulk notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *               - title
 *               - message
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Notifications sent
 */
router.post("/bulk", authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER, UserRole.STAFF), controller.createBulkNotifications);

router.get("/stats", authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN), controller.getStats);

// Templates (Admin Only)
router.get("/templates", authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER), controller.getTemplates);
router.get("/templates/:id", authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER), controller.getTemplateById);
router.post("/templates", authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN), controller.createTemplate);
router.put("/templates/:id", authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN), controller.updateTemplate);
router.delete("/templates/:id", authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN), controller.deleteTemplate);

router.post("/:id/send", authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN), controller.sendNotification);

router.post("/read-all", controller.markAllAsRead);

// ==================== ANNOUNCEMENTS ====================

router.get("/announcements", controller.getAnnouncements);
router.get("/announcements/:id", controller.getAnnouncementById);
router.post("/announcements", authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER), controller.createAnnouncement);
router.put("/announcements/:id", authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN), controller.updateAnnouncement);
router.delete("/announcements/:id", authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN), controller.deleteAnnouncement);

// ==================== WHATSAPP ====================

router.post("/whatsapp/send", authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN), controller.sendWhatsApp);
router.post("/whatsapp/broadcast", authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN), controller.broadcastWhatsApp);
router.get("/whatsapp/status", authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN), controller.getWhatsAppStatus);

// ==================== SCHEDULER ====================

router.post("/scheduler/trigger", authorize(UserRole.SUPER_ADMIN), controller.triggerScheduledTask);

// ==================== GENERIC ID ROUTES (MUST BE LAST) ====================

router.post("/:id/read", controller.markAsRead);
// Removed RBAC from delete to allow users to delete their own notifications.
// Controller/Service handles ownership check via { id, userId }.
router.delete("/:id", controller.deleteNotification);
router.get("/:id", controller.getNotificationById);

export default router;
