import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import * as controller from './controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Announcements
 *   description: Pengumuman management
 */

/**
 * @swagger
 * /api/announcements:
 *   get:
 *     tags: [Announcements]
 *     summary: Get all announcements
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: published
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of announcements
 */
router.get('/', controller.list);

/**
 * @swagger
 * /api/announcements/stats:
 *   get:
 *     tags: [Announcements]
 *     summary: Get announcement statistics
 *     responses:
 *       200:
 *         description: Announcement statistics
 */
router.get('/stats', controller.getStats);

/**
 * @swagger
 * /api/announcements/recent:
 *   get:
 *     tags: [Announcements]
 *     summary: Get recent announcements
 *     responses:
 *       200:
 *         description: Recent announcements
 */
router.get('/recent', controller.getRecent);

/**
 * @swagger
 * /api/announcements/{id}:
 *   get:
 *     tags: [Announcements]
 *     summary: Get announcement by ID
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
router.get('/:id', controller.getById);

/**
 * @swagger
 * /api/announcements:
 *   post:
 *     tags: [Announcements]
 *     summary: Create new announcement
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
 *               unitId:
 *                 type: string
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *               priority:
 *                 type: number
 *               publishedAt:
 *                 type: string
 *               expiresAt:
 *                 type: string
 *               targetRoles:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Announcement created
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/announcements/{id}:
 *   patch:
 *     tags: [Announcements]
 *     summary: Update announcement
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Announcement updated
 */
router.patch('/:id', controller.update);

/**
 * @swagger
 * /api/announcements/{id}:
 *   delete:
 *     tags: [Announcements]
 *     summary: Delete announcement
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Announcement deleted
 */
router.delete('/:id', controller.remove);

export default router;
