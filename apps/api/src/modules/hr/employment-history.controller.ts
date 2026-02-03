import { Request, Response, NextFunction } from 'express';
import { employmentHistoryService } from './employment-history.service';
import { z } from 'zod';
import { EmploymentAction } from '@prisma/client';

const createHistorySchema = z.object({
  userId: z.string().uuid(),
  action: z.nativeEnum(EmploymentAction),
  previousPosition: z.string().optional(),
  newPosition: z.string().min(1),
  previousDepartment: z.string().optional(),
  newDepartment: z.string().optional(),
  effectiveDate: z.coerce.date(),
  notes: z.string().optional(),
});

export const employmentHistoryController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createHistorySchema.parse(req.body);
      const createInput = {
        userId: data.userId,
        action: data.action,
        previousPosition: data.previousPosition,
        newPosition: data.newPosition,
        previousDepartment: data.previousDepartment,
        newDepartment: data.newDepartment,
        effectiveDate: data.effectiveDate,
        notes: data.notes,
      };
      const result = await employmentHistoryService.create(createInput);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const result = await employmentHistoryService.findAll(userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
