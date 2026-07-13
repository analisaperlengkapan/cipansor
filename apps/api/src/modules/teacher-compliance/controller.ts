import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error';
import * as service from './service';

/** GET /api/teacher-compliance/:teacherId */
export const getByTeacher = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await service.getComplianceByTeacher(req.params.teacherId);
  if (!teacher) {
    return res.status(404).json({ success: false, message: 'Teacher not found' });
  }
  res.json({ success: true, data: teacher });
});

/** PUT /api/teacher-compliance/:teacherId */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId } = req.params;
  const { nik } = req.body;

  const existingTeacher = await service.findTeacherById(teacherId);
  if (!existingTeacher) {
    return res.status(404).json({ success: false, message: 'Teacher not found' });
  }

  if (nik && nik !== existingTeacher.nik && (await service.isNikTaken(nik, teacherId))) {
    return res.status(400).json({ success: false, message: 'NIK already exists' });
  }

  const updatedTeacher = await service.updateCompliance(teacherId, req.body);
  res.json({ success: true, message: 'Teacher compliance data updated', data: updatedTeacher });
});

/** GET /api/teacher-compliance/report/completeness */
export const completenessReport = asyncHandler(async (req: Request, res: Response) => {
  const { unitId, status } = req.query;
  const data = await service.getCompletenessReport({
    unitId: unitId as string | undefined,
    status: status as string | undefined,
  });
  res.json({ success: true, data });
});

/** GET /api/teacher-compliance/report/simtun-ready */
export const simtunReady = asyncHandler(async (req: Request, res: Response) => {
  const { unitId } = req.query;
  const data = await service.getSimtunReady({ unitId: unitId as string | undefined });
  res.json({ success: true, data });
});

/** GET /api/teacher-compliance/report/certification */
export const certificationReport = asyncHandler(async (req: Request, res: Response) => {
  const { unitId } = req.query;
  const data = await service.getCertificationReport({ unitId: unitId as string | undefined });
  res.json({ success: true, data });
});

/** POST /api/teacher-compliance/bulk-update */
export const bulkUpdate = asyncHandler(async (req: Request, res: Response) => {
  const { updates } = req.body;
  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ success: false, message: 'Updates array is required' });
  }

  const data = await service.bulkUpdate(updates);
  res.json({
    success: true,
    message: `Updated ${data.successful.length} teachers, ${data.failed.length} errors`,
    data,
  });
});
