import { Request, Response, NextFunction } from 'express';
import { emisService } from './emis.service';
import { ApiResponse } from '@/utils/response';

export class EmisController {
  // ==================
  // EXPORT ENDPOINTS
  // ==================

  async exportStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, academicYearId, includeInactive } = (req.query as any);
      const data = await emisService.exportStudentData(
        {
          unitId: unitId as string,
          academicYearId: academicYearId as string,
          includeInactive: includeInactive === 'true',
        },
        req.user!
      );
      res.json(ApiResponse.success(data, 'Data siswa berhasil diekspor'));
    } catch (error) {
      next(error);
    }
  }

  async exportTeachers(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, includeInactive } = (req.query as any);
      const data = await emisService.exportTeacherData(
        {
          unitId: unitId as string,
          includeInactive: includeInactive === 'true',
        },
        req.user!
      );
      res.json(ApiResponse.success(data, 'Data guru berhasil diekspor'));
    } catch (error) {
      next(error);
    }
  }

  async exportInstitution(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId } = (req.params as any);
      const data = await emisService.exportInstitutionData(unitId, req.user!);
      res.json(ApiResponse.success(data, 'Data lembaga berhasil diekspor'));
    } catch (error) {
      next(error);
    }
  }

  // ==================
  // SUMMARY & VALIDATION
  // ==================

  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId } = (req.params as any);
      const data = await emisService.getExportSummary(unitId, req.user!);
      res.json(ApiResponse.success(data, 'Ringkasan data EMIS berhasil diambil'));
    } catch (error) {
      next(error);
    }
  }

  async validateData(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId } = (req.params as any);
      const data = await emisService.validateDataCompleteness(unitId, req.user!);
      res.json(ApiResponse.success(data, 'Validasi data EMIS selesai'));
    } catch (error) {
      next(error);
    }
  }
}

export const emisController = new EmisController();
