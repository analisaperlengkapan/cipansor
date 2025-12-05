import type { Request, Response, NextFunction } from "express";
import * as service from "./service";
import {
  createNotificationSchema,
  createBulkNotificationSchema,
  queryNotificationSchema,
  createAnnouncementSchema,
  updateAnnouncementSchema,
  queryAnnouncementSchema,
} from "./schema";
import { Errors } from "../../middleware/error";
import { whatsAppService } from "./whatsapp.service";
import { notificationScheduler } from "./scheduler.service";
import { z } from "zod";

// ==================== NOTIFICATION ====================

export async function getMyNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const query = queryNotificationSchema.parse(req.query);
    const result = await service.getUserNotifications(req.user!.sub, query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function createNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createNotificationSchema.parse(req.body);
    const notification = await service.createNotification(data);
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
}

export async function createBulkNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createBulkNotificationSchema.parse(req.body);
    const result = await service.createBulkNotifications(data);
    res.status(201).json({ success: true, data: { count: result.count } });
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    await service.markAsRead(req.params.id, req.user!.sub);
    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    next(error);
  }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.markAllAsRead(req.user!.sub);
    res.json({ success: true, data: { count: result.count } });
  } catch (error) {
    next(error);
  }
}

export async function deleteNotification(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteNotification(req.params.id, req.user!.sub);
    res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    next(error);
  }
}

// ==================== ANNOUNCEMENT ====================

export async function getAnnouncements(req: Request, res: Response, next: NextFunction) {
  try {
    const query = queryAnnouncementSchema.parse(req.query);
    const result = await service.getAnnouncements(query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getAnnouncementById(req: Request, res: Response, next: NextFunction) {
  try {
    const announcement = await service.getAnnouncementById(req.params.id);
    if (!announcement) {
      throw Errors.notFound("Announcement not found");
    }
    res.json({ success: true, data: announcement });
  } catch (error) {
    next(error);
  }
}

export async function createAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createAnnouncementSchema.parse(req.body);
    const announcement = await service.createAnnouncement(data, req.user!.sub);
    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    next(error);
  }
}

export async function updateAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateAnnouncementSchema.parse(req.body);
    const announcement = await service.updateAnnouncement(req.params.id, data);
    res.json({ success: true, data: announcement });
  } catch (error) {
    next(error);
  }
}

export async function deleteAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteAnnouncement(req.params.id);
    res.json({ success: true, message: "Announcement deleted" });
  } catch (error) {
    next(error);
  }
}

// ==================== WHATSAPP ====================

const sendWhatsAppSchema = z.object({
  phone: z.string().min(10),
  message: z.string().min(1),
});

const broadcastSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.enum(['INFO', 'PAYMENT', 'ACADEMIC', 'ATTENDANCE', 'HEALTH', 'COUNSELING', 'ANNOUNCEMENT']).default('ANNOUNCEMENT'),
  targetType: z.enum(['ALL', 'STUDENTS', 'TEACHERS', 'UNIT', 'CLASS']).default('ALL'),
  targetId: z.string().uuid().optional(),
  useWhatsApp: z.boolean().default(false),
});

export async function sendWhatsApp(req: Request, res: Response, next: NextFunction) {
  try {
    const data = sendWhatsAppSchema.parse(req.body);
    const result = await whatsAppService.sendMessage({
      to: data.phone,
      message: data.message,
      type: 'text',
    });
    res.json({ success: result.success, data: result });
  } catch (error) {
    next(error);
  }
}

export async function broadcastWhatsApp(req: Request, res: Response, next: NextFunction) {
  try {
    const data = broadcastSchema.parse(req.body);
    const result = await notificationScheduler.broadcastNotification({
      title: data.title,
      message: data.message,
      type: data.type as any,
      targetType: data.targetType,
      targetId: data.targetId,
      useWhatsApp: data.useWhatsApp,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getWhatsAppStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const status = await whatsAppService.getProviderStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
}

// ==================== SCHEDULER ====================

const triggerScheduleSchema = z.object({
  task: z.enum([
    'payment-reminder',
    'attendance-summary',
    'tahfidz-progress',
    'event-reminder',
    'monthly-report',
  ]),
});

export async function triggerScheduledTask(req: Request, res: Response, next: NextFunction) {
  try {
    const { task } = triggerScheduleSchema.parse(req.body);
    
    await notificationScheduler.runTask(task);
    
    res.json({ success: true, message: `Task ${task} executed` });
  } catch (error) {
    next(error);
  }
}
