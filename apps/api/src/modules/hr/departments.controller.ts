import { Request, Response, NextFunction } from 'express';
import { departmentService } from './departments.service';
import { sendResponse } from '@/utils/response';
import { AppError } from '@/middleware/error';

export const departmentController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { unitId } = req.user!;
      if (!unitId) throw new AppError('Unit ID missing from user' as any, 400 as any);

      const result = await departmentService.create({ ...req.body, unitId });
      res.status(201);
      // @ts-ignore
      sendResponse(res, result, 'Department created successfully');
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await departmentService.update(id, req.body);
      // @ts-ignore
      sendResponse(res, result, 'Department updated successfully');
    } catch (error) {
      next(error);
    }
  },

  findAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { unitId } = req.user!;
      if (!unitId) throw new AppError('Unit ID missing from user' as any, 400 as any);

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const search = req.query.search as string;

      const result = await departmentService.findAll(unitId, { page, limit, search });
      // @ts-ignore
      sendResponse(res, result, 'Departments retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  findOne: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await departmentService.findOne(id);
      if (!result) throw new AppError('Department not found' as any, 404 as any);
      // @ts-ignore
      sendResponse(res, result, 'Department retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await departmentService.delete(id);
      // @ts-ignore
      sendResponse(res, null, 'Department deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};
