import { Router, Request, Response, NextFunction } from 'express';
import { CorrespondenceService } from './correspondence.service';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { validate } from '@/middleware/validate';

export const CorrespondenceController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CorrespondenceService.createLetter(req.body, req.user!.id);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const unitId = req.query.unitId as string;
      if (!unitId) throw new Error('Unit ID is required');

      const result = await CorrespondenceService.getLetters(unitId, {
        page: Number(req.query.page),
        limit: Number(req.query.limit),
        direction: req.query.direction as any,
        status: req.query.status as any,
        search: req.query.search as string,
        scope: req.query.scope as any,
        userId: req.user!.id,
      });
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async findOne(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CorrespondenceService.getLetterById(req.params.id);
      if (!result) throw new Error('Letter not found');
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async review(req: Request, res: Response, next: NextFunction) {
    try {
      const { action, notes } = req.body;
      const result = await CorrespondenceService.processReview(
        req.params.id,
        req.user!.id,
        action,
        notes
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async createDisposition(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CorrespondenceService.createDisposition({
        ...req.body,
        senderId: req.user!.id,
      });
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async updateDispositionStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, notes } = req.body;
      const result = await CorrespondenceService.updateDispositionStatus(
        req.params.id,
        status,
        notes,
        req.user!.id
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
