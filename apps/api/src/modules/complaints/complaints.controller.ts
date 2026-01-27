import { Request, Response } from 'express';
import { complaintsService } from './complaints.service';
import { ComplaintStatus, ComplaintCategory } from '@prisma/client';
import httpStatus from 'http-status';

export const complaintsController = {
  create: async (req: Request, res: Response) => {
    try {
      // req.user is guaranteed by authenticate middleware
      const user = (req as any).user;
      const unitId = user.unitId;

      const complaint = await complaintsService.create({
        ...req.body,
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
      const { id } = req.params;
      const { status, resolution } = req.body;
      const updated = await complaintsService.updateStatus(id, status, resolution);
      res.json(updated);
    } catch (error) {
      console.error(error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error updating complaint status' });
    }
  },

  assignHandler: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { handlerId } = req.body;
      const updated = await complaintsService.assignHandler(id, handlerId);
      res.json(updated);
    } catch (error) {
      console.error(error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error assigning handler' });
    }
  },

  addComment: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const { content, isInternal } = req.body;

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
