import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error';
import { tahfidzService } from './tahfidz.service';
import { TahfidzMapper } from './tahfidz.mapper';
import type { ListTahfidzQuery, GenerateCertificateInput } from './tahfidz.schema';
import type { TahfidzRecord, TahfidzDashboardStats, TahfidzStudentSummary, CreateTahfidzInput, UpdateTahfidzInput, DigitalCertificate } from '@cipansor/shared';
import type { PaginatedResponse, ApiResponse } from '@cipansor/shared';

/**
 * List tahfidz records
 * GET /api/tahfidz
 */
export const list = asyncHandler(async (req: Request, res: Response<PaginatedResponse<TahfidzRecord>>) => {
  const query = (res.locals.validatedQuery || req.query) as ListTahfidzQuery;
  const result = await tahfidzService.findAll(query, {
    role: req.user!.role,
    unitId: req.user!.unitId,
  });

  const records = TahfidzMapper.toSharedRecords(result.records);

  res.json({
    success: true,
    data: records,
    meta: {
      pagination: result.pagination,
    },
  });
});

/**
 * Get tahfidz record by ID
 * GET /api/tahfidz/:id
 */
export const getById = asyncHandler(async (req: Request, res: Response<ApiResponse<TahfidzRecord>>) => {
  const { id } = req.params;
  const record = await tahfidzService.findById(id);

  res.json({
    success: true,
    data: TahfidzMapper.toSharedRecord(record),
  });
});

/**
 * Create tahfidz record
 * POST /api/tahfidz
 */
export const create = asyncHandler(async (req: Request, res: Response<ApiResponse<TahfidzRecord>>) => {
  const input: CreateTahfidzInput = req.body;
  const record = await tahfidzService.create(input, req.user!.sub);

  res.status(201).json({
    success: true,
    data: TahfidzMapper.toSharedRecord(record),
  });
});

/**
 * Update tahfidz record
 * PUT /api/tahfidz/:id
 */
export const update = asyncHandler(async (req: Request, res: Response<ApiResponse<TahfidzRecord>>) => {
  const { id } = req.params;
  const input: UpdateTahfidzInput = req.body;
  const record = await tahfidzService.update(id, input);

  res.json({
    success: true,
    data: TahfidzMapper.toSharedRecord(record),
  });
});

/**
 * Delete tahfidz record
 * DELETE /api/tahfidz/:id
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await tahfidzService.delete(id);

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Get student tahfidz summary
 * GET /api/tahfidz/students/:studentId/summary
 */
export const getStudentSummary = asyncHandler(async (req: Request, res: Response<ApiResponse<TahfidzStudentSummary>>) => {
  const { studentId } = req.params;
  const summary = await tahfidzService.getStudentSummary(studentId);

  // Summary object structure is specific, but recentRecords inside it should be mapped
  const safeSummary = {
    ...summary,
    recentRecords: TahfidzMapper.toSharedRecords(summary.recentRecords)
  } as unknown as TahfidzStudentSummary;

  res.json({
    success: true,
    data: safeSummary,
  });
});

/**
 * Get tahfidz dashboard stats
 * GET /api/tahfidz/dashboard
 */
export const getDashboardStats = asyncHandler(async (req: Request, res: Response<ApiResponse<TahfidzDashboardStats>>) => {
  const { unitId, year, month } = req.query;
  
  const stats = await tahfidzService.getDashboardStats({
    unitId: unitId as string | undefined,
    year: year ? parseInt(year as string) : undefined,
    month: month !== undefined ? parseInt(month as string) : undefined,
  });

  const safeStats: TahfidzDashboardStats = {
    ...stats,
    recentRecords: TahfidzMapper.toSharedRecords(stats.recentRecords)
  };

  res.json({
    success: true,
    data: safeStats,
  });
});

/**
 * Export getDashboardStats as getDashboard for backward compatibility or routing consistency
 */
export const getDashboard = getDashboardStats;

/**
 * Generate certificate
 * POST /api/tahfidz/certificates
 */
export const generateCertificate = asyncHandler(async (req: Request, res: Response<ApiResponse<DigitalCertificate>>) => {
  const input: GenerateCertificateInput = req.body;
  const cert = await tahfidzService.generateCertificate(input, req.user!.sub);

  // Cast Prisma result to Shared DigitalCertificate type (date handling)
  const safeCert: DigitalCertificate = {
    ...cert,
    issueDate: cert.issueDate.toISOString(),
    createdAt: cert.createdAt.toISOString(),
    updatedAt: cert.updatedAt.toISOString(),
    grade: cert.grade || undefined,
  } as unknown as DigitalCertificate;

  res.status(201).json({
    success: true,
    data: safeCert,
  });
});
