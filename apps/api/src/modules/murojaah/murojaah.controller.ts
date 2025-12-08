import { Request, Response, NextFunction } from 'express';
import { murojaahService } from './murojaah.service';
import { ApiResponse } from '@/utils/response';

// ============================================
// Murojaah Controllers
// ============================================

/**
 * List murojaah records with filters
 */
export const listMurojaah = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query as any;
    const result = await murojaahService.findAll(query, {
      role: (req.user as any)?.role,
      unitId: (req.user as any)?.unitId,
    });
    res.json(ApiResponse.paginated(
      result.records,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * Get single murojaah record by ID
 */
export const getMurojaahById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const record = await murojaahService.findById(id);
    res.json(ApiResponse.success(record));
  } catch (error) {
    next(error);
  }
};

/**
 * Create new murojaah record
 */
export const createMurojaah = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user as any)?.id;
    const record = await murojaahService.create(req.body, userId);
    res.status(201).json(ApiResponse.success(record, 'Murojaah record created successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Update murojaah record
 */
export const updateMurojaah = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const record = await murojaahService.update(id, req.body);
    res.json(ApiResponse.success(record, 'Murojaah record updated successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete murojaah record
 */
export const deleteMurojaah = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await murojaahService.delete(id);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

/**
 * Add mistake to murojaah record
 */
export const addMistake = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mistake = await murojaahService.addMistake(req.body);
    res.status(201).json(ApiResponse.success(mistake, 'Mistake added successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete mistake from murojaah record
 */
export const deleteMistake = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await murojaahService.deleteMistake(id);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

/**
 * Get student murojaah history
 */
export const getStudentHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.params;
    const query = req.query as any;
    const result = await murojaahService.getStudentHistory(studentId, query);
    res.json(ApiResponse.paginated(
      result.records,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * Get student murojaah summary/statistics
 */
export const getStudentSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.params;
    const query = { studentId, ...req.query } as any;
    const summary = await murojaahService.getStudentSummary(query);
    res.json(ApiResponse.success(summary));
  } catch (error) {
    next(error);
  }
};

/**
 * Get halaqoh murojaah records
 */
export const getHalaqohRecords = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { halaqohId } = req.params;
    const query = { halaqohId, ...req.query } as any;
    const result = await murojaahService.getHalaqohRecords(query);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

/**
 * Get murojaah schedule recommendation for student
 */
export const getMurojaahSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.params;
    const schedule = await murojaahService.getMurojaahSchedule(studentId);
    res.json(ApiResponse.success(schedule));
  } catch (error) {
    next(error);
  }
};
