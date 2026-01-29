import { Request, Response, NextFunction } from 'express';
import { shariaService } from './sharia.service';
import { ApiResponse } from '@/utils/response';

export const shariaController = {
  /**
   * GET /api/sharia/mustahik
   */
  async listMustahik(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, unitId, type, search } = req.query;

      const result = await shariaService.findAllMustahik({
        page: Number(page),
        limit: Number(limit),
        unitId: unitId as string,
        type: type as string,
        search: search as string,
      });

      res.json(
        ApiResponse.success(
          result.data,
          'Mustahik list retrieved successfully',
          result.pagination
        )
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/sharia/mustahik/:id
   */
  async getMustahikById(req: Request, res: Response, next: NextFunction) {
    try {
      const mustahik = await shariaService.findMustahikById(req.params.id);

      if (!mustahik) {
        return res.status(404).json(ApiResponse.error('Mustahik not found'));
      }

      res.json(ApiResponse.success(mustahik));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/sharia/mustahik
   */
  async createMustahik(req: Request, res: Response, next: NextFunction) {
    try {
      const mustahik = await shariaService.createMustahik(req.body);
      res.status(201).json(ApiResponse.success(mustahik, 'Mustahik created successfully'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/sharia/mustahik/:id
   */
  async updateMustahik(req: Request, res: Response, next: NextFunction) {
    try {
      const mustahik = await shariaService.updateMustahik(req.params.id, req.body);
      res.json(ApiResponse.success(mustahik, 'Mustahik updated successfully'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/sharia/mustahik/:id
   */
  async deleteMustahik(req: Request, res: Response, next: NextFunction) {
    try {
      await shariaService.deleteMustahik(req.params.id);
      res.json(ApiResponse.success(null, 'Mustahik deleted successfully'));
    } catch (error) {
      next(error);
    }
  },
};
