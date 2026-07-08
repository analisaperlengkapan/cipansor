import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error';
import { Errors } from '@/middleware/error';
import { evaluationService } from './evaluation.service';
import {
  createEvaluationSchema,
  updateIndicatorRealizationSchema,
  updateBehaviorScoreSchema,
  updateEvaluationSchema,
  createBehavioralValueSchema,
} from './evaluation.validation';

// Evaluations

export const createEvaluation = asyncHandler(async (req: Request, res: Response) => {
  const body = createEvaluationSchema.parse(req.body);
  const evaluation = await evaluationService.createEvaluation(body);
  res.status(201).json({ success: true, data: evaluation });
});

export const getEvaluation = asyncHandler(async (req: Request, res: Response) => {
  const evaluation = await evaluationService.getEvaluationById(req.params.id);
  if (!evaluation) throw Errors.notFound('Evaluation not found');
  res.json({ success: true, data: evaluation });
});

export const updateIndicatorRealization = asyncHandler(async (req: Request, res: Response) => {
  const body = updateIndicatorRealizationSchema.parse(req.body);
  const detail = await evaluationService.updateIndicatorRealization(
    req.params.id,
    body.indicatorId,
    { realization: body.realization, activities: body.activities }
  );
  res.json({ success: true, data: detail });
});

export const updateBehaviorScore = asyncHandler(async (req: Request, res: Response) => {
  const body = updateBehaviorScoreSchema.parse(req.body);
  const detail = await evaluationService.updateBehaviorScore(
    req.params.id,
    body.behaviorValueId,
    { score: body.score, notes: body.notes }
  );
  res.json({ success: true, data: detail });
});

export const approveEvaluation = asyncHandler(async (req: Request, res: Response) => {
  const evaluation = await evaluationService.approveEvaluation(req.params.id);
  res.json({ success: true, data: evaluation });
});

// Behavioral Values (Admin)

export const listBehavioralValues = asyncHandler(async (req: Request, res: Response) => {
  const values = await evaluationService.getBehavioralValues();
  res.json({ success: true, data: values });
});

export const createBehavioralValue = asyncHandler(async (req: Request, res: Response) => {
  const body = createBehavioralValueSchema.parse(req.body);
  const value = await evaluationService.createBehavioralValue(body);
  res.status(201).json({ success: true, data: value });
});

export const updateBehavioralValue = asyncHandler(async (req: Request, res: Response) => {
  const value = await evaluationService.updateBehavioralValue(req.params.id, req.body);
  res.json({ success: true, data: value });
});

export const deleteBehavioralValue = asyncHandler(async (req: Request, res: Response) => {
  await evaluationService.deleteBehavioralValue(req.params.id);
  res.json({ success: true, message: 'Value deactivated' });
});
