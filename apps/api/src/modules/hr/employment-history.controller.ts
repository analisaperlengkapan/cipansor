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
      // In Express 5, req.body is not automatically validated against schema unless middleware is used
      // But here we are manually parsing. The issue might be that req.body is treated as 'any' or 'unknown'
      // and TS infers properties are optional in source but required in target.
      // We will cast to any first to satisfy the parser input, then result is typed.
      const payload = req.body as any;

      // Ensure userId is present if not in body (e.g. from params or auth context if needed)
      // But schema requires userId in body. Assuming client sends it.

      const data = createHistorySchema.parse(payload);
      const result = await employmentHistoryService.create(data);
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
