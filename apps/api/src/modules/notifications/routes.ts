import { Router } from "express";
import * as controller from "./controller";
import { authenticate, authorize } from "../../middleware/auth";

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
router.get("/admin", authorize(['SUPER_ADMIN', 'UNIT_ADMIN', 'YAYASAN_ADMIN']), controller.getAllNotifications);

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
router.post("/", authorize(['SUPER_ADMIN', 'UNIT_ADMIN', 'YAYASAN_ADMIN', 'TEACHER', 'STAFF']), controller.createNotification);

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
router.post("/bulk", authorize(['SUPER_ADMIN', 'UNIT_ADMIN', 'YAYASAN_ADMIN', 'TEACHER', 'STAFF']), controller.createBulkNotifications);

router.get("/stats", authorize(['SUPER_ADMIN', 'UNIT_ADMIN', 'YAYASAN_ADMIN']), controller.getStats);

// Templates (Admin Only)
router.get("/templates", authorize(['SUPER_ADMIN', 'UNIT_ADMIN', 'YAYASAN_ADMIN', 'TEACHER']), controller.getTemplates);
router.post("/templates", authorize(['SUPER_ADMIN', 'UNIT_ADMIN', 'YAYASAN_ADMIN']), controller.createTemplate);
router.put("/templates/:id", authorize(['SUPER_ADMIN', 'UNIT_ADMIN', 'YAYASAN_ADMIN']), controller.updateTemplate);
router.delete("/templates/:id", authorize(['SUPER_ADMIN', 'UNIT_ADMIN', 'YAYASAN_ADMIN']), controller.deleteTemplate);

router.post("/:id/send", authorize(['SUPER_ADMIN', 'UNIT_ADMIN', 'YAYASAN_ADMIN']), controller.sendNotification);

router.post("/read-all", controller.markAllAsRead);

// ==================== ANNOUNCEMENTS ====================

router.get("/announcements", controller.getAnnouncements);
router.get("/announcements/:id", controller.getAnnouncementById);
router.post("/announcements", authorize(['SUPER_ADMIN', 'UNIT_ADMIN', 'YAYASAN_ADMIN', 'TEACHER']), controller.createAnnouncement);
router.put("/announcements/:id", authorize(['SUPER_ADMIN', 'UNIT_ADMIN', 'YAYASAN_ADMIN']), controller.updateAnnouncement);
router.delete("/announcements/:id", authorize(['SUPER_ADMIN', 'UNIT_ADMIN', 'YAYASAN_ADMIN']), controller.deleteAnnouncement);

// ==================== WHATSAPP ====================

router.post("/whatsapp/send", authorize(['SUPER_ADMIN', 'UNIT_ADMIN', 'YAYASAN_ADMIN']), controller.sendWhatsApp);
router.post("/whatsapp/broadcast", authorize(['SUPER_ADMIN', 'UNIT_ADMIN', 'YAYASAN_ADMIN']), controller.broadcastWhatsApp);
router.get("/whatsapp/status", authorize(['SUPER_ADMIN', 'UNIT_ADMIN', 'YAYASAN_ADMIN']), controller.getWhatsAppStatus);

// ==================== SCHEDULER ====================

router.post("/scheduler/trigger", authorize(['SUPER_ADMIN']), controller.triggerScheduledTask);

// ==================== GENERIC ID ROUTES (MUST BE LAST) ====================

router.post("/:id/read", controller.markAsRead);
// Removed RBAC from delete to allow users to delete their own notifications.
// Controller/Service handles ownership check via { id, userId }.
router.delete("/:id", controller.deleteNotification);
router.get("/:id", controller.getNotificationById);

export default router;
