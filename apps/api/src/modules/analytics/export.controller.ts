/**
 * Export Analytics Controller
 */

import { Request, Response, NextFunction } from 'express';
import * as exportService from './export.service';

/**
 * Export students data
 */
export async function exportStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId, format = 'json' } = (req.query as any);
    const data = await exportService.exportStudentsData({
      unitId: unitId as string | undefined,
      format: format as 'json' | 'csv',
    });

    if (format === 'csv') {
      const csv = exportService.convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="students_export.csv"');
      return res.send(csv);
    }

    res.json({ success: true, data, count: data.length });
  } catch (error) {
    next(error);
  }
}

/**
 * Export attendance data
 */
export async function exportAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId, startDate, endDate, format = 'json' } = (req.query as any);
    const data = await exportService.exportAttendanceData({
      unitId: unitId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      format: format as 'json' | 'csv',
    });

    if (format === 'csv') {
      const csv = exportService.convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="attendance_export.csv"');
      return res.send(csv);
    }

    res.json({ success: true, data, count: data.length });
  } catch (error) {
    next(error);
  }
}

/**
 * Export finance data
 */
export async function exportFinance(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId, startDate, endDate, format = 'json' } = (req.query as any);
    const data = await exportService.exportFinanceData({
      unitId: unitId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      format: format as 'json' | 'csv',
    });

    if (format === 'csv') {
      const csv = exportService.convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="finance_export.csv"');
      return res.send(csv);
    }

    res.json({ success: true, data, count: data.length });
  } catch (error) {
    next(error);
  }
}

/**
 * Export tahfidz data
 */
export async function exportTahfidz(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId, startDate, endDate, format = 'json' } = (req.query as any);
    const data = await exportService.exportTahfidzData({
      unitId: unitId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      format: format as 'json' | 'csv',
    });

    if (format === 'csv') {
      const csv = exportService.convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="tahfidz_export.csv"');
      return res.send(csv);
    }

    res.json({ success: true, data, count: data.length });
  } catch (error) {
    next(error);
  }
}

/**
 * Export comprehensive data
 */
export async function exportAll(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId, startDate, endDate } = (req.query as any);
    const data = await exportService.getComprehensiveExport({
      unitId: unitId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      format: 'json',
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
