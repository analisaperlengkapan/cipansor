import { Request, Response, NextFunction } from "express";
import * as service from "./service";
import {
  createStaffAttendanceSchema,
  updateStaffAttendanceSchema,
  bulkAttendanceSchema,
  createLeaveSchema,
  updateLeaveSchema,
  approveLeaveSchema,
} from "./schema";
import { Errors } from "../../middleware/error";
import { z } from "zod";

// =====================================
// STAFF ATTENDANCE CONTROLLERS
// =====================================

export async function getStaffAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const query = res.locals.validatedQuery;
    const result = await service.getStaffAttendance(query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getStaffAttendanceById(req: Request, res: Response, next: NextFunction) {
  try {
    const attendance = await service.getStaffAttendanceById(req.params.id);
    if (!attendance) {
      throw Errors.notFound("Attendance record not found");
    }
    res.json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
}

export async function createStaffAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createStaffAttendanceSchema.parse(req.body);
    const attendance = await service.createStaffAttendance(data);
    res.status(201).json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
}

export async function updateStaffAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateStaffAttendanceSchema.parse(req.body);
    const attendance = await service.updateStaffAttendance(req.params.id, data);
    res.json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
}

export async function recordBulkAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const data = bulkAttendanceSchema.parse(req.body);
    const result = await service.recordBulkAttendance(data);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getStaffAttendanceSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const schema = z.object({
      month: z.coerce.number().min(1).max(12),
      year: z.coerce.number().min(2000).max(2100),
    });
    const { month, year } = schema.parse(req.query);
    const summary = await service.getStaffAttendanceSummary(req.params.staffId, month, year);
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
}

export async function deleteStaffAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteStaffAttendance(req.params.id);
    res.json({ success: true, message: "Attendance record deleted successfully" });
  } catch (error) {
    next(error);
  }
}

// =====================================
// LEAVE CONTROLLERS
// =====================================

export async function getLeaves(req: Request, res: Response, next: NextFunction) {
  try {
    const query = res.locals.validatedQuery;
    const result = await service.getLeaves(query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getLeaveById(req: Request, res: Response, next: NextFunction) {
  try {
    const leave = await service.getLeaveById(req.params.id);
    if (!leave) {
      throw Errors.notFound("Leave request not found");
    }
    res.json({ success: true, data: leave });
  } catch (error) {
    next(error);
  }
}

export async function createLeave(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createLeaveSchema.parse(req.body);
    const leave = await service.createLeave(data);
    res.status(201).json({ success: true, data: leave });
  } catch (error) {
    next(error);
  }
}

export async function updateLeave(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateLeaveSchema.parse(req.body);
    const leave = await service.updateLeave(req.params.id, data);
    res.json({ success: true, data: leave });
  } catch (error) {
    next(error);
  }
}

export async function approveLeave(req: Request, res: Response, next: NextFunction) {
  try {
    const data = approveLeaveSchema.parse(req.body);
    const approverId = req.user?.sub;
    if (!approverId) {
      throw Errors.unauthorized("User not authenticated");
    }
    const leave = await service.approveLeave(req.params.id, approverId, data);
    res.json({ success: true, data: leave });
  } catch (error) {
    next(error);
  }
}

export async function cancelLeave(req: Request, res: Response, next: NextFunction) {
  try {
    const leave = await service.cancelLeave(req.params.id);
    res.json({ success: true, data: leave, message: "Leave request cancelled" });
  } catch (error) {
    next(error);
  }
}

export async function deleteLeave(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteLeave(req.params.id);
    res.json({ success: true, message: "Leave request deleted successfully" });
  } catch (error) {
    next(error);
  }
}

export async function getLeaveBalance(req: Request, res: Response, next: NextFunction) {
  try {
    const schema = z.object({ year: z.coerce.number().min(2000).max(2100) });
    const { year } = schema.parse(req.query);
    const balance = await service.getLeaveBalance(req.params.staffId, year);
    res.json({ success: true, data: balance });
  } catch (error) {
    next(error);
  }
}

// =====================================
// STAFF CONTROLLERS (HR listing)
// =====================================

export async function getStaffList(req: Request, res: Response, next: NextFunction) {
  try {
    const query = res.locals.validatedQuery;
    const result = await service.getStaffList(query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getStaffById(req: Request, res: Response, next: NextFunction) {
  try {
    const staff = await service.getStaffById(req.params.id);
    if (!staff) {
      throw Errors.notFound("Staff not found");
    }
    res.json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
}
