import { NextFunction, Request, Response } from 'express';
import { MessagesService } from './messages.service';
import { CreateMessageInput } from '@cipansor/shared';
import { requireUser } from '../../middleware/auth';

export class MessagesController {
  private service: MessagesService;

  constructor() {
    this.service = new MessagesService();
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = requireUser(req).id;
      const input: CreateMessageInput = req.body;
      const message = await this.service.createMessage(userId, input);
      res.status(201).json({ success: true, data: message });
    } catch (error) {
      next(error);
    }
  };

  findAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = requireUser(req).id;
      // Default query params
      const limit = Number(req.query.limit) || 20;
      const page = Number(req.query.page) || 1;
      const type = (req.query.type as 'inbox' | 'sent' | 'all') || 'inbox';
      const category = req.query.category as any;

      const result = await this.service.getUserMessages(userId, {
        limit,
        page,
        type,
        category,
      });
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = requireUser(req).id;
      const messageId = req.params.id;
      const message = await this.service.getMessageById(userId, messageId);
      res.json({ success: true, data: message });
    } catch (error) {
      next(error);
    }
  };

  reply = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = requireUser(req).id;
      const parentId = req.params.id;
      const { content } = req.body;

      const reply = await this.service.replyToMessage(userId, parentId, content);
      res.status(201).json({ success: true, data: reply });
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = requireUser(req).id;
      const messageId = req.params.id;
      const message = await this.service.markAsRead(userId, messageId);
      res.json({ success: true, data: message });
    } catch (error) {
      next(error);
    }
  };

  getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = requireUser(req).id;
      const count = await this.service.getUnreadCount(userId);
      res.json({ success: true, data: { unreadCount: count } });
    } catch (error) {
      next(error);
    }
  };
}
