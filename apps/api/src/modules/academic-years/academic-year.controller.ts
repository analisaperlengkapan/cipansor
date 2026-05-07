import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error';
import { academicYearService } from './academic-year.service';
import type {
  ListAcademicYearsQuery,
  CreateAcademicYearInput,
  UpdateAcademicYearInput,
} from './academic-year.schema';

/**
 * List academic years
 * GET /api/academic-years
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = (res.locals.validatedQuery || (req.query as any)) as ListAcademicYearsQuery;
  const result = await academicYearService.findAll(query);

  res.json({
    success: true,
    data: result.academicYears,
    meta: {
      pagination: result.pagination,
    },
  });
});

/**
 * Get active academic year
 * GET /api/academic-years/active
 */
export const getActive = asyncHandler(async (_req: Request, res: Response) => {
  const academicYear = await academicYearService.findActive();

  res.json({
    success: true,
    data: academicYear,
  });
});

/**
 * Get academic year by ID
 * GET /api/academic-years/:id
 */
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = (req.params as any);
  const academicYear = await academicYearService.findById(id);

  res.json({
    success: true,
    data: academicYear,
  });
});

/**
 * Create academic year
 * POST /api/academic-years
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const input: CreateAcademicYearInput = req.body;
  const academicYear = await academicYearService.create(input);

  res.status(201).json({
    success: true,
    data: academicYear,
  });
});

/**
 * Update academic year
 * PUT /api/academic-years/:id
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = (req.params as any);
  const input: UpdateAcademicYearInput = req.body;
  const academicYear = await academicYearService.update(id, input);

  res.json({
    success: true,
    data: academicYear,
  });
});

/**
 * Delete academic year
 * DELETE /api/academic-years/:id
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = (req.params as any);
  const result = await academicYearService.delete(id);

  res.json({
    success: true,
    data: result,
  });
});
