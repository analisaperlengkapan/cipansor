import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error';
import { Errors } from '@/middleware/error';
import { riskService } from './risk.service';
import { createRiskSchema, updateRiskSchema, createMitigationSchema, updateMitigationSchema, listRiskQuerySchema } from './risk.validation';
import { UserRole, RiskLikelihood, RiskImpact, RiskLevel } from '@prisma/client';

// Only use roles that exist in the UserRole enum
const PRIVILEGED_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.UNIT_ADMIN, // Added UNIT_ADMIN as privileged for unit-scoped operations
];

function isPrivileged(role?: UserRole): boolean {
  return role ? PRIVILEGED_ROLES.includes(role) : false;
}

const RISK_LIKELIHOOD_MAP: Record<string, number> = {
  RARE: 1, UNLIKELY: 2, POSSIBLE: 3, LIKELY: 4, ALMOST_CERTAIN: 5
};
const RISK_IMPACT_MAP: Record<string, number> = {
  INSIGNIFICANT: 1, MINOR: 2, MODERATE: 3, MAJOR: 4, CATASTROPHIC: 5
};

const calculateRisk = (likelihood: RiskLikelihood, impact: RiskImpact) => {
  const l = RISK_LIKELIHOOD_MAP[likelihood] || 0;
  const i = RISK_IMPACT_MAP[impact] || 0;
  const score = l * i;
  let level = RiskLevel.LOW;
  if (score >= 16) level = RiskLevel.EXTREME;
  else if (score >= 10) level = RiskLevel.HIGH;
  else if (score >= 5) level = RiskLevel.MEDIUM;
  return { riskScore: score, riskLevel: level };
};

export const listRisks = asyncHandler(async (req: Request, res: Response) => {
  const unitId = req.user?.unitId;
  const isPrivilegedUser = isPrivileged(req.user?.role);

  if (!unitId && !isPrivilegedUser) throw Errors.unauthorized('Unit ID required');

  const targetUnitId = (isPrivilegedUser && req.query.unitId)
    ? String(req.query.unitId)
    : unitId;

  if (!targetUnitId) throw Errors.badRequest('Unit ID required');

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

  if (!isPrivileged(req.user?.role) && risk.unitId !== req.user?.unitId) {
    throw Errors.forbidden('Access denied');
  }

  res.json({ success: true, data: risk });
});

export const createRisk = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) throw Errors.unauthorized('User context missing');

  const body = createRiskSchema.parse(req.body);
  let targetUnitId = req.user?.unitId;

  if (!targetUnitId) {
    if (isPrivileged(req.user?.role) && body.unitId) {
      targetUnitId = body.unitId;
    } else {
      throw Errors.badRequest('Unit ID is required');
    }
  }

  const { unitId: _, ...rest } = body;

  // Calculate Score & Level
  const { riskScore, riskLevel } = calculateRisk(rest.likelihood, rest.impact);

  const risk = await riskService.createRisk({
    ...rest,
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
  const { unitId: _, ...updateData } = body;

  // Recalculate if likelihood or impact changes
  let calculated: { riskScore?: number, riskLevel?: RiskLevel } = {};
  if (updateData.likelihood || updateData.impact) {
    const l = updateData.likelihood || existingRisk.likelihood;
    const i = updateData.impact || existingRisk.impact;
    calculated = calculateRisk(l, i);
  }

  const risk = await riskService.updateRisk(id, {
    ...updateData,
    ...calculated
  });
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

  const risk = await riskService.getRiskById(riskId);
  if (!risk) throw Errors.notFound('Risk not found');

  if (!isPrivileged(req.user?.role) && risk.unitId !== req.user?.unitId) {
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
    data.pic = { disconnect: true };
  }

  const mitigation = await riskService.updateMitigation(id, data);

  res.json({ success: true, data: mitigation });
});

export const deleteMitigation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const existingMitigation = await riskService.getMitigationById(id);
  if (!existingMitigation) throw Errors.notFound('Mitigation not found');

  if (!isPrivileged(req.user?.role) && existingMitigation.risk.unitId !== req.user?.unitId) {
    throw Errors.forbidden('Access denied');
  }

  await riskService.deleteMitigation(id);
  res.json({ success: true, message: 'Mitigation deleted' });
});
