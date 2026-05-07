import { Request, Response, NextFunction } from 'express';
import { bosService, BOS_COMPONENTS } from './bos.service';
import { ApiResponse } from '@/utils/response';

export class BosController {
  // ==================
  // ALLOCATION
  // ==================

  async createAllocation(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await bosService.createAllocation(req.body, req.user!);
      res.status(201).json(ApiResponse.success(data, 'Alokasi BOS berhasil dibuat'));
    } catch (error) {
      next(error);
    }
  }

  // ==================
  // EXPENSES
  // ==================

  async recordExpense(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await bosService.recordExpense(req.body, req.user!);
      res.status(201).json(ApiResponse.success(data, 'Pengeluaran BOS berhasil dicatat'));
    } catch (error) {
      next(error);
    }
  }

  // ==================
  // REPORTING
  // ==================

  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, year, quarter } = (req.query as any);
      const data = await bosService.getBosSummary(
        {
          unitId: unitId as string,
          year: parseInt(year as string) || new Date().getFullYear(),
          quarter: quarter ? parseInt(quarter as string) : undefined,
        },
        req.user!
      );
      res.json(ApiResponse.success(data, 'Ringkasan BOS berhasil diambil'));
    } catch (error) {
      next(error);
    }
  }

  async getTransparencyReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, year } = (req.params as any);
      const data = await bosService.getBosTransparencyReport(
        unitId,
        parseInt(year) || new Date().getFullYear(),
        req.user!
      );
      res.json(ApiResponse.success(data, 'Laporan transparansi BOS berhasil dibuat'));
    } catch (error) {
      next(error);
    }
  }

  async getQuarterlyReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, year, quarter } = (req.params as any);
      const data = await bosService.getQuarterlyReport(
        unitId,
        parseInt(year) || new Date().getFullYear(),
        parseInt(quarter) || 1,
        req.user!
      );
      res.json(ApiResponse.success(data, 'Laporan triwulan BOS berhasil dibuat'));
    } catch (error) {
      next(error);
    }
  }

  // ==================
  // VALIDATION
  // ==================

  async validateUsage(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, year } = (req.params as any);
      const data = await bosService.validateBosUsage(
        unitId,
        parseInt(year) || new Date().getFullYear(),
        req.user!
      );
      res.json(ApiResponse.success(data, 'Validasi penggunaan BOS selesai'));
    } catch (error) {
      next(error);
    }
  }

  // ==================
  // REFERENCE DATA
  // ==================

  async getComponents(_req: Request, res: Response, _next: NextFunction) {
    res.json(ApiResponse.success(BOS_COMPONENTS, 'Daftar komponen BOS'));
  }
}

export const bosController = new BosController();
