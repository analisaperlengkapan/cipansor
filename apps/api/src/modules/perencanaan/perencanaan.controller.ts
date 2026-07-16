import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error';
import { Errors } from '@/middleware/error';
import { perencanaanService } from './perencanaan.service';
import {
  createPlanSchema,
  updatePlanSchema,
  createObjectiveSchema,
  updateObjectiveSchema,
  createIndicatorSchema,
  updateIndicatorSchema,
  createActivitySchema,
  updateActivitySchema,
  listPlanQuerySchema,
} from './perencanaan.validation';
import { UserRole } from '@prisma/client';

const PRIVILEGED_ROLES: string[] = [UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN];

function isPrivileged(role?: string): boolean {
  return role ? PRIVILEGED_ROLES.includes(role) : false;
}

// ==================== PLANS ====================

export const listPlans = asyncHandler(async (req: Request, res: Response) => {
  const unitId = req.user?.unitId;
  const isPrivilegedUser = isPrivileged(req.user?.role);

  if (!unitId && !isPrivilegedUser) throw Errors.unauthorized('Unit ID required');

  const targetUnitId = isPrivilegedUser && req.query.unitId ? String(req.query.unitId) : unitId;
  if (!targetUnitId) throw Errors.badRequest('Unit ID required');

  const query = listPlanQuerySchema.parse({
    type: req.query.type,
    status: req.query.status,
  });

  const plans = await perencanaanService.getPlans(targetUnitId, {
    ...query,
    collaboratorId: req.user?.sub,
  });
  res.json({ success: true, data: plans });
});

export const getPlanRealizationTrend = asyncHandler(async (req: Request, res: Response) => {
  const planAuth = await perencanaanService.getPlanForAuth(req.params.id);
  if (!planAuth) throw Errors.notFound('Plan not found');
  if (!isPrivileged(req.user?.role) && planAuth.unitId !== req.user?.unitId) {
    throw Errors.forbidden('Access denied');
  }

  const trend = await perencanaanService.getPlanRealizationTrend(req.params.id);
  if (!trend) throw Errors.notFound('Plan not found');
  res.json({ success: true, data: trend });
});

export const getPlan = asyncHandler(async (req: Request, res: Response) => {
  // Lightweight auth check first to avoid expensive journal aggregation for unauthorized users
  const planAuth = await perencanaanService.getPlanForAuth(req.params.id);
  if (!planAuth) throw Errors.notFound('Plan not found');

  if (!isPrivileged(req.user?.role) && planAuth.unitId !== req.user?.unitId) {
    throw Errors.forbidden('Access denied');
  }

  const plan = await perencanaanService.getPlanById(req.params.id);
  if (!plan) throw Errors.notFound('Plan not found');

  res.json({ success: true, data: plan });
});

export const createPlan = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) throw Errors.unauthorized('User context missing');

  const body = createPlanSchema.parse(req.body);
  let targetUnitId = req.user?.unitId;

  if (!targetUnitId) {
    if (isPrivileged(req.user?.role) && body.unitId) {
      targetUnitId = body.unitId;
    } else {
      throw Errors.badRequest('Unit ID is required');
    }
  }

  const plan = await perencanaanService.createPlan({
    ...body,
    unitId: targetUnitId,
    createdById: userId,
  } as Parameters<typeof perencanaanService.createPlan>[0]);

  res.status(201).json({ success: true, data: plan });
});

export const updatePlan = asyncHandler(async (req: Request, res: Response) => {
  const existing = await perencanaanService.getPlanForAuth(req.params.id);
  if (!existing) throw Errors.notFound('Plan not found');

  if (!isPrivileged(req.user?.role) && existing.unitId !== req.user?.unitId) {
    throw Errors.forbidden('Access denied');
  }

  const body = updatePlanSchema.parse(req.body);
  const { unitId: _, ...updateData } = body;

  const plan = await perencanaanService.updatePlan(req.params.id, updateData);
  res.json({ success: true, data: plan });
});

