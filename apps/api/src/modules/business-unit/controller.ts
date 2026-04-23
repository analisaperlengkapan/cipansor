import { Request, Response, NextFunction } from 'express';
import { businessUnitService } from './service';
import { BusinessUnitType } from '@prisma/client';

export const businessUnitController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const unitId = req.user?.unitId;
      if (!unitId) {
        return res.status(400).json({ success: false, message: 'Unit ID tidak ditemukan' });
      }

      const result = await businessUnitService.list({
        unitId,
        type: req.query.type as BusinessUnitType | undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const unitId = req.user?.unitId;
      if (!unitId) {
        return res.status(400).json({ success: false, message: 'Unit ID tidak ditemukan' });
      }

      const result = await businessUnitService.getById(req.params.id, unitId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const unitId = req.user?.unitId;
      if (!unitId) {
        return res.status(400).json({ success: false, message: 'Unit ID tidak ditemukan' });
      }

      const result = await businessUnitService.create({ ...req.body, unitId });
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const unitId = req.user?.unitId;
      if (!unitId) {
        return res.status(400).json({ success: false, message: 'Unit ID tidak ditemukan' });
      }

      const result = await businessUnitService.update(req.params.id, unitId, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const unitId = req.user?.unitId;
      if (!unitId) {
        return res.status(400).json({ success: false, message: 'Unit ID tidak ditemukan' });
      }

      await businessUnitService.delete(req.params.id, unitId);
      res.json({ success: true, data: null, message: 'Business unit berhasil dihapus' });
    } catch (error) {
      next(error);
    }
  },

  async getPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const unitId = req.user?.unitId;
      if (!unitId) {
        return res.status(400).json({ success: false, message: 'Unit ID tidak ditemukan' });
      }

      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'startDate dan endDate diperlukan' });
      }

      const result = await businessUnitService.getPerformance(
        req.params.id,
        unitId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
