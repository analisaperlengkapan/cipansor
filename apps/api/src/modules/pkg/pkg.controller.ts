import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error';
import { ApiResponse } from '@/utils/response';
import * as pkgService from './pkg.service';

// =====================================
// PERIOD
// =====================================

/** GET /api/pkg/indicators */
export const getIndicators = (_req: Request, res: Response) => {
  res.json(ApiResponse.success(pkgService.PKG_INDICATORS));
};

/** GET /api/pkg/periods */
export const listPeriods = asyncHandler(async (req: Request, res: Response) => {
  const { unitId, academicYearId, status, page, limit } = req.query;
  const result = await pkgService.listPeriods({
    unitId: unitId as string,
    academicYearId: academicYearId as string,
    status: status as string,
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 20,
  });
  res.json(ApiResponse.success(result.data, undefined, result.pagination));
});

/** POST /api/pkg/periods */
export const createPeriod = asyncHandler(async (req: Request, res: Response) => {
  const period = await pkgService.createPeriod(req.body);
  res.status(201).json(ApiResponse.success(period, 'Periode PKG berhasil dibuat'));
});

/** GET /api/pkg/periods/:id */
export const getPeriod = asyncHandler(async (req: Request, res: Response) => {
  const period = await pkgService.getPeriodById(req.params.id);
  if (!period) {
    return res.status(404).json(ApiResponse.error('Periode tidak ditemukan', 'NOT_FOUND'));
  }
  res.json(ApiResponse.success(period));
});

/** PUT /api/pkg/periods/:id */
export const updatePeriod = asyncHandler(async (req: Request, res: Response) => {
  const period = await pkgService.updatePeriod(req.params.id, req.body);
  res.json(ApiResponse.success(period, 'Periode PKG berhasil diperbarui'));
});

/** DELETE /api/pkg/periods/:id */
export const deletePeriod = asyncHandler(async (req: Request, res: Response) => {
  await pkgService.deletePeriod(req.params.id);
  res.json(ApiResponse.success(null, 'Periode PKG berhasil dihapus'));
});

// =====================================
// EVALUATION
// =====================================

/** GET /api/pkg/evaluations */
export const listEvaluations = asyncHandler(async (req: Request, res: Response) => {
  const { periodId, teacherId, unitId, status, page, limit } = req.query;
  const result = await pkgService.listEvaluations({
    periodId: periodId as string,
    teacherId: teacherId as string,
    unitId: unitId as string,
    status: status as string,
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 20,
  });
  res.json(ApiResponse.success(result.data, undefined, result.pagination));
});

/** POST /api/pkg/evaluations */
export const createEvaluation = asyncHandler(async (req: Request, res: Response) => {
  const evaluation = await pkgService.createEvaluation(req.body);
  res.status(201).json(ApiResponse.success(evaluation, 'Evaluasi PKG berhasil dibuat'));
});

/** POST /api/pkg/evaluations/bulk */
export const bulkCreateEvaluations = asyncHandler(async (req: Request, res: Response) => {
  const { periodId, teacherIds } = req.body;
  const evaluations = await pkgService.createBulkEvaluations(periodId, teacherIds);
  res
    .status(201)
    .json(ApiResponse.success(evaluations, `${evaluations.length} evaluasi PKG berhasil dibuat`));
});

/** GET /api/pkg/evaluations/:id */
export const getEvaluation = asyncHandler(async (req: Request, res: Response) => {
  const evaluation = await pkgService.getEvaluation(req.params.id);
  if (!evaluation) {
    return res.status(404).json(ApiResponse.error('Evaluasi tidak ditemukan', 'NOT_FOUND'));
  }
  res.json(ApiResponse.success(evaluation));
});

/** POST /api/pkg/evaluations/:id/scores */
export const submitScores = asyncHandler(async (req: Request, res: Response) => {
  const evaluation = await pkgService.submitScores(req.params.id, req.body.scores);
  res.json(ApiResponse.success(evaluation, 'Nilai PKG berhasil disimpan'));
});

/** PATCH /api/pkg/evaluations/:id/status */
export const updateEvaluationStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;
  const evaluation = await pkgService.updateEvaluationStatus(req.params.id, status, req.user?.sub);
  res.json(ApiResponse.success(evaluation, 'Status evaluasi berhasil diperbarui'));
});

// =====================================
// DOCUMENT
// =====================================

/** POST /api/pkg/evaluations/:id/documents */
export const addDocument = asyncHandler(async (req: Request, res: Response) => {
  const document = await pkgService.addDocument({ evaluationId: req.params.id, ...req.body });
  res.status(201).json(ApiResponse.success(document, 'Dokumen berhasil ditambahkan'));
});

/** DELETE /api/pkg/documents/:id */
export const deleteDocument = asyncHandler(async (req: Request, res: Response) => {
  await pkgService.deleteDocument(req.params.id);
  res.json(ApiResponse.success(null, 'Dokumen berhasil dihapus'));
});

// =====================================
// TEACHER HISTORY & STATISTICS
// =====================================

/** GET /api/pkg/teachers/:teacherId/history */
export const getTeacherHistory = asyncHandler(async (req: Request, res: Response) => {
  const history = await pkgService.getTeacherPKGHistory(req.params.teacherId);
  res.json(ApiResponse.success(history));
});

/** GET /api/pkg/statistics */
export const getStatistics = asyncHandler(async (req: Request, res: Response) => {
  const { unitId, periodId } = req.query;
  const stats = await pkgService.getPKGStatistics({
    unitId: unitId as string,
    periodId: periodId as string,
  });
  res.json(ApiResponse.success(stats));
});
