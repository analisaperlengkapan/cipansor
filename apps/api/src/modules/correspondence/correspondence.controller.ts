import { Router, Request, Response, NextFunction } from 'express';
import { CorrespondenceService } from './correspondence.service';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { validate } from '@/middleware/validate';
import { Errors } from '@/middleware/error';

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
      let unitId = req.user?.unitId;

      // Allow SUPER_ADMIN to query specific unit, otherwise require unitId
      if (!unitId) {
        if (req.user?.role === UserRole.SUPER_ADMIN) {
          unitId = (req.query as any).unitId as string;
        } else {
          throw Errors.forbidden('Access denied: User has no unit assigned');
        }
      }

      if (!unitId) throw new Error('Unit ID is required');

      const result = await CorrespondenceService.getLetters(unitId, {
        page: Number((req.query as any).page),
        limit: Number((req.query as any).limit),
        direction: (req.query as any).direction as any,
        status: (req.query as any).status as any,
        search: (req.query as any).search as string,
        scope: (req.query as any).scope as any,
        userId: req.user!.id,
      });
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async findOne(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CorrespondenceService.getLetterById((req.params as any).id);
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
        (req.params as any).id,
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
        (req.params as any).id,
        status,
        notes,
        req.user!.id
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      let unitId = req.user?.unitId;

      // Allow SUPER_ADMIN to query specific unit, otherwise require unitId
      if (!unitId) {
        if (req.user?.role === UserRole.SUPER_ADMIN) {
          unitId = (req.query as any).unitId as string;
        } else {
          throw Errors.forbidden('Access denied: User has no unit assigned');
        }
      }

      if (!unitId) throw new Error('Unit ID is required');

      const result = await CorrespondenceService.getDashboardStats(unitId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
