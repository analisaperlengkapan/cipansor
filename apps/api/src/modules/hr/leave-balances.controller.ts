import { Request, Response, NextFunction } from 'express';
import { leaveBalanceService } from './leave-balances.service';
import { sendResponse } from '@/utils/response';
import { AppError, ErrorCode } from '@/middleware/error';

export const leaveBalanceController = {
  initialize: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { academicYearId } = req.body;
      const { unitId } = req.user!;

      if (!academicYearId) throw new AppError(ErrorCode.BAD_REQUEST, 'Academic Year ID is required');
      if (!unitId) throw new AppError(ErrorCode.BAD_REQUEST, 'Unit ID missing from user');

      const result = await leaveBalanceService.initializeBalances(unitId, academicYearId);
      sendResponse(res, result, 'Leave balances initialized successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  findAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { unitId } = req.user!;
      if (!unitId) throw new AppError(ErrorCode.BAD_REQUEST, 'Unit ID missing from user');

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const search = req.query.search as string;
      const academicYearId = req.query.academicYearId as string;

      const result = await leaveBalanceService.findAll(unitId, {
        page,
        limit,
        search,
        academicYearId,
      });
      sendResponse(res, result, 'Leave balances retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await leaveBalanceService.update(id, req.body);
      sendResponse(res, result, 'Leave balance updated successfully');
    } catch (error) {
      next(error);
    }
  },
};
