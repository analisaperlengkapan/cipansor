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

const PRIVILEGED_ROLES: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN];

function isPrivileged(role?: UserRole): boolean {
  return role ? PRIVILEGED_ROLES.includes(role) : false;
}

// ==================== PLANS ====================

export const listPlans = asyncHandler(async (req: Request, res: Response) => {
  const unitId = req.user?.unitId;
  const isPrivilegedUser = isPrivileged(req.user?.role);

  if (!unitId && !isPrivilegedUser) throw Errors.unauthorized('Unit ID required');

  const targetUnitId = isPrivilegedUser && (req.query as any).unitId ? String((req.query as any).unitId) : unitId;
  if (!targetUnitId) throw Errors.badRequest('Unit ID required');

  const query = listPlanQuerySchema.parse({
    type: (req.query as any).type,
    status: (req.query as any).status,
  });

  const plans = await perencanaanService.getPlans(targetUnitId, query);
  res.json({ success: true, data: plans });
});

export const getPlan = asyncHandler(async (req: Request, res: Response) => {
  // Lightweight auth check first to avoid expensive journal aggregation for unauthorized users
  const planAuth = await perencanaanService.getPlanForAuth((req.params as any).id);
  if (!planAuth) throw Errors.notFound('Plan not found');

  if (!isPrivileged(req.user?.role) && planAuth.unitId !== req.user?.unitId) {
    throw Errors.forbidden('Access denied');
  }

  const plan = await perencanaanService.getPlanById((req.params as any).id);
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
  });

  res.status(201).json({ success: true, data: plan });
});

export const updatePlan = asyncHandler(async (req: Request, res: Response) => {
  const existing = await perencanaanService.getPlanForAuth((req.params as any).id);
  if (!existing) throw Errors.notFound('Plan not found');

  if (!isPrivileged(req.user?.role) && existing.unitId !== req.user?.unitId) {
    throw Errors.forbidden('Access denied');
  }

  const body = updatePlanSchema.parse(req.body);
  const { unitId: _, ...updateData } = body;

  const plan = await perencanaanService.updatePlan((req.params as any).id, updateData);
  res.json({ success: true, data: plan });
});

export const approvePlan = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) throw Errors.unauthorized('User context missing');

  if (!isPrivileged(req.user?.role)) throw Errors.forbidden('Only admins can approve plans');

  const plan = await perencanaanService.approvePlan((req.params as any).id, userId);
  res.json({ success: true, data: plan });
});

export const deletePlan = asyncHandler(async (req: Request, res: Response) => {
  const existing = await perencanaanService.getPlanForAuth((req.params as any).id);
  if (!existing) throw Errors.notFound('Plan not found');

  if (!isPrivileged(req.user?.role) && existing.unitId !== req.user?.unitId) {
    throw Errors.forbidden('Access denied');
  }

  await perencanaanService.deletePlan((req.params as any).id);
  res.json({ success: true, message: 'Plan deleted' });
});

// ==================== OBJECTIVES ====================

export const createObjective = asyncHandler(async (req: Request, res: Response) => {
  const body = createObjectiveSchema.parse(req.body);
  const objective = await perencanaanService.createObjective(body);
  res.status(201).json({ success: true, data: objective });
});

export const updateObjective = asyncHandler(async (req: Request, res: Response) => {
  const body = updateObjectiveSchema.parse(req.body);
  const objective = await perencanaanService.updateObjective((req.params as any).id, body);
  res.json({ success: true, data: objective });
});

export const deleteObjective = asyncHandler(async (req: Request, res: Response) => {
  await perencanaanService.deleteObjective((req.params as any).id);
  res.json({ success: true, message: 'Objective deleted' });
});

// ==================== INDICATORS ====================

export const createIndicator = asyncHandler(async (req: Request, res: Response) => {
  const body = createIndicatorSchema.parse(req.body);
  const indicator = await perencanaanService.createIndicator(body);
  res.status(201).json({ success: true, data: indicator });
});

export const updateIndicator = asyncHandler(async (req: Request, res: Response) => {
  const body = updateIndicatorSchema.parse(req.body);
  const indicator = await perencanaanService.updateIndicator((req.params as any).id, body);
  res.json({ success: true, data: indicator });
});

export const deleteIndicator = asyncHandler(async (req: Request, res: Response) => {
  await perencanaanService.deleteIndicator((req.params as any).id);
  res.json({ success: true, message: 'Indicator deleted' });
});

// ==================== ACTIVITIES ====================

export const createActivity = asyncHandler(async (req: Request, res: Response) => {
  const body = createActivitySchema.parse(req.body);
  const activity = await perencanaanService.createActivity(body);
  res.status(201).json({ success: true, data: activity });
});

export const updateActivity = asyncHandler(async (req: Request, res: Response) => {
  const body = updateActivitySchema.parse(req.body);
  const activity = await perencanaanService.updateActivity((req.params as any).id, body);
  res.json({ success: true, data: activity });
});

export const deleteActivity = asyncHandler(async (req: Request, res: Response) => {
  await perencanaanService.deleteActivity((req.params as any).id);
  res.json({ success: true, message: 'Activity deleted' });
});
