/**
 * PKG (Penilaian Kinerja Guru) API Routes
 *
 * Endpoints untuk manajemen PKG berdasarkan Permendiknas No. 35 Tahun 2010
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, authorize, isTeacherOrAbove } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { ApiResponse } from '@/utils/response';
import * as pkgService from './pkg.service';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// =====================================
// VALIDATION SCHEMAS
// =====================================

const createPeriodSchema = z.object({
  body: z.object({
    unitId: z.string().uuid(),
    academicYearId: z.string().uuid(),
    name: z.string().min(1).max(200),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    description: z.string().optional(),
  }),
});

const updatePeriodSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    description: z.string().optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  }),
});

const createEvaluationSchema = z.object({
  body: z.object({
    periodId: z.string().uuid(),
    teacherId: z.string().uuid(),
    assessorId: z.string().uuid().optional(),
  }),
});

const submitScoresSchema = z.object({
  body: z.object({
    scores: z.array(
      z.object({
        detailId: z.string().uuid(),
        selfScore: z.number().min(1).max(4).optional(),
        assessorScore: z.number().min(1).max(4).optional(),
        evidence: z.string().optional(),
        notes: z.string().optional(),
      })
    ),
  }),
});

const addDocumentSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    type: z.enum(['RPP', 'SILABUS', 'NILAI', 'SERTIFIKAT', 'KEHADIRAN', 'LAINNYA']),
    fileUrl: z.string().url(),
    fileSize: z.number().optional(),
  }),
});

// =====================================
// PERIOD ROUTES
// =====================================

// Get PKG indicators
router.get('/indicators', (_req: Request, res: Response) => {
  res.json(ApiResponse.success(pkgService.PKG_INDICATORS));
});

// List periods
router.get('/periods', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { unitId, academicYearId, status, page, limit } = req.query;
    const result = await pkgService.listPeriods({
      unitId: unitId as string,
      academicYearId: academicYearId as string,
      status: status as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });
    res.json(ApiResponse.success(result.data, undefined, result.pagination));
  } catch (err) {
    next(err);
  }
});

// Create period (Admin only)
router.post(
  '/periods',
  authorize('SUPER_ADMIN', 'UNIT_ADMIN'),
  validate(createPeriodSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const period = await pkgService.createPeriod(req.body);
      res.status(201).json(ApiResponse.success(period, 'Periode PKG berhasil dibuat'));
    } catch (err) {
      next(err);
    }
  }
);

// Get period by ID
router.get('/periods/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = await pkgService.getPeriodById(req.params.id);
    if (!period) {
      return res.status(404).json(ApiResponse.error('Periode tidak ditemukan', 'NOT_FOUND'));
    }
    res.json(ApiResponse.success(period));
  } catch (err) {
    next(err);
  }
});

// Update period
router.put(
  '/periods/:id',
  authorize('SUPER_ADMIN', 'UNIT_ADMIN'),
  validate(updatePeriodSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const period = await pkgService.updatePeriod(req.params.id, req.body);
      res.json(ApiResponse.success(period, 'Periode PKG berhasil diperbarui'));
    } catch (err) {
      next(err);
    }
  }
);

// Delete period
router.delete(
  '/periods/:id',
  authorize('SUPER_ADMIN', 'UNIT_ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await pkgService.deletePeriod(req.params.id);
      res.json(ApiResponse.success(null, 'Periode PKG berhasil dihapus'));
    } catch (err) {
      next(err);
    }
  }
);

// =====================================
// EVALUATION ROUTES
// =====================================

// List evaluations
router.get('/evaluations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { periodId, teacherId, status, page, limit } = req.query;
    const result = await pkgService.listEvaluations({
      periodId: periodId as string,
      teacherId: teacherId as string,
      status: status as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });
    res.json(ApiResponse.success(result.data, undefined, result.pagination));
  } catch (err) {
    next(err);
  }
});

// Create evaluation
router.post(
  '/evaluations',
  authorize('SUPER_ADMIN', 'UNIT_ADMIN'),
  validate(createEvaluationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const evaluation = await pkgService.createEvaluation(req.body);
      res.status(201).json(ApiResponse.success(evaluation, 'Evaluasi PKG berhasil dibuat'));
    } catch (err) {
      next(err);
    }
  }
);

// Bulk create evaluations
router.post(
  '/evaluations/bulk',
  authorize('SUPER_ADMIN', 'UNIT_ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { periodId, teacherIds } = req.body;
      const evaluations = await pkgService.createBulkEvaluations(periodId, teacherIds);
      res
        .status(201)
        .json(
          ApiResponse.success(evaluations, `${evaluations.length} evaluasi PKG berhasil dibuat`)
        );
    } catch (err) {
      next(err);
    }
  }
);

// Get evaluation by ID
router.get('/evaluations/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const evaluation = await pkgService.getEvaluation(req.params.id);
    if (!evaluation) {
      return res.status(404).json(ApiResponse.error('Evaluasi tidak ditemukan', 'NOT_FOUND'));
    }
    res.json(ApiResponse.success(evaluation));
  } catch (err) {
    next(err);
  }
});

// Submit scores
router.post(
  '/evaluations/:id/scores',
  isTeacherOrAbove,
  validate(submitScoresSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const evaluation = await pkgService.submitScores(req.params.id, req.body.scores);
      res.json(ApiResponse.success(evaluation, 'Nilai PKG berhasil disimpan'));
    } catch (err) {
      next(err);
    }
  }
);

// Update evaluation status
router.patch(
  '/evaluations/:id/status',
  isTeacherOrAbove,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body;
      const evaluation = await pkgService.updateEvaluationStatus(
        req.params.id,
        status,
        req.user?.sub
      );
      res.json(ApiResponse.success(evaluation, 'Status evaluasi berhasil diperbarui'));
    } catch (err) {
      next(err);
    }
  }
);

// =====================================
// DOCUMENT ROUTES
// =====================================

// Add document to evaluation
router.post(
  '/evaluations/:id/documents',
  isTeacherOrAbove,
  validate(addDocumentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const document = await pkgService.addDocument({
        evaluationId: req.params.id,
        ...req.body,
      });
      res.status(201).json(ApiResponse.success(document, 'Dokumen berhasil ditambahkan'));
    } catch (err) {
      next(err);
    }
  }
);

// Delete document
router.delete(
  '/documents/:id',
  isTeacherOrAbove,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await pkgService.deleteDocument(req.params.id);
      res.json(ApiResponse.success(null, 'Dokumen berhasil dihapus'));
    } catch (err) {
      next(err);
    }
  }
);

// =====================================
// TEACHER HISTORY & STATISTICS
// =====================================

// Get teacher PKG history
router.get(
  '/teachers/:teacherId/history',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const history = await pkgService.getTeacherPKGHistory(req.params.teacherId);
      res.json(ApiResponse.success(history));
    } catch (err) {
      next(err);
    }
  }
);

// Get PKG statistics
router.get('/statistics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { unitId, periodId } = req.query;
    const stats = await pkgService.getPKGStatistics({
      unitId: unitId as string,
      periodId: periodId as string,
    });
    res.json(ApiResponse.success(stats));
  } catch (err) {
    next(err);
  }
});

export default router;
