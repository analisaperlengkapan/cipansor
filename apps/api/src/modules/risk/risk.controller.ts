import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error';
import { Errors } from '@/middleware/error';
import { riskService } from './risk.service';
import { createRiskSchema, updateRiskSchema, createMitigationSchema, updateMitigationSchema, listRiskQuerySchema } from './risk.validation';
import { UserRole } from '@prisma/client';

const PRIVILEGED_ROLES: string[] = [
  UserRole.SUPER_ADMIN,
  'YAYASAN_ADMIN',
  'YAYASAN_KETUA'
];

function isPrivileged(role?: UserRole | string): boolean {
  return role ? PRIVILEGED_ROLES.includes(role) : false;
}

export const listRisks = asyncHandler(async (req: Request, res: Response) => {
  const unitId = req.user?.unitId;
  const isPrivilegedUser = isPrivileged(req.user?.role);

  if (!unitId && !isPrivilegedUser) throw Errors.unauthorized('Unit ID required');

  const targetUnitId = (isPrivilegedUser && req.query.unitId)
    ? String(req.query.unitId)
    : unitId;

  if (!targetUnitId) throw Errors.badRequest('Unit ID required');

  // Validate query parameters to prevent 500 errors on invalid enums
  const query = listRiskQuerySchema.parse({
    category: req.query.category,
    riskLevel: req.query.riskLevel,
    unitId: targetUnitId
  });

  const risks = await riskService.getRisks(targetUnitId, query);
  res.json({ success: true, data: risks });
});

export const getRisk = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const risk = await riskService.getRiskById(id);

  if (!risk) {
    throw Errors.notFound('Risk not found');
  }

  // Authorization Check
  if (!isPrivileged(req.user?.role) && risk.unitId !== req.user?.unitId) {
    throw Errors.forbidden('Access denied');
  }

  res.json({ success: true, data: risk });
});

export const createRisk = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) throw Errors.unauthorized('User context missing');

  // Handle unitId resolution:
  // 1. From User context (default)
  // 2. From Request body (for SUPER_ADMIN/YAYASAN without unitId)
  const body = createRiskSchema.parse(req.body);
  let targetUnitId = req.user?.unitId;

  if (!targetUnitId) {
    if (isPrivileged(req.user?.role) && body.unitId) {
      targetUnitId = body.unitId;
    } else {
      throw Errors.badRequest('Unit ID is required');
    }
  }

  // Destructure to remove unitId from spread, preventing Prisma conflict
  const { unitId: _, ...rest } = body;

  // Calculate risk score and level
  // Mapping enums to values is needed. Assuming direct mapping isn't available, we use helpers or switch.
  // For now, simple mapping based on enum keys (assuming they are ordered or we use a map)
  // Or better, let the service handle it? If service expects RiskCreateInput, we must provide it.

  // Quick map for calculation (Adjust values as per business logic)
  const likelihoodMap: Record<string, number> = { RARE: 1, UNLIKELY: 2, POSSIBLE: 3, LIKELY: 4, ALMOST_CERTAIN: 5 };
  const impactMap: Record<string, number> = { INSIGNIFICANT: 1, MINOR: 2, MODERATE: 3, MAJOR: 4, CATASTROPHIC: 5 };

  const likelihoodVal = likelihoodMap[rest.likelihood] || 1;
  const impactVal = impactMap[rest.impact] || 1;
  const riskScore = likelihoodVal * impactVal;

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' = 'LOW';
  if (riskScore >= 15) riskLevel = 'EXTREME';
  else if (riskScore >= 10) riskLevel = 'HIGH';
  else if (riskScore >= 5) riskLevel = 'MEDIUM';

  const risk = await riskService.createRisk({
    ...rest,
    description: rest.description || '', // Ensure description
    code: `RISK-${Date.now()}`,
    riskScore,
    riskLevel,
    unit: { connect: { id: targetUnitId } },
    createdBy: { connect: { id: userId } },
  });

  res.status(201).json({ success: true, data: risk });
});

export const updateRisk = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const existingRisk = await riskService.getRiskById(id);
  if (!existingRisk) throw Errors.notFound('Risk not found');

  if (!isPrivileged(req.user?.role) && existingRisk.unitId !== req.user?.unitId) {
    throw Errors.forbidden('Access denied');
  }

  const body = updateRiskSchema.parse(req.body);

  // Destructure unitId to prevent unauthorized modification of the risk's unit
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { unitId: _, ...updateData } = body;

  const risk = await riskService.updateRisk(id, updateData);
  res.json({ success: true, data: risk });
});

export const deleteRisk = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const existingRisk = await riskService.getRiskById(id);
  if (!existingRisk) throw Errors.notFound('Risk not found');

  if (!isPrivileged(req.user?.role) && existingRisk.unitId !== req.user?.unitId) {
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

  if (!isPrivileged(req.user?.role) && risk.unitId !== req.user?.unitId) {
    throw Errors.forbidden('Access denied');
  }

  const mitigation = await riskService.createMitigation({
    ...rest,
    actionPlan: rest.actionPlan || '', // Ensure actionPlan
    strategy: rest.strategy!,
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

  if (!isPrivileged(req.user?.role) && existingMitigation.risk.unitId !== req.user?.unitId) {
    throw Errors.forbidden('Access denied');
  }

  const body = updateMitigationSchema.parse(req.body);
  const { picId, ...rest } = body;

  const data: any = { ...rest };
  if (picId) {
    data.pic = { connect: { id: picId } };
  } else if (picId === null) {
    // Explicitly null means disconnect
    data.pic = { disconnect: true };
  }

  const mitigation = await riskService.updateMitigation(id, data);

  res.json({ success: true, data: mitigation });
});

export const deleteMitigation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Verify Mitigation Ownership via Risk
  const existingMitigation = await riskService.getMitigationById(id);
  if (!existingMitigation) throw Errors.notFound('Mitigation not found');

  if (!isPrivileged(req.user?.role) && existingMitigation.risk.unitId !== req.user?.unitId) {
    throw Errors.forbidden('Access denied');
  }

  await riskService.deleteMitigation(id);
  res.json({ success: true, message: 'Mitigation deleted' });
});
