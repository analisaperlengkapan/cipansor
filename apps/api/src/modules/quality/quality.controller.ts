import { Request, Response, NextFunction } from 'express';
import { qualityService } from './quality.service';
import { asyncHandler, ApiError, ErrorCode } from '@/middleware/error';
import httpStatus from 'http-status';

export const qualityController = {
  getAllStandards: asyncHandler(async (req: Request, res: Response) => {
    const standards = await qualityService.getAllStandards();
    res.json({
      success: true,
      data: standards,
    });
  }),

  getStandardDetails: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { unitId, academicYearId } = req.query;

    if (!unitId || !academicYearId) {
      throw new ApiError(ErrorCode.BAD_REQUEST, 'unitId and academicYearId are required');
    }

    const standard = await qualityService.getStandardDetails(
      id,
      unitId as string,
      academicYearId as string
    );

    if (!standard) {
      throw new ApiError(ErrorCode.NOT_FOUND, 'Standard not found');
    }

    res.json({
      success: true,
      data: standard,
    });
  }),

  createEvidence: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const evidence = await qualityService.createEvidence(req.body, userId);
    res.status(httpStatus.CREATED).json({
      success: true,
      data: evidence,
    });
  }),

  deleteEvidence: asyncHandler(async (req: Request, res: Response) => {
    await qualityService.deleteEvidence(req.params.id);
    res.json({
      success: true,
      message: 'Evidence deleted successfully',
    });
  }),

  getDashboardSummary: asyncHandler(async (req: Request, res: Response) => {
    const { unitId, academicYearId } = req.query;

    if (!unitId || !academicYearId) {
      throw new ApiError(ErrorCode.BAD_REQUEST, 'unitId and academicYearId are required');
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

  // --- Audit Management ---

  createAudit: asyncHandler(async (req: Request, res: Response) => {
    const audit = await qualityService.createAudit(req.body);
    res.status(httpStatus.CREATED).json({
      success: true,
      data: audit,
    });
  }),

  getAudits: asyncHandler(async (req: Request, res: Response) => {
    const { unitId, academicYearId } = req.query;

    if (!unitId || !academicYearId) {
      throw new ApiError(ErrorCode.BAD_REQUEST, 'unitId and academicYearId are required');
    }

    const audits = await qualityService.getAudits(unitId as string, academicYearId as string);
    res.json({
      success: true,
      data: audits,
    });
  }),

  getAuditDetails: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const audit = await qualityService.getAuditDetails(id);

    if (!audit) {
      throw new ApiError(ErrorCode.NOT_FOUND, 'Audit not found');
    }

    res.json({
      success: true,
      data: audit,
    });
  }),

  updateAuditItem: asyncHandler(async (req: Request, res: Response) => {
    const { itemId } = req.params;
    const user = (req as any).user;
    const { score, notes } = req.body;

    const updatedItem = await qualityService.updateAuditItem(
      itemId,
      { score, notes },
      user.id,
      user.role,
      user.unitId
    );

    res.json({
      success: true,
      data: updatedItem,
    });
  }),
};
