import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error';
import * as service from './service';

/** GET /api/student-compliance/:studentId */
export const getByStudent = asyncHandler(async (req: Request, res: Response) => {
  const student = await service.getComplianceByStudent(req.params.studentId);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }
  res.json({ success: true, data: student });
});

/** PUT /api/student-compliance/:studentId */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const { nisn, nik } = req.body;

  const existingStudent = await service.findStudentById(studentId);
  if (!existingStudent) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  if (nisn && nisn !== existingStudent.nisn && (await service.isNisnTaken(nisn, studentId))) {
    return res.status(400).json({ success: false, message: 'NISN already exists' });
  }
  if (nik && nik !== existingStudent.nik && (await service.isNikTaken(nik, studentId))) {
    return res.status(400).json({ success: false, message: 'NIK already exists' });
  }

  const updatedStudent = await service.updateCompliance(studentId, req.body);
  res.json({ success: true, message: 'Student compliance data updated', data: updatedStudent });
});

/** GET /api/student-compliance/report/completeness */
export const completenessReport = asyncHandler(async (req: Request, res: Response) => {
  const { unitId, status } = req.query;
  const data = await service.getCompletenessReport({
    unitId: unitId as string | undefined,
    status: status as string | undefined,
  });
  res.json({ success: true, data });
});

/** GET /api/student-compliance/report/dapodik-ready */
export const dapodikReady = asyncHandler(async (req: Request, res: Response) => {
  const { unitId } = req.query;
  const data = await service.getDapodikReady({ unitId: unitId as string | undefined });
  res.json({ success: true, data });
});

/** POST /api/student-compliance/bulk-update */
export const bulkUpdate = asyncHandler(async (req: Request, res: Response) => {
  const { updates } = req.body;
  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ success: false, message: 'Updates array is required' });
  }

  const data = await service.bulkUpdate(updates);
  res.json({
    success: true,
    message: `Updated ${data.successful.length} students, ${data.failed.length} errors`,
    data,
  });
});
