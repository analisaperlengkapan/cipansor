import { Router } from "express";
import * as controller from "./controller";
import { authenticate } from "../../middleware/auth";

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== NOTIFICATIONS ====================

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get my notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INFO, ANNOUNCEMENT, REMINDER, ALERT, PAYMENT, ACADEMIC]
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
 *                 enum: [INFO, ANNOUNCEMENT, REMINDER, ALERT, PAYMENT, ACADEMIC]
 *               link:
 *                 type: string
 *     responses:
 *       201:
 *         description: Notification created
 */
router.post("/", controller.createNotification);

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
 *                 enum: [INFO, ANNOUNCEMENT, REMINDER, ALERT, PAYMENT, ACADEMIC]
 *     responses:
 *       201:
 *         description: Notifications sent
 */
router.post("/bulk", controller.createBulkNotifications);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   post:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.post("/:id/read", controller.markAsRead);

/**
 * @swagger
 * /api/notifications/read-all:
 *   post:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.post("/read-all", controller.markAllAsRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Notification deleted
 */
router.delete("/:id", controller.deleteNotification);

// ==================== ANNOUNCEMENTS ====================

/**
 * @swagger
 * /api/notifications/announcements:
 *   get:
 *     summary: List announcements
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: integer
 *           description: 0=normal, 1=important, 2=urgent
 *       - in: query
 *         name: active
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
 *         description: List of announcements
 */
router.get("/announcements", controller.getAnnouncements);

/**
 * @swagger
 * /api/notifications/announcements/{id}:
 *   get:
 *     summary: Get announcement by ID
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Announcement details
 */
router.get("/announcements/:id", controller.getAnnouncementById);

/**
 * @swagger
 * /api/notifications/announcements:
 *   post:
 *     summary: Create announcement
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
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               unitId:
 *                 type: string
 *               targetRoles:
 *                 type: array
 *                 items:
 *                   type: string
 *               publishedAt:
 *                 type: string
 *                 format: date-time
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *               priority:
 *                 type: integer
 *                 description: 0=normal, 1=important, 2=urgent
 *     responses:
 *       201:
 *         description: Announcement created
 */
router.post("/announcements", controller.createAnnouncement);

/**
 * @swagger
 * /api/notifications/announcements/{id}:
 *   put:
 *     summary: Update announcement
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Announcement updated
 */
router.put("/announcements/:id", controller.updateAnnouncement);

/**
 * @swagger
 * /api/notifications/announcements/{id}:
 *   delete:
 *     summary: Delete announcement
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Announcement deleted
 */
router.delete("/announcements/:id", controller.deleteAnnouncement);

// ==================== WHATSAPP ====================

/**
 * @swagger
 * /api/notifications/whatsapp/send:
 *   post:
 *     summary: Send WhatsApp message
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
 *               - phone
 *               - message
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Phone number with country code
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent
 */
router.post("/whatsapp/send", controller.sendWhatsApp);

/**
 * @swagger
 * /api/notifications/whatsapp/broadcast:
 *   post:
 *     summary: Broadcast announcement via WhatsApp to all parents
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
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, NORMAL, HIGH]
 *               unitId:
 *                 type: string
 *                 description: Filter by unit ID
 *     responses:
 *       200:
 *         description: Broadcast sent
 */
router.post("/whatsapp/broadcast", controller.broadcastWhatsApp);

/**
 * @swagger
 * /api/notifications/whatsapp/status:
 *   get:
 *     summary: Get WhatsApp provider status
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Provider status
 */
router.get("/whatsapp/status", controller.getWhatsAppStatus);

// ==================== SCHEDULER ====================

/**
 * @swagger
 * /api/notifications/scheduler/trigger:
 *   post:
 *     summary: Manually trigger scheduled notification task
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
 *               - task
 *             properties:
 *               task:
 *                 type: string
 *                 enum:
 *                   - payment_reminder
 *                   - attendance_alert
 *                   - daily_summary
 *                   - tahfidz_report
 *                   - event_reminder
 *                   - overdue_payment
 *     responses:
 *       200:
 *         description: Task executed
 */
router.post("/scheduler/trigger", controller.triggerScheduledTask);

export default router;
