import { Router } from 'express';
import waveController from './ppdb-wave.controller';
import { authenticate, authorize } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { UserRole } from '@prisma/client';
import { createWaveSchema, updateWaveSchema, assignWaveSchema } from './ppdb-wave.schema';

const router = Router();

// =====================================
// PUBLIC ROUTES
// =====================================

/**
 * @route GET /api/ppdb-wave/active/:periodId
 * @desc Get active waves for registration period (public)
 * @access Public
 */
router.get('/active/:periodId', waveController.listActive);

// =====================================
// AUTHENTICATED ROUTES
// =====================================

router.use(authenticate);

/**
 * @route GET /api/ppdb-wave
 * @desc Get all waves
 * @access Private - Admin, Staff
 */
router.get(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  waveController.list
);

/**
 * @route GET /api/ppdb-wave/stats/:periodId
 * @desc Get wave statistics for period
 * @access Private - Admin, Staff
 */
router.get(
  '/stats/:periodId',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  waveController.getStats
);

/**
 * @route GET /api/ppdb-wave/:id
 * @desc Get wave by ID
 * @access Private - Admin, Staff
 */
router.get(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  waveController.getById
);

/**
 * @route GET /api/ppdb-wave/:id/registrants
 * @desc Get registrants by wave
 * @access Private - Admin, Staff
 */
router.get(
  '/:id/registrants',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  waveController.getRegistrants
);

/**
 * @route POST /api/ppdb-wave
 * @desc Create new wave
 * @access Private - Admin
 */
router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(createWaveSchema),
  waveController.create
);

/**
 * @route PUT /api/ppdb-wave/:id
 * @desc Update wave
 * @access Private - Admin
 */
router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(updateWaveSchema),
  waveController.update
);

/**
 * @route DELETE /api/ppdb-wave/:id
 * @desc Delete wave
 * @access Private - Admin only
 */
router.delete('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN), waveController.delete);

/**
 * @route POST /api/ppdb-wave/assign
 * @desc Assign registrant to wave
 * @access Private - Admin, Staff
 */
router.post(
  '/assign',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  validate(assignWaveSchema),
  waveController.assignRegistrant
);

/**
 * @route POST /api/ppdb-wave/onboard-registrant
 * @desc Execute E2E sequence processing a successful registrant
 * @access Private - Admin, Staff
 */
router.post(
  '/onboard-registrant',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  // Typically we'd place a zod schema validation here: validate(onboardRegistrantSchema),
  waveController.onboardRegistrant
);

export default router;