export const approvePlan = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) throw Errors.unauthorized('User context missing');

  if (!isPrivileged(req.user?.role)) throw Errors.forbidden('Only admins can approve plans');

  const plan = await perencanaanService.approvePlan(req.params.id, userId);
  res.json({ success: true, data: plan });
});

export const deletePlan = asyncHandler(async (req: Request, res: Response) => {
  const existing = await perencanaanService.getPlanForAuth(req.params.id);
  if (!existing) throw Errors.notFound('Plan not found');

  if (!isPrivileged(req.user?.role) && existing.unitId !== req.user?.unitId) {
    throw Errors.forbidden('Access denied');
  }

  await perencanaanService.deletePlan(req.params.id);
  res.json({ success: true, message: 'Plan deleted' });
});

// ==================== OBJECTIVES ====================

export const createObjective = asyncHandler(async (req: Request, res: Response) => {
  const body = createObjectiveSchema.parse(req.body);
  const objective = await perencanaanService.createObjective(body as Parameters<typeof perencanaanService.createObjective>[0]);
  res.status(201).json({ success: true, data: objective });
});

export const updateObjective = asyncHandler(async (req: Request, res: Response) => {
  const body = updateObjectiveSchema.parse(req.body);
  const objective = await perencanaanService.updateObjective(req.params.id, body);
  res.json({ success: true, data: objective });
});

export const deleteObjective = asyncHandler(async (req: Request, res: Response) => {
  await perencanaanService.deleteObjective(req.params.id);
  res.json({ success: true, message: 'Objective deleted' });
});

// ==================== INDICATORS ====================

export const createIndicator = asyncHandler(async (req: Request, res: Response) => {
  const body = createIndicatorSchema.parse(req.body);
  const indicator = await perencanaanService.createIndicator(body as Parameters<typeof perencanaanService.createIndicator>[0]);
  res.status(201).json({ success: true, data: indicator });
});

export const updateIndicator = asyncHandler(async (req: Request, res: Response) => {
  const body = updateIndicatorSchema.parse(req.body);
  const indicator = await perencanaanService.updateIndicator(req.params.id, body);
  res.json({ success: true, data: indicator });
});

export const deleteIndicator = asyncHandler(async (req: Request, res: Response) => {
  await perencanaanService.deleteIndicator(req.params.id);
  res.json({ success: true, message: 'Indicator deleted' });
});

// ==================== ACTIVITIES ====================

export const createActivity = asyncHandler(async (req: Request, res: Response) => {
  const body = createActivitySchema.parse(req.body);
  const activity = await perencanaanService.createActivity(body as Parameters<typeof perencanaanService.createActivity>[0]);
  res.status(201).json({ success: true, data: activity });
});

export const updateActivity = asyncHandler(async (req: Request, res: Response) => {
  const body = updateActivitySchema.parse(req.body);
  const activity = await perencanaanService.updateActivity(req.params.id, body);
  res.json({ success: true, data: activity });
});

export const deleteActivity = asyncHandler(async (req: Request, res: Response) => {
  await perencanaanService.deleteActivity(req.params.id);
  res.json({ success: true, message: 'Activity deleted' });
});

// ==================== COLLABORATION ====================

export const addCollaborator = asyncHandler(async (req: Request, res: Response) => {
  const callerId = req.user?.sub;
  if (!callerId) throw Errors.unauthorized();
  const { userId } = req.body as { userId?: string };
  if (!userId) throw Errors.badRequest('User ID is required');

  const collaborator = await perencanaanService.addCollaborator(
    req.params.id,
    userId,
    callerId,
    isPrivileged(req.user?.role)
  );
  res.status(201).json({ success: true, data: collaborator });
});

export const removeCollaborator = asyncHandler(async (req: Request, res: Response) => {
  const callerId = req.user?.sub;
  if (!callerId) throw Errors.unauthorized();

  await perencanaanService.removeCollaborator(
    req.params.id,
    req.params.userId,
    callerId,
    isPrivileged(req.user?.role)
  );
  res.json({ success: true, message: 'Collaborator removed' });
});
