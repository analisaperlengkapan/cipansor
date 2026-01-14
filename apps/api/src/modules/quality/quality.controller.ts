import { Request, Response, NextFunction } from 'express';
import { qualityService } from './quality.service';
import { catchAsync } from '@/utils/catch-async';
import { ApiError } from '@/middleware/error';
import httpStatus from 'http-status';

export const qualityController = {
  getAllStandards: catchAsync(async (req: Request, res: Response) => {
    const standards = await qualityService.getAllStandards();
    res.json({
      success: true,
      data: standards,
    });
  }),

  getStandardDetails: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { unitId, academicYearId } = req.query;

    if (!unitId || !academicYearId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'unitId and academicYearId are required');
    }

    const standard = await qualityService.getStandardDetails(
      id,
      unitId as string,
      academicYearId as string
    );

    if (!standard) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Standard not found');
    }

    res.json({
      success: true,
      data: standard,
    });
  }),

  createEvidence: catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const evidence = await qualityService.createEvidence(req.body, userId);
    res.status(httpStatus.CREATED).json({
      success: true,
      data: evidence,
    });
  }),

  deleteEvidence: catchAsync(async (req: Request, res: Response) => {
    await qualityService.deleteEvidence(req.params.id);
    res.json({
      success: true,
      message: 'Evidence deleted successfully',
    });
  }),

  getDashboardSummary: catchAsync(async (req: Request, res: Response) => {
    const { unitId, academicYearId } = req.query;

    if (!unitId || !academicYearId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'unitId and academicYearId are required');
    }

    const summary = await qualityService.getDashboardSummary(
      unitId as string,
      academicYearId as string
    );

    res.json({
      success: true,
      data: summary,
    });
  }),
};
