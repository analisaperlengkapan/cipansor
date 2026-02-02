import { Request, Response, NextFunction } from 'express';
import { leaveBalanceService } from './leave-balances.service';
import { sendResponse } from '@/utils/response';
import { AppError } from '@/middleware/error';

export const leaveBalanceController = {
  getBalances: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const { academicYearId } = req.query; // Should get current AY if missing

      if (!academicYearId) {
        // Fallback to finding active academic year could be done in service
        // For now, require it
        throw new AppError('Academic Year ID is required' as any, 400 as any);
      }

      const result = await leaveBalanceService.getAllBalances(userId, academicYearId as string);
      // @ts-ignore
      sendResponse(res, result, 'Leave balances retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  initialize: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { unitId } = req.user!;
      if (!unitId) throw new AppError('Unit ID missing from user' as any, 400 as any);

      const result = await leaveBalanceService.initializeBalance({
        ...req.body,
        unitId,
      });
      res.status(201);
      // @ts-ignore
      sendResponse(res, result, 'Leave balance initialized successfully');
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { totalDays } = req.body;
      const result = await leaveBalanceService.updateBalance(id, Number(totalDays));
      // @ts-ignore
      sendResponse(res, result, 'Leave balance updated successfully');
    } catch (error) {
      next(error);
    }
  },
};
