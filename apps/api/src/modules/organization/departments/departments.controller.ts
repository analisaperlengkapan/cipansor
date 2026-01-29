import { Request, Response } from 'express';
import { departmentService } from './departments.service';
import { sendResponse } from '@/utils/response';
import httpStatus from 'http-status';

export const departmentController = {
  async create(req: Request, res: Response) {
    const unitId = req.user?.unitId;
    if (!unitId) {
      return res.status(httpStatus.BAD_REQUEST).json({ message: 'Unit ID required' });
    }
    const result = await departmentService.create({ ...req.body, unitId });
    sendResponse(res, result, 'Department created', httpStatus.CREATED);
  },

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const result = await departmentService.update(id, req.body);
    sendResponse(res, result, 'Department updated');
  },

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    await departmentService.delete(id);
    sendResponse(res, null, 'Department deleted');
  },

  async getTree(req: Request, res: Response) {
    const unitId = req.user?.unitId || (req.query.unitId as string);
    if (!unitId) {
      return res.status(httpStatus.BAD_REQUEST).json({ message: 'Unit ID required' });
    }
    const result = await departmentService.getTree(unitId);
    sendResponse(res, result);
  },

  async findAll(req: Request, res: Response) {
    const unitId = req.user?.unitId || (req.query.unitId as string);
    if (!unitId) {
      return res.status(httpStatus.BAD_REQUEST).json({ message: 'Unit ID required' });
    }
    const result = await departmentService.findAll(unitId);
    sendResponse(res, result);
  },

  async findOne(req: Request, res: Response) {
    const { id } = req.params;
    const result = await departmentService.findOne(id);
    if (!result) {
      return res.status(httpStatus.NOT_FOUND).json({ message: 'Department not found' });
    }
    sendResponse(res, result);
  }
};
