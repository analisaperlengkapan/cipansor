import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error';
import { classService } from './class.service';
import type {
  ListClassesQuery,
  CreateClassInput,
  UpdateClassInput,
  EnrollStudentInput,
  UpdateEnrollmentInput,
} from './class.schema';

/**
 * List classes
 * GET /api/classes
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = (res.locals.validatedQuery || req.query) as ListClassesQuery;
  const result = await classService.findAll(query, {
    role: req.user!.role,
    unitId: req.user!.unitId,
  });

  res.json({
    success: true,
    data: result.classes,
    meta: {
      pagination: result.pagination,
    },
  });
});

/**
 * Get class by ID
 * GET /api/classes/:id
 */
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const classData = await classService.findById(id);

  res.json({
    success: true,
    data: classData,
  });
});

/**
 * Create class
 * POST /api/classes
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const input: CreateClassInput = req.body;
  const classData = await classService.create(input);

  res.status(201).json({
    success: true,
    data: classData,
  });
});

/**
 * Update class
 * PUT /api/classes/:id
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const input: UpdateClassInput = req.body;
  const classData = await classService.update(id, input);

  res.json({
    success: true,
    data: classData,
  });
});

/**
 * Delete class
 * DELETE /api/classes/:id
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await classService.delete(id);

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Enroll student
 * POST /api/classes/:id/enrollments
 */
export const enrollStudent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const input: EnrollStudentInput = req.body;
  const enrollment = await classService.enrollStudent(id, input);

  res.status(201).json({
    success: true,
    data: enrollment,
  });
});

/**
 * Update enrollment
 * PATCH /api/classes/:id/enrollments/:studentId
 */
export const updateEnrollment = asyncHandler(async (req: Request, res: Response) => {
  const { id, studentId } = req.params;
  const input: UpdateEnrollmentInput = req.body;
  const enrollment = await classService.updateEnrollment(id, studentId, input);

  res.json({
    success: true,
    data: enrollment,
  });
});

/**
 * Remove student from class
 * DELETE /api/classes/:id/enrollments/:studentId
 */
export const removeStudent = asyncHandler(async (req: Request, res: Response) => {
  const { id, studentId } = req.params;
  const result = await classService.removeStudent(id, studentId);

  res.json({
    success: true,
    data: result,
  });
});
