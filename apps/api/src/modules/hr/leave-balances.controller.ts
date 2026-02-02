import { Request, Response, NextFunction } from 'express';
import { leaveBalanceService } from './leave-balances.service';
import { sendResponse } from '@/utils/response';
import { Errors } from '../../middleware/error';

export const leaveBalanceController = {
  getBalances: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const { academicYearId } = req.query; // Should get current AY if missing

      if (!academicYearId) {
        // Fallback to finding active academic year could be done in service
        // For now, require it
        throw Errors.badRequest('Academic Year ID is required');
      }

      const result = await leaveBalanceService.getAllBalances(userId, academicYearId as string);
      sendResponse(res, result, 'Leave balances retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  initialize: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { unitId } = req.user!;
      if (!unitId) throw Errors.badRequest('Unit ID missing from user');

      const result = await leaveBalanceService.initializeBalance({
        ...req.body,
        unitId,
      });
      sendResponse(res, result, 'Leave balance initialized successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { totalDays } = req.body;
      const result = await leaveBalanceService.updateBalance(id, Number(totalDays));
      sendResponse(res, result, 'Leave balance updated successfully');
    } catch (error) {
      next(error);
    }
  },

  findAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { academicYearId } = req.query;
      if (!academicYearId) throw Errors.badRequest('Academic Year ID is required');

      const { unitId } = req.user!;
      if (!unitId) throw Errors.badRequest('Unit ID missing from user');

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const search = req.query.search as string;

      const result = await leaveBalanceService.findAll(unitId, academicYearId as string, {
        page,
        limit,
        search,
      });
      sendResponse(res, result, 'Leave balances retrieved successfully');
    } catch (error) {
      next(error);
    }
  },
};
