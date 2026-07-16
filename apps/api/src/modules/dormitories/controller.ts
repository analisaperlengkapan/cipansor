import { Request, Response, NextFunction } from 'express';
import * as dormitoryService from './service';
import {
  createDormitorySchema,
  updateDormitorySchema,
  queryDormitorySchema,
  createRoomSchema,
  updateRoomSchema,
  queryRoomSchema,
  createRoomAssignmentSchema,
  updateRoomAssignmentSchema,
  queryRoomAssignmentSchema,
} from './schema';
import { ApiError, Errors } from '../../middleware/error';
import { prisma } from '../../lib/prisma';
import { requireUser } from '../../middleware/auth';

// =====================================
// DORMITORY CONTROLLERS
// =====================================

export async function createDormitory(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createDormitorySchema.parse(req.body);
    const dormitory = await dormitoryService.createDormitory(data);
    res.status(201).json({
      success: true,
      message: 'Dormitory created successfully',
      data: dormitory,
    });
  } catch (error) {
    next(error);
  }
}

export async function getStudentsByMusyrif(req: Request, res: Response, next: NextFunction) {
  try {
    // Current user is guaranteed by authenticate middleware
    // req.user is populated, but we can also use req.user.id if available on the type
    // In this codebase, usually it's attached to req.user
    // But since I don't see the type def, I'll cast it safely
    const userId = req.user?.id;
    if (!userId) {
      throw Errors.unauthorized('User not authenticated');
    }

    const students = await dormitoryService.getStudentsByMusyrif(userId);
    res.json({
      success: true,
      data: students,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDormitories(req: Request, res: Response, next: NextFunction) {
  try {
    const query = queryDormitorySchema.parse(res.locals.validatedQuery || req.query);
    const result = await dormitoryService.getDormitories(query);
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDormitoryById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const dormitory = await dormitoryService.getDormitoryById(id);
    if (!dormitory) {
      throw Errors.notFound('Dormitory not found');
    }
    res.json({
      success: true,
      data: dormitory,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDormitoryStats(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const stats = await dormitoryService.getDormitoryStats(id);
    if (!stats) {
      throw Errors.notFound('Dormitory not found');
    }
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateDormitory(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = updateDormitorySchema.parse(req.body);
    const dormitory = await dormitoryService.updateDormitory(id, data);
    res.json({
      success: true,
      message: 'Dormitory updated successfully',
      data: dormitory,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteDormitory(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await dormitoryService.deleteDormitory(id);
    res.json({
      success: true,
      message: 'Dormitory deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

// =====================================
// ROOM CONTROLLERS
// =====================================

export async function createRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createRoomSchema.parse(req.body);
    const room = await dormitoryService.createRoom(data);
    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: room,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRooms(req: Request, res: Response, next: NextFunction) {
  try {
    const query = queryRoomSchema.parse(res.locals.validatedQuery || req.query);
    const result = await dormitoryService.getRooms(query);
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRoomById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const room = await dormitoryService.getRoomById(id);
    if (!room) {
      throw Errors.notFound('Room not found');
    }
    res.json({
      success: true,
      data: room,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRoomSocialAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const user = requireUser(req);

    // Unit-level authorization: verify the room belongs to the user's unit
    if (user.role !== 'SUPER_ADMIN') {
      const room = await prisma.room.findUnique({
        where: { id },
        select: { dormitory: { select: { unitId: true } } },
      });
      if (!room) {
        throw Errors.notFound('Room not found');
      }
      if (room.dormitory.unitId !== user.unitId) {
        throw Errors.forbidden('Access to this room is not allowed');
      }
    }

    const analytics = await dormitoryService.getRoomSocialAnalytics(id);
    if (!analytics) {
      throw Errors.notFound('Room not found');
    }
    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRoomOccupancy(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const occupancy = await dormitoryService.getRoomOccupancy(id);
    if (!occupancy) {
      throw Errors.notFound('Room not found');
    }
    res.json({
      success: true,
      data: occupancy,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = updateRoomSchema.parse(req.body);
    const room = await dormitoryService.updateRoom(id, data);
    res.json({
      success: true,
      message: 'Room updated successfully',
      data: room,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await dormitoryService.deleteRoom(id);
    res.json({
      success: true,
      message: 'Room deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
}

// =====================================
// ROOM ASSIGNMENT CONTROLLERS
// =====================================

export async function createRoomAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createRoomAssignmentSchema.parse(req.body);
    const assignment = await dormitoryService.createRoomAssignment(data);
    res.status(201).json({
      success: true,
      message: 'Student assigned to room successfully',
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRoomAssignments(req: Request, res: Response, next: NextFunction) {
  try {
    const query = queryRoomAssignmentSchema.parse(res.locals.validatedQuery || req.query);
    const result = await dormitoryService.getRoomAssignments(query);
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRoomAssignmentById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const assignment = await dormitoryService.getRoomAssignmentById(id);
    if (!assignment) {
      throw Errors.notFound('Room assignment not found');
    }
    res.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateRoomAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = updateRoomAssignmentSchema.parse(req.body);
    const assignment = await dormitoryService.updateRoomAssignment(id, data);
    res.json({
      success: true,
      message: 'Room assignment updated successfully',
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
}

export async function endRoomAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await dormitoryService.endRoomAssignment(id);
    res.json({
      success: true,
      message: 'Room assignment ended successfully',
    });
  } catch (error) {
    next(error);
  }
}
