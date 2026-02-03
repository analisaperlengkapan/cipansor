import { Request, Response, NextFunction } from 'express';
import { employeeDocumentService } from './employee-documents.service';
import { z } from 'zod';
import { EmployeeDocumentType } from '@prisma/client';

const createDocumentSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1),
  type: z.nativeEnum(EmployeeDocumentType),
  fileUrl: z.string().url(),
  expiryDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const employeeDocumentController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createDocumentSchema.parse(req.body);
      // Ensure required properties are present and match strict types
      const createInput = {
          ...data,
          userId: data.userId, // Explicitly map
          name: data.name, // Required
          type: data.type, // Required
          fileUrl: data.fileUrl, // Required
      };
      const result = await employeeDocumentService.create(createInput);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const result = await employeeDocumentService.findAll(userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await employeeDocumentService.delete(req.params.id);
      res.json({ success: true, message: 'Document deleted' });
    } catch (error) {
      next(error);
    }
  },
};
