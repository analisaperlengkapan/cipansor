import { Request, Response, NextFunction } from 'express';
import { dapodikService } from './dapodik.service';

export const DapodikController = {
  // Export students
  async exportStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const options = {
        unitId: (req.query as any).unitId as string | undefined,
        academicYearId: (req.query as any).academicYearId as string | undefined,
        includeInactive: (req.query as any).includeInactive === 'true',
      };

      const data = await dapodikService.exportStudentData(options, req.user!);

      res.json({
        success: true,
        message: 'Data peserta didik berhasil diekspor',
        data,
        meta: {
          total: data.length,
          exportedAt: new Date().toISOString(),
          format: 'Dapodik',
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Export teachers
  async exportTeachers(req: Request, res: Response, next: NextFunction) {
    try {
      const options = {
        unitId: (req.query as any).unitId as string | undefined,
        academicYearId: (req.query as any).academicYearId as string | undefined,
        includeInactive: (req.query as any).includeInactive === 'true',
      };

      const data = await dapodikService.exportTeacherData(options, req.user!);

      res.json({
        success: true,
        message: 'Data PTK berhasil diekspor',
        data,
        meta: {
          total: data.length,
          exportedAt: new Date().toISOString(),
          format: 'Dapodik',
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Export rombel
  async exportRombel(req: Request, res: Response, next: NextFunction) {
    try {
      const options = {
        unitId: (req.query as any).unitId as string | undefined,
        academicYearId: (req.query as any).academicYearId as string | undefined,
      };

      const data = await dapodikService.exportRombelData(options, req.user!);

      res.json({
        success: true,
        message: 'Data rombel berhasil diekspor',
        data,
        meta: {
          total: data.length,
          exportedAt: new Date().toISOString(),
          format: 'Dapodik',
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Export school profile
  async exportSekolah(req: Request, res: Response, next: NextFunction) {
    try {
      const unitId = (req.params as any).unitId || ((req.query as any).unitId as string);

      if (!unitId) {
        return res.status(400).json({
          success: false,
          message: 'Unit ID wajib diisi',
        });
      }

      const data = await dapodikService.exportSekolahData(unitId, req.user!);

      res.json({
        success: true,
        message: 'Data sekolah berhasil diekspor',
        data,
        meta: {
          exportedAt: new Date().toISOString(),
          format: 'Dapodik',
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Get export summary
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const unitId = (req.params as any).unitId || ((req.query as any).unitId as string) || req.user?.unitId;

      if (!unitId) {
        return res.status(400).json({
          success: false,
          message: 'Unit ID wajib diisi',
        });
      }

      const data = await dapodikService.getExportSummary(unitId, req.user!);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  // Validate data
  async validateData(req: Request, res: Response, next: NextFunction) {
    try {
      const unitId = (req.params as any).unitId || ((req.query as any).unitId as string) || req.user?.unitId;

      if (!unitId) {
        return res.status(400).json({
          success: false,
          message: 'Unit ID wajib diisi',
        });
      }

      const validation = await dapodikService.validateData(unitId, req.user!);

      res.json({
        success: true,
        data: validation,
      });
    } catch (error) {
      next(error);
    }
  },
};
