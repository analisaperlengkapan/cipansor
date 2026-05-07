import { Request, Response, NextFunction } from 'express';
import { simaanService } from './simaan.service';
import { ApiResponse } from '@/utils/response';

// ============================================
// Simaan Controllers
// ============================================

export const listSimaan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = (req.query as any) as any;
    const result = await simaanService.findAll(query);
    res.json(
      ApiResponse.paginated(
        result.records,
        result.pagination.page,
        result.pagination.limit,
        result.pagination.total
      )
    );
  } catch (error) {
    next(error);
  }
};

export const getSimaanById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = (req.params as any);
    const record = await simaanService.findById(id);
    res.json(ApiResponse.success(record));
  } catch (error) {
    next(error);
  }
};

export const createSimaan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await simaanService.create(req.body);
    res.status(201).json(ApiResponse.success(record, 'Simaan exam created successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateSimaan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = (req.params as any);
    const record = await simaanService.update(id, req.body);
    res.json(ApiResponse.success(record, 'Simaan exam updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const deleteSimaan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = (req.params as any);
    const result = await simaanService.delete(id);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

export const addExaminer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const examiner = await simaanService.addExaminer(req.body);
    res.status(201).json(ApiResponse.success(examiner, 'Examiner added successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateExaminer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = (req.params as any);
    const examiner = await simaanService.updateExaminer(id, req.body);
    res.json(ApiResponse.success(examiner, 'Examiner updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const deleteExaminer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = (req.params as any);
    const result = await simaanService.deleteExaminer(id);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

export const submitScores = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await simaanService.submitScores(req.body);
    res.json(ApiResponse.success(record, 'Scores submitted successfully'));
  } catch (error) {
    next(error);
  }
};

export const getStudentSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId } = (req.params as any);
    const query = { studentId, ...(req.query as any) } as any;
    const summary = await simaanService.getStudentSummary(query);
    res.json(ApiResponse.success(summary));
  } catch (error) {
    next(error);
  }
};

export const getHalaqohRecords = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { halaqohId } = (req.params as any);
    const query = { halaqohId, ...(req.query as any) } as any;
    const result = await simaanService.getHalaqohRecords(query);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

export const getUpcomingExams = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const halaqohId = (req.query as any).halaqohId as string | undefined;
    const days = (req.query as any).days ? parseInt((req.query as any).days as string) : 7;
    const exams = await simaanService.getUpcomingExams(halaqohId, days);
    res.json(ApiResponse.success(exams));
  } catch (error) {
    next(error);
  }
};
