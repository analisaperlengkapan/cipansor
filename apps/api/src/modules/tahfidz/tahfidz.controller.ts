import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error';
import { tahfidzService } from './tahfidz.service';
import type { ListTahfidzQuery, CreateTahfidzInput, UpdateTahfidzInput } from './tahfidz.schema';
import type { TahfidzRecord, TahfidzDashboardStats } from '@cipansor/shared';
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

  // Use type assertion to ensure compatibility with Shared Types if there are minor mismatches
  // (e.g. Dates as Date objects vs strings) which Express handles automatically in res.json
  const records = result.records as unknown as TahfidzRecord[];

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
    data: record as unknown as TahfidzRecord,
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
    data: record as unknown as TahfidzRecord,
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
    data: record as unknown as TahfidzRecord,
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
export const getStudentSummary = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const summary = await tahfidzService.getStudentSummary(studentId);

  res.json({
    success: true,
    data: summary,
  });
});

/**
 * Get tahfidz dashboard stats
 * GET /api/tahfidz/dashboard
 */
export const getDashboard = asyncHandler(async (req: Request, res: Response<ApiResponse<TahfidzDashboardStats>>) => {
  const { unitId, year, month } = req.query;
  
  const stats = await tahfidzService.getDashboardStats({
    unitId: unitId as string | undefined,
    year: year ? parseInt(year as string) : undefined,
    month: month !== undefined ? parseInt(month as string) : undefined,
  });

  // Ensure strict alignment with TahfidzDashboardStats
  const safeStats: TahfidzDashboardStats = {
    ...stats,
    // Cast recentRecords if necessary, but TahfidzRecord (shared) and Prisma Record should be close
    recentRecords: stats.recentRecords as unknown as TahfidzRecord[]
  };

  res.json({
    success: true,
    data: safeStats,
  });
});
