import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error';
import { Errors } from '@/middleware/error';
import { riskService } from './risk.service';
import { createRiskSchema, updateRiskSchema, createMitigationSchema, updateMitigationSchema } from './risk.validation';
import { UserRole } from '@prisma/client';

export const listRisks = asyncHandler(async (req: Request, res: Response) => {
  const unitId = req.user?.unitId;
  if (!unitId && req.user?.role !== UserRole.SUPER_ADMIN) throw Errors.unauthorized('Unit ID required');

  const targetUnitId = (req.user?.role === UserRole.SUPER_ADMIN && req.query.unitId)
    ? String(req.query.unitId)
    : unitId;

  if (!targetUnitId) throw Errors.badRequest('Unit ID required');

  const risks = await riskService.getRisks(targetUnitId, req.query);
  res.json({ success: true, data: risks });
});

export const getRisk = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const risk = await riskService.getRiskById(id);

  if (!risk) {
    throw Errors.notFound('Risk not found');
  }

  // Authorization Check
  if (req.user?.role !== UserRole.SUPER_ADMIN && risk.unitId !== req.user?.unitId) {
    throw Errors.forbidden('Access denied');
  }

  res.json({ success: true, data: risk });
});

export const createRisk = asyncHandler(async (req: Request, res: Response) => {
  const unitId = req.user?.unitId;
  const userId = req.user?.sub;
  if (!unitId || !userId) throw Errors.unauthorized('User context missing');

  const body = createRiskSchema.parse(req.body);

  const risk = await riskService.createRisk({
    ...body,
    unit: { connect: { id: unitId } },
    createdBy: { connect: { id: userId } },
  });

  res.status(201).json({ success: true, data: risk });
});

export const updateRisk = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const existingRisk = await riskService.getRiskById(id);
  if (!existingRisk) throw Errors.notFound('Risk not found');

  if (req.user?.role !== UserRole.SUPER_ADMIN && existingRisk.unitId !== req.user?.unitId) {
    throw Errors.forbidden('Access denied');
  }

  const body = updateRiskSchema.parse(req.body);
  const risk = await riskService.updateRisk(id, body);
  res.json({ success: true, data: risk });
});

export const deleteRisk = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const existingRisk = await riskService.getRiskById(id);
  if (!existingRisk) throw Errors.notFound('Risk not found');

  if (req.user?.role !== UserRole.SUPER_ADMIN && existingRisk.unitId !== req.user?.unitId) {
    throw Errors.forbidden('Access denied');
  }

  await riskService.deleteRisk(id);
  res.json({ success: true, message: 'Risk deleted' });
});

// Mitigations
export const addMitigation = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) throw Errors.unauthorized('User context missing');

  const body = createMitigationSchema.parse(req.body);
  const { picId, riskId, ...rest } = body;

  // Verify Risk Ownership
  const risk = await riskService.getRiskById(riskId);
  if (!risk) throw Errors.notFound('Risk not found');

  if (req.user?.role !== UserRole.SUPER_ADMIN && risk.unitId !== req.user?.unitId) {
    throw Errors.forbidden('Access denied');
  }

  const mitigation = await riskService.createMitigation({
    ...rest,
    risk: { connect: { id: riskId } },
    createdBy: { connect: { id: userId } },
    pic: picId ? { connect: { id: picId } } : undefined,
  });

  res.status(201).json({ success: true, data: mitigation });
});

export const updateMitigation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Verify Mitigation Ownership via Risk
  const existingMitigation = await riskService.getMitigationById(id);
  if (!existingMitigation) throw Errors.notFound('Mitigation not found');

  if (req.user?.role !== UserRole.SUPER_ADMIN && existingMitigation.risk.unitId !== req.user?.unitId) {
    throw Errors.forbidden('Access denied');
  }

  const body = updateMitigationSchema.parse(req.body);
  const { picId, ...rest } = body;

  const data: any = { ...rest };
  if (picId) {
    data.pic = { connect: { id: picId } };
  }

  const mitigation = await riskService.updateMitigation(id, data);

  res.json({ success: true, data: mitigation });
});

export const deleteMitigation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Verify Mitigation Ownership via Risk
  const existingMitigation = await riskService.getMitigationById(id);
  if (!existingMitigation) throw Errors.notFound('Mitigation not found');

  if (req.user?.role !== UserRole.SUPER_ADMIN && existingMitigation.risk.unitId !== req.user?.unitId) {
    throw Errors.forbidden('Access denied');
  }

  await riskService.deleteMitigation(id);
  res.json({ success: true, message: 'Mitigation deleted' });
});
