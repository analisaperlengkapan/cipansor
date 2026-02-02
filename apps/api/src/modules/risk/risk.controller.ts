import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error';
import { Errors } from '@/middleware/error';
import { riskService } from './risk.service';
import { createRiskSchema, updateRiskSchema, createMitigationSchema, updateMitigationSchema, listRiskQuerySchema } from './risk.validation';
import { UserRole, RiskLikelihood, RiskImpact, RiskLevel } from '@prisma/client';
import { RoleCode } from '@cipansor/shared';

const PRIVILEGED_ROLES = [
  UserRole.SUPER_ADMIN,
  RoleCode.YAYASAN_ADMIN,
  RoleCode.YAYASAN_KETUA
];

function isPrivileged(role?: UserRole | string): boolean {
  return role ? (PRIVILEGED_ROLES as string[]).includes(role) : false;
}

// Helper to calculate risk score and level
function calculateRisk(likelihood: RiskLikelihood, impact: RiskImpact) {
  // Assuming enums are mapped to values or we map them here
  const likelihoodMap: Record<RiskLikelihood, number> = {
    RARE: 1, UNLIKELY: 2, POSSIBLE: 3, LIKELY: 4, ALMOST_CERTAIN: 5
  };
  const impactMap: Record<RiskImpact, number> = {
    INSIGNIFICANT: 1, MINOR: 2, MODERATE: 3, MAJOR: 4, CATASTROPHIC: 5
  };

  const score = likelihoodMap[likelihood] * impactMap[impact];

  let level: RiskLevel = RiskLevel.LOW;
  if (score >= 15) level = RiskLevel.EXTREME;
  else if (score >= 10) level = RiskLevel.HIGH;
  else if (score >= 5) level = RiskLevel.MEDIUM;

  return { riskScore: score, riskLevel: level };
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

  // Calculate Risk Score & Level
  // Cast enums to ensure type safety if Zod output implies string
  const likelihood = rest.likelihood as RiskLikelihood;
  const impact = rest.impact as RiskImpact;
  const { riskScore, riskLevel } = calculateRisk(likelihood, impact);

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

  // Destructure unitId to prevent unauthorized modification of the risk's unit
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { unitId: _, ...updateData } = body;

  // Recalculate score/level if needed
  let calculatedUpdates = {};
  if (updateData.likelihood || updateData.impact) {
      const newLikelihood = (updateData.likelihood || existingRisk.likelihood) as RiskLikelihood;
      const newImpact = (updateData.impact || existingRisk.impact) as RiskImpact;
      calculatedUpdates = calculateRisk(newLikelihood, newImpact);
  }

  const risk = await riskService.updateRisk(id, { ...updateData, ...calculatedUpdates });
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
