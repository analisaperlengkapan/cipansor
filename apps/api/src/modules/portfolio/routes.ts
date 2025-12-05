/**
 * Portfolio API Routes
 * 
 * Endpoints untuk manajemen portofolio digital siswa
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, isTeacherOrAbove } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { ApiResponse } from '@/utils/response';
import * as portfolioService from './portfolio.service';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// =====================================
// VALIDATION SCHEMAS
// =====================================

const createPortfolioSchema = z.object({
  body: z.object({
    studentId: z.string().uuid(),
    title: z.string().min(1).max(200),
    type: z.enum(['ACADEMIC', 'P5_PROJECT', 'EXTRACURRICULAR', 'ACHIEVEMENT', 'ARTWORK', 'TAHFIDZ', 'OTHER']),
    category: z.string().optional(),
    description: z.string().optional(),
    reflection: z.string().optional(),
    academicYearId: z.string().uuid().optional(),
    subjectId: z.string().uuid().optional(),
    classId: z.string().uuid().optional(),
    isPublic: z.boolean().optional(),
    isShowcase: z.boolean().optional(),
  }),
});

const updatePortfolioSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    type: z.enum(['ACADEMIC', 'P5_PROJECT', 'EXTRACURRICULAR', 'ACHIEVEMENT', 'ARTWORK', 'TAHFIDZ', 'OTHER']).optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    reflection: z.string().optional(),
    isPublic: z.boolean().optional(),
    isShowcase: z.boolean().optional(),
  }),
});

const addFileSchema = z.object({
  body: z.object({
    fileName: z.string().min(1),
    fileUrl: z.string().url(),
    fileType: z.string().min(1),
    fileSize: z.number().optional(),
    isCover: z.boolean().optional(),
  }),
});

const addCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(1000),
  }),
});

const reviewPortfolioSchema = z.object({
  body: z.object({
    score: z.number().min(0).max(100).optional(),
    feedback: z.string().optional(),
  }),
});

// =====================================
// PORTFOLIO ROUTES
// =====================================

// Get portfolio types and categories
router.get('/types', (_req: Request, res: Response) => {
  res.json(ApiResponse.success({
    types: portfolioService.PORTFOLIO_TYPES,
    categories: portfolioService.PORTFOLIO_CATEGORIES,
  }));
});

// List portfolios
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      studentId,
      unitId,
      type,
      category,
      academicYearId,
      isPublic,
      isShowcase,
      search,
      page,
      limit,
    } = req.query;

    const result = await portfolioService.getPortfolios({
      studentId: studentId as string,
      unitId: unitId as string,
      type: type as string,
      category: category as string,
      academicYearId: academicYearId as string,
      isPublic: isPublic === 'true' ? true : isPublic === 'false' ? false : undefined,
      isShowcase: isShowcase === 'true' ? true : isShowcase === 'false' ? false : undefined,
      search: search as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.json(ApiResponse.success(result.data, undefined, result.pagination));
  } catch (err) {
    next(err);
  }
});

// Create portfolio
router.post('/', validate(createPortfolioSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const portfolio = await portfolioService.createPortfolio(req.body);
    res.status(201).json(ApiResponse.success(portfolio, 'Portfolio berhasil dibuat'));
  } catch (err) {
    next(err);
  }
});

// Get portfolio by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const portfolio = await portfolioService.getPortfolioById(req.params.id);
    if (!portfolio) {
      return res.status(404).json(ApiResponse.error('Portfolio tidak ditemukan', 'NOT_FOUND'));
    }
    res.json(ApiResponse.success(portfolio));
  } catch (err) {
    next(err);
  }
});

// Update portfolio
router.put('/:id', validate(updatePortfolioSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const portfolio = await portfolioService.updatePortfolio(req.params.id, req.body);
    res.json(ApiResponse.success(portfolio, 'Portfolio berhasil diperbarui'));
  } catch (err) {
    next(err);
  }
});

// Delete portfolio
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await portfolioService.deletePortfolio(req.params.id);
    res.json(ApiResponse.success(null, 'Portfolio berhasil dihapus'));
  } catch (err) {
    next(err);
  }
});

// =====================================
// FILE ROUTES
// =====================================

// Add file to portfolio
router.post('/:id/files', validate(addFileSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = await portfolioService.addPortfolioFile({
      portfolioId: req.params.id,
      ...req.body,
    });
    res.status(201).json(ApiResponse.success(file, 'File berhasil ditambahkan'));
  } catch (err) {
    next(err);
  }
});

// Update file
router.patch('/files/:fileId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isCover, sortOrder } = req.body;
    const file = await portfolioService.updatePortfolioFile(req.params.fileId, {
      isCover,
      sortOrder,
    });
    res.json(ApiResponse.success(file, 'File berhasil diperbarui'));
  } catch (err) {
    next(err);
  }
});

// Delete file
router.delete('/files/:fileId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await portfolioService.deletePortfolioFile(req.params.fileId);
    res.json(ApiResponse.success(null, 'File berhasil dihapus'));
  } catch (err) {
    next(err);
  }
});

// =====================================
// COMMENT ROUTES
// =====================================

// Add comment
router.post('/:id/comments', validate(addCommentSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const comment = await portfolioService.addPortfolioComment({
      portfolioId: req.params.id,
      userId: req.user!.sub,
      content: req.body.content,
    });
    res.status(201).json(ApiResponse.success(comment, 'Komentar berhasil ditambahkan'));
  } catch (err) {
    next(err);
  }
});

// Update comment
router.patch('/comments/:commentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content } = req.body;
    const comment = await portfolioService.updatePortfolioComment(req.params.commentId, content);
    res.json(ApiResponse.success(comment, 'Komentar berhasil diperbarui'));
  } catch (err) {
    next(err);
  }
});

// Delete comment
router.delete('/comments/:commentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await portfolioService.deletePortfolioComment(req.params.commentId);
    res.json(ApiResponse.success(null, 'Komentar berhasil dihapus'));
  } catch (err) {
    next(err);
  }
});

// =====================================
// REVIEW ROUTES
// =====================================

// Review portfolio (teachers/admins)
router.post(
  '/:id/review',
  isTeacherOrAbove,
  validate(reviewPortfolioSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const portfolio = await portfolioService.reviewPortfolio(req.params.id, {
        reviewedBy: req.user!.sub,
        ...req.body,
      });
      res.json(ApiResponse.success(portfolio, 'Portfolio berhasil direview'));
    } catch (err) {
      next(err);
    }
  }
);

// =====================================
// STATISTICS ROUTES
// =====================================

// Get statistics
router.get('/statistics/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId, unitId, academicYearId } = req.query;
    const stats = await portfolioService.getPortfolioStatistics({
      studentId: studentId as string,
      unitId: unitId as string,
      academicYearId: academicYearId as string,
    });
    res.json(ApiResponse.success(stats));
  } catch (err) {
    next(err);
  }
});

// Get student showcase (public profile)
router.get('/showcase/:studentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const showcase = await portfolioService.getStudentShowcase(req.params.studentId);
    res.json(ApiResponse.success(showcase));
  } catch (err) {
    next(err);
  }
});

export default router;
