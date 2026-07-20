import { Request, Response, NextFunction } from 'express';
import * as facilitiesService from './facilities.service';
import {
  listLandsQuerySchema,
  createLandSchema,
  updateLandSchema,
  landIdParamSchema,
  listBuildingsQuerySchema,
  createBuildingSchema,
  updateBuildingSchema,
  buildingIdParamSchema,
  createRoomTypeSchema,
  updateRoomTypeSchema,
  roomTypeIdParamSchema,
  listRoomsQuerySchema,
  createRoomSchema,
  updateRoomSchema,
  roomIdParamSchema,
  summaryQuerySchema,
} from './facilities.schema';

// ==================== LAND CONTROLLERS ====================

export async function listLands(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listLandsQuerySchema.parse(req.query);
    const result = await facilitiesService.listLands(query);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getLand(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = landIdParamSchema.parse(req.params);
    const land = await facilitiesService.getLandById(id);

    if (!land) {
      return res.status(404).json({
        success: false,
        message: 'Tanah tidak ditemukan',
      });
    }

    res.json({
      success: true,
      data: land,
    });
  } catch (error) {
    next(error);
  }
}

export async function createLand(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createLandSchema.parse(req.body);
    const land = await facilitiesService.createLand(data);

    res.status(201).json({
      success: true,
      message: 'Tanah berhasil ditambahkan',
      data: land,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateLand(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = landIdParamSchema.parse(req.params);
    const data = updateLandSchema.parse(req.body);
    const land = await facilitiesService.updateLand(id, data);

    res.json({
      success: true,
      message: 'Tanah berhasil diperbarui',
      data: land,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteLand(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = landIdParamSchema.parse(req.params);
    await facilitiesService.deleteLand(id);

    res.json({
      success: true,
      message: 'Tanah berhasil dihapus',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('bangunan')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
}

// ==================== BUILDING CONTROLLERS ====================

export async function listBuildings(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listBuildingsQuerySchema.parse(req.query);
    const result = await facilitiesService.listBuildings(query);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getBuilding(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = buildingIdParamSchema.parse(req.params);
    const building = await facilitiesService.getBuildingById(id);

    if (!building) {
      return res.status(404).json({
        success: false,
        message: 'Gedung tidak ditemukan',
      });
    }

    res.json({
      success: true,
      data: building,
    });
  } catch (error) {
    next(error);
  }
}

export async function createBuilding(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createBuildingSchema.parse(req.body);
    const building = await facilitiesService.createBuilding(data);

    res.status(201).json({
      success: true,
      message: 'Gedung berhasil ditambahkan',
      data: building,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateBuilding(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = buildingIdParamSchema.parse(req.params);
    const data = updateBuildingSchema.parse(req.body);
    const building = await facilitiesService.updateBuilding(id, data);

    res.json({
      success: true,
      message: 'Gedung berhasil diperbarui',
      data: building,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteBuilding(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = buildingIdParamSchema.parse(req.params);
    await facilitiesService.deleteBuilding(id);

    res.json({
      success: true,
      message: 'Gedung berhasil dihapus',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('ruangan')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
}

// ==================== ROOM TYPE CONTROLLERS ====================

export async function listRoomTypes(req: Request, res: Response, next: NextFunction) {
  try {
    const roomTypes = await facilitiesService.listRoomTypes();

    res.json({
      success: true,
      data: roomTypes,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRoomType(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = roomTypeIdParamSchema.parse(req.params);
    const roomType = await facilitiesService.getRoomTypeById(id);

    if (!roomType) {
      return res.status(404).json({
        success: false,
        message: 'Tipe ruangan tidak ditemukan',
      });
    }

    res.json({
      success: true,
      data: roomType,
    });
  } catch (error) {
    next(error);
  }
}

export async function createRoomType(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createRoomTypeSchema.parse(req.body);
    const roomType = await facilitiesService.createRoomType(data);

    res.status(201).json({
      success: true,
      message: 'Tipe ruangan berhasil ditambahkan',
      data: roomType,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateRoomType(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = roomTypeIdParamSchema.parse(req.params);
    const data = updateRoomTypeSchema.parse(req.body);
    const roomType = await facilitiesService.updateRoomType(id, data);

    res.json({
      success: true,
      message: 'Tipe ruangan berhasil diperbarui',
      data: roomType,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteRoomType(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = roomTypeIdParamSchema.parse(req.params);
    await facilitiesService.deleteRoomType(id);

    res.json({
      success: true,
      message: 'Tipe ruangan berhasil dihapus',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('digunakan')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
}

// ==================== FACILITY ROOM CONTROLLERS ====================

export async function listRooms(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listRoomsQuerySchema.parse(req.query);
    const result = await facilitiesService.listRooms(query);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = roomIdParamSchema.parse(req.params);
    const room = await facilitiesService.getRoomById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Ruangan tidak ditemukan',
      });
    }

    res.json({
      success: true,
      data: room,
    });
  } catch (error) {
    next(error);
  }
}

export async function createRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createRoomSchema.parse(req.body);
    const room = await facilitiesService.createRoom(data);

    res.status(201).json({
      success: true,
      message: 'Ruangan berhasil ditambahkan',
      data: room,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = roomIdParamSchema.parse(req.params);
    const data = updateRoomSchema.parse(req.body);
    const room = await facilitiesService.updateRoom(id, data);

    res.json({
      success: true,
      message: 'Ruangan berhasil diperbarui',
      data: room,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = roomIdParamSchema.parse(req.params);
    await facilitiesService.deleteRoom(id);

    res.json({
      success: true,
      message: 'Ruangan berhasil dihapus',
    });
  } catch (error) {
    next(error);
  }
}

// ==================== SUMMARY CONTROLLER ====================

export async function getFacilitiesSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const query = summaryQuerySchema.parse(req.query);
    const summary = await facilitiesService.getFacilitiesSummary(query);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
}
