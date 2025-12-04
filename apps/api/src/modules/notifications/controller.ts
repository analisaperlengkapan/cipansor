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
  content: z.string().min(1),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH']).default('NORMAL'),
  unitId: z.string().uuid().optional(),
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
    const result = await notificationScheduler.broadcastAnnouncement(data);
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
    'payment_reminder',
    'attendance_alert',
    'daily_summary',
    'tahfidz_report',
    'event_reminder',
    'overdue_payment',
  ]),
});

export async function triggerScheduledTask(req: Request, res: Response, next: NextFunction) {
  try {
    const { task } = triggerScheduleSchema.parse(req.body);
    
    switch (task) {
      case 'payment_reminder':
        await notificationScheduler.sendPaymentReminders();
        break;
      case 'attendance_alert':
        await notificationScheduler.sendAttendanceAlerts();
        break;
      case 'daily_summary':
        await notificationScheduler.sendDailySummary();
        break;
      case 'tahfidz_report':
        await notificationScheduler.sendTahfidzWeeklyReport();
        break;
      case 'event_reminder':
        await notificationScheduler.sendEventReminders();
        break;
      case 'overdue_payment':
        await notificationScheduler.sendOverduePaymentAlerts();
        break;
    }
    
    res.json({ success: true, message: `Task ${task} executed` });
  } catch (error) {
    next(error);
  }
}
