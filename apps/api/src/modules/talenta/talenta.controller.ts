import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error';
import { Errors } from '@/middleware/error';
import { talentaService } from './talenta.service';
import {
  createTalentProfileSchema,
  updateTalentProfileSchema,
  createAssessmentSchema,
  createTrainingSchema,
  updateTrainingSchema,
  enrollTrainingSchema,
  createSuccessionSchema,
  updateSuccessionSchema,
} from './talenta.validation';
import { UserRole } from '@prisma/client';

const PRIVILEGED_ROLES: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN];
function isPrivileged(role?: UserRole): boolean {
  return role ? PRIVILEGED_ROLES.includes(role) : false;
}

function resolveUnitId(req: Request, bodyUnitId?: string): string {
  // Only SUPER_ADMIN can arbitrarily override unitId. UNIT_ADMIN is restricted to their own.
  if (req.user?.role === UserRole.SUPER_ADMIN && bodyUnitId) {
    return bodyUnitId;
  }

  // Otherwise default to their assigned unit
  const unitId = req.user?.unitId;
  if (!unitId) {
    // If they have no unitId but are privileged, they must supply one
    if (isPrivileged(req.user?.role) && bodyUnitId) return bodyUnitId;
    throw Errors.badRequest('Unit ID is required');
  }
  return unitId;
}

// ==================== PROFILES ====================

export const listProfiles = asyncHandler(async (req: Request, res: Response) => {
  const unitId = resolveUnitId(req, req.query.unitId as string);
  const profiles = await talentaService.getProfiles(unitId, {
    category: req.query.category as string,
  });
  res.json({ success: true, data: profiles });
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await talentaService.getProfileById(req.params.id);
  if (!profile) throw Errors.notFound('Talent profile not found');
  if (!isPrivileged(req.user?.role) && profile.unitId !== req.user?.unitId) throw Errors.forbidden('Access denied');
  res.json({ success: true, data: profile });
});

export const createProfile = asyncHandler(async (req: Request, res: Response) => {
  const body = createTalentProfileSchema.parse(req.body);
  const unitId = resolveUnitId(req, body.unitId);
  const profile = await talentaService.createProfile({ ...body, unitId, userId: body.userId as string, currentRole: body.currentRole as string });
  res.status(201).json({ success: true, data: profile });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const existing = await talentaService.getProfileById(req.params.id);
  if (!existing) throw Errors.notFound('Talent profile not found');
  if (!isPrivileged(req.user?.role) && existing.unitId !== req.user?.unitId) throw Errors.forbidden('Access denied');
  const body = updateTalentProfileSchema.parse(req.body);
  const profile = await talentaService.updateProfile(req.params.id, body);
  res.json({ success: true, data: profile });
});

export const deleteProfile = asyncHandler(async (req: Request, res: Response) => {
  const existing = await talentaService.getProfileById(req.params.id);
  if (!existing) throw Errors.notFound('Talent profile not found');
  if (!isPrivileged(req.user?.role) && existing.unitId !== req.user?.unitId) throw Errors.forbidden('Access denied');
  await talentaService.deleteProfile(req.params.id);
  res.json({ success: true, message: 'Talent profile deleted' });
});

// ==================== ASSESSMENTS ====================

export const createAssessment = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) throw Errors.unauthorized('User context missing');
  const body = createAssessmentSchema.parse(req.body);
  const assessment = await talentaService.createAssessment({ ...body, assessorId: userId });
  res.status(201).json({ success: true, data: assessment });
});

// ==================== TRAINING ====================

export const listTrainings = asyncHandler(async (req: Request, res: Response) => {
  const unitId = resolveUnitId(req, req.query.unitId as string);
  const trainings = await talentaService.getTrainings(unitId, {
    status: req.query.status as string,
  });
  res.json({ success: true, data: trainings });
});

export const getTraining = asyncHandler(async (req: Request, res: Response) => {
  const training = await talentaService.getTrainingById(req.params.id);
  if (!training) throw Errors.notFound('Training program not found');
  res.json({ success: true, data: training });
});

export const createTraining = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) throw Errors.unauthorized('User context missing');
  const body = createTrainingSchema.parse(req.body);
  const unitId = resolveUnitId(req, body.unitId);
  const training = await talentaService.createTraining({ ...body, unitId, createdById: userId });
  res.status(201).json({ success: true, data: training });
});

export const updateTraining = asyncHandler(async (req: Request, res: Response) => {
  const body = updateTrainingSchema.parse(req.body);
  const training = await talentaService.updateTraining(req.params.id, body);
  res.json({ success: true, data: training });
});

export const deleteTraining = asyncHandler(async (req: Request, res: Response) => {
  await talentaService.deleteTraining(req.params.id);
  res.json({ success: true, message: 'Training program deleted' });
});

export const enrollTraining = asyncHandler(async (req: Request, res: Response) => {
  const body = enrollTrainingSchema.parse(req.body);
  const enrollment = await talentaService.enrollUser(body.programId, body.userId);
  res.status(201).json({ success: true, data: enrollment });
});

// ==================== SUCCESSION ====================

export const listSuccessions = asyncHandler(async (req: Request, res: Response) => {
  const unitId = resolveUnitId(req, req.query.unitId as string);
  const successions = await talentaService.getSuccessions(unitId);
  res.json({ success: true, data: successions });
});

export const createSuccession = asyncHandler(async (req: Request, res: Response) => {
  const body = createSuccessionSchema.parse(req.body);
  const unitId = resolveUnitId(req, body.unitId);
  const succession = await talentaService.createSuccession({ ...body, unitId });
  res.status(201).json({ success: true, data: succession });
});

export const updateSuccession = asyncHandler(async (req: Request, res: Response) => {
  const existing = await talentaService.getSuccessionById(req.params.id);
  if (!existing) throw Errors.notFound('Succession plan not found');
  if (!isPrivileged(req.user?.role) && existing.unitId !== req.user?.unitId) {
    throw Errors.forbidden('Access denied');
  }

  const body = updateSuccessionSchema.parse(req.body);
  const succession = await talentaService.updateSuccession(req.params.id, body);
  res.json({ success: true, data: succession });
});

export const deleteSuccession = asyncHandler(async (req: Request, res: Response) => {
  const existing = await talentaService.getSuccessionById(req.params.id);
  if (!existing) throw Errors.notFound('Succession plan not found');
  if (!isPrivileged(req.user?.role) && existing.unitId !== req.user?.unitId) {
    throw Errors.forbidden('Access denied');
  }

  await talentaService.deleteSuccession(req.params.id);
  res.json({ success: true, message: 'Succession plan deleted' });
});
