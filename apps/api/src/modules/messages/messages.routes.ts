import { Router } from 'express';
import { MessagesController } from './messages.controller';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { z } from 'zod';

const router = Router();
const controller = new MessagesController();

const createMessageSchema = z.object({
  recipientId: z.string().uuid(),
  subject: z.string().min(1),
  content: z.string().min(1),
  category: z.enum(['ACADEMIC', 'BEHAVIOR', 'HEALTH', 'GENERAL', 'ATTENDANCE', 'TAHFIDZ']).optional(),
  parentId: z.string().uuid().optional(),
});

const replyMessageSchema = z.object({
  content: z.string().min(1),
});

router.use(authenticate);

router.get('/', controller.findAll);
router.get('/unread-count', controller.getUnreadCount);
router.post('/', validate(createMessageSchema), controller.create);
router.get('/:id', controller.findById);
router.patch('/:id/read', controller.markAsRead);
router.post('/:id/reply', validate(replyMessageSchema), controller.reply);

export default router;
