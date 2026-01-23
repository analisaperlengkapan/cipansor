import { Router } from 'express';
import { authenticate, authorize, isTeacherOrAbove } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { ApiResponse } from '@/utils/response';
import * as service from './ibadah.service';
import {
  listTargetsQuerySchema,
  createTargetSchema,
  updateTargetSchema,
  listRecordsQuerySchema,
  createRecordSchema,
  updateRecordSchema,
  bulkCreateRecordsSchema,
  verifyRecordSchema,
  dailyCheckInSchema,
  leaderboardQuerySchema,
  studentIbadahStatsQuerySchema,
  unitIbadahStatsQuerySchema,
  classIbadahStatsQuerySchema,
  listIslamicEventsQuerySchema,
  createIslamicEventSchema,
  updateIslamicEventSchema,
} from './ibadah.schema';

const router = Router();

// ======================
// TARGET ROUTES
// ======================

/**
 * @swagger
 * /api/ibadah/targets:
 *   get:
 *     summary: List ibadah targets
 *     tags: [Ibadah]
 *     security:
 *       - bearerAuth: []
 */
router.get('/targets', authenticate, async (req, res, next) => {
  try {
    const query = listTargetsQuerySchema.parse(req.query);
    const result = await service.listTargets(query);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/ibadah/targets/{id}:
 *   get:
 *     summary: Get ibadah target by ID
 *     tags: [Ibadah]
 *     security:
 *       - bearerAuth: []
 */
router.get('/targets/:id', authenticate, async (req, res, next) => {
  try {
    const target = await service.getTargetById(req.params.id);
    if (!target) {
      return res.status(404).json(ApiResponse.error('Target not found'));
    }
    res.json(ApiResponse.success(target));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/ibadah/targets:
 *   post:
 *     summary: Create ibadah target
 *     tags: [Ibadah]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/targets',
  authenticate,
  isTeacherOrAbove,
  validate(createTargetSchema),
  async (req, res, next) => {
    try {
      const target = await service.createTarget(req.body);
      res.status(201).json(ApiResponse.success(target, 'Target created successfully'));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/ibadah/targets/{id}:
 *   put:
 *     summary: Update ibadah target
 *     tags: [Ibadah]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/targets/:id',
  authenticate,
  isTeacherOrAbove,
  validate(updateTargetSchema),
  async (req, res, next) => {
    try {
      const target = await service.updateTarget(req.params.id, req.body);
      res.json(ApiResponse.success(target, 'Target updated successfully'));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/ibadah/targets/{id}:
 *   delete:
 *     summary: Delete ibadah target
 *     tags: [Ibadah]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/targets/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'UNIT_ADMIN'),
  async (req, res, next) => {
    try {
      await service.deleteTarget(req.params.id);
      res.json(ApiResponse.success(null, 'Target deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/ibadah/targets/seed/{unitId}:
 *   post:
 *     summary: Seed default ibadah targets for a unit
 *     tags: [Ibadah]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/targets/seed/:unitId',
  authenticate,
  authorize('SUPER_ADMIN', 'UNIT_ADMIN'),
  async (req, res, next) => {
    try {
      const targets = await service.seedDefaultTargets(req.params.unitId);
      res.status(201).json(ApiResponse.success(targets, 'Default targets seeded successfully'));
    } catch (error) {
      next(error);
    }
  }
);

// ======================
// RECORD ROUTES
// ======================

/**
 * @swagger
 * /api/ibadah/records:
 *   get:
 *     summary: List ibadah records
 *     tags: [Ibadah]
 *     security:
 *       - bearerAuth: []
 */
router.get('/records', authenticate, async (req, res, next) => {
  try {
    const query = listRecordsQuerySchema.parse(req.query);
    const result = await service.listRecords(query);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/ibadah/records/{id}:
 *   get:
 *     summary: Get ibadah record by ID
 *     tags: [Ibadah]
 *     security:
 *       - bearerAuth: []
 */
router.get('/records/:id', authenticate, async (req, res, next) => {
  try {
    const record = await service.getRecordById(req.params.id);
    if (!record) {
      return res.status(404).json(ApiResponse.error('Record not found'));
    }
    res.json(ApiResponse.success(record));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/ibadah/records:
 *   post:
 *     summary: Create ibadah record
 *     tags: [Ibadah]
 *     security:
 *       - bearerAuth: []
 */
router.post('/records', authenticate, validate(createRecordSchema), async (req, res, next) => {
  try {
    const record = await service.createRecord(req.body);
    res.status(201).json(ApiResponse.success(record, 'Record created successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/ibadah/records/{id}:
 *   put:
 *     summary: Update ibadah record
 *     tags: [Ibadah]
 *     security:
 *       - bearerAuth: []
 */
router.put('/records/:id', authenticate, validate(updateRecordSchema), async (req, res, next) => {
  try {
    const record = await service.updateRecord(req.params.id, req.body);
    res.json(ApiResponse.success(record, 'Record updated successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/ibadah/records/{id}:
 *   delete:
 *     summary: Delete ibadah record
 *     tags: [Ibadah]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/records/:id', authenticate, isTeacherOrAbove, async (req, res, next) => {
  try {
    await service.deleteRecord(req.params.id);
    res.json(ApiResponse.success(null, 'Record deleted successfully'));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/ibadah/records/bulk:
 *   post:
 *     summary: Bulk create ibadah records for a student on a date
 *     tags: [Ibadah]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/records/bulk',
  authenticate,
  validate(bulkCreateRecordsSchema),
  async (req, res, next) => {
    try {
      const records = await service.bulkCreateRecords(req.body);
      res.status(201).json(ApiResponse.success(records, 'Records created successfully'));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/ibadah/records/verify:
 *   post:
 *     summary: Verify ibadah records
 *     tags: [Ibadah]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/records/verify',
  authenticate,
  isTeacherOrAbove,
  validate(verifyRecordSchema),
  async (req, res, next) => {
    try {
      const result = await service.verifyRecords(req.user!.sub, req.body);
      res.json(ApiResponse.success(result, 'Records verified successfully'));
    } catch (error) {
      next(error);
    }
  }
);

// ======================
// DAILY CHECK-IN
// ======================

/**
 * @swagger
 * /api/ibadah/check-in:
 *   post:
 *     summary: Daily ibadah check-in for a student
 *     tags: [Ibadah]
 *     security:
 *       - bearerAuth: []
 */
router.post('/check-in', authenticate, validate(dailyCheckInSchema), async (req, res, next) => {
  try {
    const result = await service.dailyCheckIn(req.body);
    res.json(ApiResponse.success(result, 'Check-in completed successfully'));
  } catch (error) {
    next(error);
  }
});

// ======================
// LEADERBOARD
// ======================

/**
 * @swagger
 * /api/ibadah/leaderboard:
 *   get:
 *     summary: Get ibadah leaderboard
 *     tags: [Ibadah]
 *     security:
 *       - bearerAuth: []
 */
router.get('/leaderboard', authenticate, async (req, res, next) => {
  try {
    const query = leaderboardQuerySchema.parse(req.query);
    const result = await service.getLeaderboard(query);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
});

// ======================
// STATISTICS
// ======================

/**
 * @swagger
 * /api/ibadah/stats/student:
 *   get:
 *     summary: Get student ibadah statistics
 *     tags: [Ibadah]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats/student', authenticate, async (req, res, next) => {
  try {
    const query = studentIbadahStatsQuerySchema.parse(req.query);
    const result = await service.getStudentIbadahStats(query);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/ibadah/stats/unit:
 *   get:
 *     summary: Get unit ibadah statistics
 *     tags: [Ibadah]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats/unit', authenticate, async (req, res, next) => {
  try {
    const query = unitIbadahStatsQuerySchema.parse(req.query);
    const result = await service.getUnitIbadahStats(query);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/ibadah/stats/class:
 *   get:
 *     summary: Get class ibadah statistics
 *     tags: [Ibadah]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats/class', authenticate, async (req, res, next) => {
  try {
    const query = classIbadahStatsQuerySchema.parse(req.query);
    const result = await service.getClassIbadahStats(query);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
});

// ======================
// ISLAMIC EVENTS
// ======================

/**
 * @swagger
 * /api/ibadah/events:
 *   get:
 *     summary: List Islamic events
 *     tags: [Ibadah]
 *     security:
 *       - bearerAuth: []
 */
router.get('/events', authenticate, async (req, res, next) => {
  try {
    const query = listIslamicEventsQuerySchema.parse(req.query);
    const result = await service.listIslamicEvents(query);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/ibadah/events/{id}:
 *   get:
 *     summary: Get Islamic event by ID
 *     tags: [Ibadah]
 *     security:
 *       - bearerAuth: []
 */
router.get('/events/:id', authenticate, async (req, res, next) => {
  try {
    const event = await service.getIslamicEventById(req.params.id);
    if (!event) {
      return res.status(404).json(ApiResponse.error('Event not found'));
    }
    res.json(ApiResponse.success(event));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/ibadah/events:
 *   post:
 *     summary: Create Islamic event
 *     tags: [Ibadah]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/events',
  authenticate,
  isTeacherOrAbove,
  validate(createIslamicEventSchema),
  async (req, res, next) => {
    try {
      const event = await service.createIslamicEvent(req.body);
      res.status(201).json(ApiResponse.success(event, 'Event created successfully'));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/ibadah/events/{id}:
 *   put:
 *     summary: Update Islamic event
 *     tags: [Ibadah]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/events/:id',
  authenticate,
  isTeacherOrAbove,
  validate(updateIslamicEventSchema),
  async (req, res, next) => {
    try {
      const event = await service.updateIslamicEvent(req.params.id, req.body);
      res.json(ApiResponse.success(event, 'Event updated successfully'));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/ibadah/events/{id}:
 *   delete:
 *     summary: Delete Islamic event
 *     tags: [Ibadah]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/events/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'UNIT_ADMIN'),
  async (req, res, next) => {
    try {
      await service.deleteIslamicEvent(req.params.id);
      res.json(ApiResponse.success(null, 'Event deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
);

export default router;
