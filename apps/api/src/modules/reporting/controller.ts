/**
 * Reporting Controller
 * Phase 7A.3 - Advanced Reporting
 */

import type { Request, Response, NextFunction } from 'express';
import { reportingService, ReportType, ReportFormat } from './service';
import { z } from 'zod';

const generateReportSchema = z.object({
  type: z.enum([
    'STUDENT_LIST',
    'ATTENDANCE_SUMMARY',
    'TAHFIDZ_PROGRESS',
    'FINANCIAL_SUMMARY',
    'INVOICE_LIST',
    'VIOLATION_REPORT',
    'REWARD_REPORT',
    'HR_SUMMARY',
  ]),
  format: z.enum(['JSON', 'CSV']).default('JSON'),
  filters: z
    .object({
      unitId: z.string().uuid().optional(),
      academicYearId: z.string().uuid().optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      status: z.string().optional(),
    })
    .optional(),
});

export async function generateReport(req: Request, res: Response, next: NextFunction) {
  try {
    const body = generateReportSchema.parse(req.body);

    const filters = {
      ...body.filters,
      startDate: body.filters?.startDate ? new Date(body.filters.startDate) : undefined,
      endDate: body.filters?.endDate ? new Date(body.filters.endDate) : undefined,
    };

    const result = await reportingService.generateReport({
      type: body.type as ReportType,
      format: body.format as ReportFormat,
      filters,
    });

    if (body.format === 'CSV') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${body.type.toLowerCase()}_${Date.now()}.csv"`
      );
      return res.send(result.data);
    }

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getReportTypes(req: Request, res: Response, next: NextFunction) {
  try {
    const reportTypes = [
      { type: 'STUDENT_LIST', name: 'Daftar Siswa', category: 'STUDENT' },
      { type: 'ATTENDANCE_SUMMARY', name: 'Rekap Kehadiran', category: 'ATTENDANCE' },
      { type: 'TAHFIDZ_PROGRESS', name: 'Progress Tahfidz', category: 'TAHFIDZ' },
      { type: 'FINANCIAL_SUMMARY', name: 'Ringkasan Keuangan', category: 'FINANCE' },
      { type: 'INVOICE_LIST', name: 'Daftar Tagihan', category: 'FINANCE' },
      { type: 'VIOLATION_REPORT', name: 'Laporan Pelanggaran', category: 'DISCIPLINE' },
      { type: 'REWARD_REPORT', name: 'Laporan Penghargaan', category: 'DISCIPLINE' },
      { type: 'HR_SUMMARY', name: 'Ringkasan SDM', category: 'HR' },
    ];
    res.json({ success: true, data: reportTypes });
  } catch (error) {
    next(error);
  }
}

export async function getReportFormats(req: Request, res: Response, next: NextFunction) {
  try {
    const formats = [
      { format: 'JSON', name: 'JSON', mimeType: 'application/json' },
      { format: 'CSV', name: 'CSV', mimeType: 'text/csv' },
    ];
    res.json({ success: true, data: formats });
  } catch (error) {
    next(error);
  }
}

export async function getStudentReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId, status, format = 'JSON' } = req.query;
    const result = await reportingService.generateReport({
      type: 'STUDENT_LIST',
      format: format as ReportFormat,
      filters: { unitId: unitId as string, status: status as string },
    });

    if (format === 'CSV') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="students_${Date.now()}.csv"`);
      return res.send(result.data);
    }
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getAttendanceReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId, startDate, endDate, format = 'JSON' } = req.query;
    const result = await reportingService.generateReport({
      type: 'ATTENDANCE_SUMMARY',
      format: format as ReportFormat,
      filters: {
        unitId: unitId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      },
    });

    if (format === 'CSV') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="attendance_${Date.now()}.csv"`);
      return res.send(result.data);
    }
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getFinanceReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId, startDate, endDate } = req.query;
    const result = await reportingService.generateReport({
      type: 'FINANCIAL_SUMMARY',
      format: 'JSON',
      filters: {
        unitId: unitId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      },
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getTahfidzReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId, startDate, endDate, format = 'JSON' } = req.query;
    const result = await reportingService.generateReport({
      type: 'TAHFIDZ_PROGRESS',
      format: format as ReportFormat,
      filters: {
        unitId: unitId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      },
    });

    if (format === 'CSV') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="tahfidz_${Date.now()}.csv"`);
      return res.send(result.data);
    }
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
