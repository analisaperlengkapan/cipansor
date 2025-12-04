import { z } from "zod";
import { NotificationType } from "@prisma/client";

// ==================== NOTIFICATION ====================

// Match Prisma enum: INFO, ANNOUNCEMENT, REMINDER, ALERT, PAYMENT, ACADEMIC
const NotificationTypeEnum = z.nativeEnum(NotificationType);

export const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  type: NotificationTypeEnum.default(NotificationType.INFO),
  link: z.string().url().optional(),
});

export const createBulkNotificationSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  type: NotificationTypeEnum.default(NotificationType.INFO),
  link: z.string().url().optional(),
});

export const queryNotificationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: NotificationTypeEnum.optional(),
  isRead: z.enum(["true", "false"]).optional().transform((v) => v === "true" ? true : v === "false" ? false : undefined),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type CreateBulkNotificationInput = z.infer<typeof createBulkNotificationSchema>;
export type QueryNotificationInput = z.infer<typeof queryNotificationSchema>;

// ==================== ANNOUNCEMENT ====================

export const createAnnouncementSchema = z.object({
  unitId: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  type: NotificationTypeEnum.default(NotificationType.ANNOUNCEMENT),
  priority: z.coerce.number().int().min(0).max(2).default(0), // 0=normal, 1=important, 2=urgent
  publishedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
  targetRoles: z.array(z.string()).optional(),
  attachmentUrl: z.string().url().optional(),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();

export const queryAnnouncementSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unitId: z.string().uuid().optional(),
  priority: z.coerce.number().int().min(0).max(2).optional(),
  active: z.enum(["true", "false"]).optional().transform((v) => v === "true"),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
export type QueryAnnouncementInput = z.infer<typeof queryAnnouncementSchema>;
