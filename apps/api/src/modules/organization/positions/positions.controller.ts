import { Request, Response } from 'express';
import { positionService } from './positions.service';
import { sendResponse } from '@/utils/response';
import httpStatus from 'http-status';

export const positionController = {
  async create(req: Request, res: Response) {
    const unitId = req.user?.unitId;
    if (!unitId) {
      return res.status(httpStatus.BAD_REQUEST).json({ message: 'Unit ID required' });
    }
    const result = await positionService.create({ ...req.body, unitId });
    sendResponse(res, result, 'Position created', httpStatus.CREATED);
  },

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const result = await positionService.update(id, req.body);
    sendResponse(res, result, 'Position updated');
  },

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    await positionService.delete(id);
    sendResponse(res, null, 'Position deleted');
  },

  async getTree(req: Request, res: Response) {
    const unitId = req.user?.unitId || (req.query.unitId as string);
    if (!unitId) {
      return res.status(httpStatus.BAD_REQUEST).json({ message: 'Unit ID required' });
    }
    const result = await positionService.getTree(unitId);
    sendResponse(res, result);
  },

  async findAll(req: Request, res: Response) {
    const unitId = req.user?.unitId || (req.query.unitId as string);
    if (!unitId) {
      return res.status(httpStatus.BAD_REQUEST).json({ message: 'Unit ID required' });
    }
    const result = await positionService.findAll(unitId);
    sendResponse(res, result);
  },

  async findOne(req: Request, res: Response) {
    const { id } = req.params;
    const result = await positionService.findOne(id);
    if (!result) {
      return res.status(httpStatus.NOT_FOUND).json({ message: 'Position not found' });
    }
    sendResponse(res, result);
  }
};
