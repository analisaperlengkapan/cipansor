import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error';
import { riskService } from './risk.service';
import { createRiskSchema, updateRiskSchema, createMitigationSchema, updateMitigationSchema } from './risk.validation';

export const listRisks = asyncHandler(async (req: Request, res: Response) => {
  const unitId = req.user?.unitId;
  if (!unitId) throw new Error('Unit ID required');

  const risks = await riskService.getRisks(unitId, req.query);
  res.json({ success: true, data: risks });
});

export const getRisk = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const risk = await riskService.getRiskById(id);
  if (!risk) {
    res.status(404);
    throw new Error('Risk not found');
  }
  res.json({ success: true, data: risk });
});

export const createRisk = asyncHandler(async (req: Request, res: Response) => {
  const unitId = req.user?.unitId;
  const userId = req.user?.sub;
  if (!unitId || !userId) throw new Error('User context missing');

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
  const body = updateRiskSchema.parse(req.body);
  const risk = await riskService.updateRisk(id, body);
  res.json({ success: true, data: risk });
});

export const deleteRisk = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await riskService.deleteRisk(id);
  res.json({ success: true, message: 'Risk deleted' });
});

// Mitigations
export const addMitigation = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) throw new Error('User context missing');

  const body = createMitigationSchema.parse(req.body);
  const { picId, riskId, ...rest } = body;

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
  await riskService.deleteMitigation(id);
  res.json({ success: true, message: 'Mitigation deleted' });
});
