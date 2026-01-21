import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { announcementService } from './service';
import { authenticate } from '@/middleware/auth';
import { NotificationType } from '@prisma/client';

const router = Router();

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
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { unitId, type, priority, published, page, limit } = req.query;

    const result = await announcementService.findAll({
      unitId: (unitId as string) || req.user?.unitId || undefined,
      type: type as NotificationType,
      priority: priority ? parseInt(priority as string) : undefined,
      published: published === 'true',
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

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
router.get('/stats', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const unitId = (req.query.unitId as string) || req.user?.unitId || undefined;
    const stats = await announcementService.getStats(unitId);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

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
router.get('/recent', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const unitId = (req.query.unitId as string) || req.user?.unitId || undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const announcements = await announcementService.getRecent(unitId, limit);
    res.json({ success: true, data: announcements });
  } catch (error) {
    next(error);
  }
});

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
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const announcement = await announcementService.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, error: { message: 'Announcement not found' } });
    }
    res.json({ success: true, data: announcement });
  } catch (error) {
    next(error);
  }
});

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
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const announcement = await announcementService.create({
      ...req.body,
      unitId: req.body.unitId || req.user?.unitId || undefined,
      createdById: (req.user as any).id || (req.user as any).userId,
    });
    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    next(error);
  }
});

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
router.patch('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const announcement = await announcementService.update(req.params.id, req.body);
    res.json({ success: true, data: announcement });
  } catch (error) {
    next(error);
  }
});

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
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await announcementService.delete(req.params.id);
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
