import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error';
import { Errors } from '@/middleware/error';
import { pkService } from './pk.service';
import {
  createPKSchema,
  updatePKSchema,
  createPKIndicatorSchema,
  updatePKIndicatorSchema,
} from './pk.validation';

export const listPKs = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) throw Errors.unauthorized();

  const pks = await pkService.getPKs(userId, { status: req.query.status as string });
  res.json({ success: true, data: pks });
});

export const getPK = asyncHandler(async (req: Request, res: Response) => {
  const pk = await pkService.getPKById(req.params.id);
  if (!pk) throw Errors.notFound('PK not found');

  // Auth check: user or supervisor
  if (pk.userId !== req.user?.sub && pk.supervisorId !== req.user?.sub) {
    throw Errors.forbidden();
  }

  res.json({ success: true, data: pk });
});

export const createPK = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) throw Errors.unauthorized();

  const body = createPKSchema.parse(req.body);
  const pk = await pkService.createPK({
    ...body,
    userId,
  });

  res.status(201).json({ success: true, data: pk });
});

export const updatePK = asyncHandler(async (req: Request, res: Response) => {
  const body = updatePKSchema.parse(req.body);
  const pk = await pkService.updatePK(req.params.id, body);
  res.json({ success: true, data: pk });
});

export const proposePK = asyncHandler(async (req: Request, res: Response) => {
  const pk = await pkService.proposePK(req.params.id);
  res.json({ success: true, data: pk });
});

export const approvePK = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) throw Errors.unauthorized();

  const pk = await pkService.approvePK(req.params.id, userId);
  res.json({ success: true, data: pk });
});

// Indicators

export const createIndicator = asyncHandler(async (req: Request, res: Response) => {
  const body = createPKIndicatorSchema.parse(req.body);
  const indicator = await pkService.createIndicator(body);
  res.status(201).json({ success: true, data: indicator });
});

export const updateIndicator = asyncHandler(async (req: Request, res: Response) => {
  const body = updatePKIndicatorSchema.parse(req.body);
  const indicator = await pkService.updateIndicator(req.params.id, body);
  res.json({ success: true, data: indicator });
});

export const deleteIndicator = asyncHandler(async (req: Request, res: Response) => {
  await pkService.deleteIndicator(req.params.id);
  res.json({ success: true, message: 'Indicator deleted' });
});
