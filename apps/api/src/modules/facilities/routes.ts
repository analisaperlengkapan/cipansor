import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@prisma/client';
import * as facilitiesController from './facilities.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== LANDS ====================

/**
 * @route GET /api/facilities/lands
 * @desc List all lands with pagination and filtering
 * @access Authenticated
 */
router.get('/lands', facilitiesController.listLands);

/**
 * @route GET /api/facilities/lands/:id
 * @desc Get land by ID with buildings
 * @access Authenticated
 */
router.get('/lands/:id', facilitiesController.getLand);

/**
 * @route POST /api/facilities/lands
 * @desc Create new land
 * @access SUPER_ADMIN, UNIT_ADMIN
 */
router.post(
  '/lands',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  facilitiesController.createLand
);

/**
 * @route PUT /api/facilities/lands/:id
 * @desc Update land
 * @access SUPER_ADMIN, UNIT_ADMIN
 */
router.put(
  '/lands/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  facilitiesController.updateLand
);

/**
 * @route DELETE /api/facilities/lands/:id
 * @desc Delete land
 * @access SUPER_ADMIN
 */
router.delete(
  '/lands/:id',
  authorize(UserRole.SUPER_ADMIN),
  facilitiesController.deleteLand
);

// ==================== BUILDINGS ====================

/**
 * @route GET /api/facilities/buildings
 * @desc List all buildings with pagination and filtering
 * @access Authenticated
 */
router.get('/buildings', facilitiesController.listBuildings);

/**
 * @route GET /api/facilities/buildings/:id
 * @desc Get building by ID with rooms
 * @access Authenticated
 */
router.get('/buildings/:id', facilitiesController.getBuilding);

/**
 * @route POST /api/facilities/buildings
 * @desc Create new building
 * @access SUPER_ADMIN, UNIT_ADMIN
 */
router.post(
  '/buildings',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  facilitiesController.createBuilding
);

/**
 * @route PUT /api/facilities/buildings/:id
 * @desc Update building
 * @access SUPER_ADMIN, UNIT_ADMIN
 */
router.put(
  '/buildings/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  facilitiesController.updateBuilding
);

/**
 * @route DELETE /api/facilities/buildings/:id
 * @desc Delete building
 * @access SUPER_ADMIN
 */
router.delete(
  '/buildings/:id',
  authorize(UserRole.SUPER_ADMIN),
  facilitiesController.deleteBuilding
);

// ==================== ROOM TYPES ====================

/**
 * @route GET /api/facilities/room-types
 * @desc List all room types
 * @access Authenticated
 */
router.get('/room-types', facilitiesController.listRoomTypes);

/**
 * @route GET /api/facilities/room-types/:id
 * @desc Get room type by ID
 * @access Authenticated
 */
router.get('/room-types/:id', facilitiesController.getRoomType);

/**
 * @route POST /api/facilities/room-types
 * @desc Create new room type
 * @access SUPER_ADMIN
 */
router.post(
  '/room-types',
  authorize(UserRole.SUPER_ADMIN),
  facilitiesController.createRoomType
);

/**
 * @route PUT /api/facilities/room-types/:id
 * @desc Update room type
 * @access SUPER_ADMIN
 */
router.put(
  '/room-types/:id',
  authorize(UserRole.SUPER_ADMIN),
  facilitiesController.updateRoomType
);

/**
 * @route DELETE /api/facilities/room-types/:id
 * @desc Delete room type
 * @access SUPER_ADMIN
 */
router.delete(
  '/room-types/:id',
  authorize(UserRole.SUPER_ADMIN),
  facilitiesController.deleteRoomType
);

// ==================== FACILITY ROOMS ====================

/**
 * @route GET /api/facilities/rooms
 * @desc List all facility rooms with pagination and filtering
 * @access Authenticated
 */
router.get('/rooms', facilitiesController.listRooms);

/**
 * @route GET /api/facilities/rooms/:id
 * @desc Get facility room by ID
 * @access Authenticated
 */
router.get('/rooms/:id', facilitiesController.getRoom);

/**
 * @route POST /api/facilities/rooms
 * @desc Create new facility room
 * @access SUPER_ADMIN, UNIT_ADMIN
 */
router.post(
  '/rooms',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  facilitiesController.createRoom
);

/**
 * @route PUT /api/facilities/rooms/:id
 * @desc Update facility room
 * @access SUPER_ADMIN, UNIT_ADMIN
 */
router.put(
  '/rooms/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  facilitiesController.updateRoom
);

/**
 * @route DELETE /api/facilities/rooms/:id
 * @desc Delete facility room
 * @access SUPER_ADMIN, UNIT_ADMIN
 */
router.delete(
  '/rooms/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  facilitiesController.deleteRoom
);

// ==================== SUMMARY ====================

/**
 * @route GET /api/facilities/summary
 * @desc Get facilities summary statistics
 * @access Authenticated
 */
router.get('/summary', facilitiesController.getFacilitiesSummary);

export default router;
