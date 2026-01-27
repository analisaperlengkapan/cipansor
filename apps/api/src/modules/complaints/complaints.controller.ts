import { Request, Response } from 'express';
import { complaintsService } from './complaints.service';
import { ComplaintStatus, ComplaintCategory } from '@prisma/client';
import httpStatus from 'http-status';
import { createComplaintSchema, updateComplaintStatusSchema, addCommentSchema, assignHandlerSchema } from './complaints.schema';

export const complaintsController = {
  create: async (req: Request, res: Response) => {
    try {
      const validation = createComplaintSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(httpStatus.BAD_REQUEST).json({
          message: 'Validation error',
          errors: validation.error.errors
        });
      }

      // req.user is guaranteed by authenticate middleware
      const user = (req as any).user;
      const unitId = user.unitId;

      const complaint = await complaintsService.create({
        category: validation.data.category,
        subject: validation.data.subject,
        description: validation.data.description,
        location: validation.data.location,
        isAnonymous: validation.data.isAnonymous,
        attachments: validation.data.attachments,
        userId: user.sub,
        unitId,
      });
      res.status(httpStatus.CREATED).json(complaint);
    } catch (error) {
      console.error(error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error creating complaint' });
    }
  },

  findAll: async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { status, category, page, limit } = req.query;

      const result = await complaintsService.findAll({
        unitId: user.unitId,
        userId: user.sub,
        role: user.role,
        status: status as ComplaintStatus,
        category: category as ComplaintCategory,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
      });
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error fetching complaints' });
    }
  },

  findOne: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      const complaint = await complaintsService.findOne(id, user.sub, user.role);

      if (!complaint) {
        return res.status(httpStatus.NOT_FOUND).json({ message: 'Complaint not found' });
      }

      res.json(complaint);
    } catch (error) {
      if (error instanceof Error && error.message === 'Unauthorized') {
        return res.status(httpStatus.FORBIDDEN).json({ message: 'Unauthorized' });
      }
      console.error(error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error fetching complaint' });
    }
  },

  updateStatus: async (req: Request, res: Response) => {
    try {
      const validation = updateComplaintStatusSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(httpStatus.BAD_REQUEST).json({
          message: 'Validation error',
          errors: validation.error.errors
        });
      }

      const { id } = req.params;
      const { status, resolution } = validation.data;
      const updated = await complaintsService.updateStatus(id, status, resolution);
      res.json(updated);
    } catch (error) {
      console.error(error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error updating complaint status' });
    }
  },

  assignHandler: async (req: Request, res: Response) => {
    try {
      const validation = assignHandlerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(httpStatus.BAD_REQUEST).json({
          message: 'Validation error',
          errors: validation.error.errors
        });
      }

      const { id } = req.params;
      const { handlerId } = validation.data;
      const updated = await complaintsService.assignHandler(id, handlerId);
      res.json(updated);
    } catch (error) {
      console.error(error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error assigning handler' });
    }
  },

  addComment: async (req: Request, res: Response) => {
    try {
      const validation = addCommentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(httpStatus.BAD_REQUEST).json({
          message: 'Validation error',
          errors: validation.error.errors
        });
      }

      const { id } = req.params;
      const user = (req as any).user;
      const { content, isInternal } = validation.data;

      const comment = await complaintsService.addComment({
        complaintId: id,
        userId: user.sub,
        content,
        isInternal,
      });
      res.status(httpStatus.CREATED).json(comment);
    } catch (error) {
      console.error(error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error adding comment' });
    }
  },
};
