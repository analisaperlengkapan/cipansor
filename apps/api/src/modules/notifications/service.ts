import { Prisma, NotificationStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import type {
  CreateNotificationInput,
  CreateBulkNotificationInput,
  QueryNotificationInput,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
  QueryAnnouncementInput,
} from "./schema";

// ==================== NOTIFICATION ====================

export async function getUserNotifications(userId: string, query: QueryNotificationInput) {
  const { page, limit, type, isRead } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.NotificationWhereInput = {
    userId,
    ...(type && { type }),
    ...(isRead !== undefined && { status: isRead ? NotificationStatus.READ : NotificationStatus.UNREAD }),
  };

  const [data, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, status: NotificationStatus.UNREAD } }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    },
  };
}

export async function createNotification(data: CreateNotificationInput) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return prisma.notification.create({ data: data as any });
}

export async function createBulkNotifications(data: CreateBulkNotificationInput) {
  const { userIds, ...notificationData } = data;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const notifications: any[] = userIds.map((userId) => ({
    ...notificationData,
    userId,
  }));

  return prisma.notification.createMany({
    data: notifications,
  });
}

export async function markAsRead(id: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { status: NotificationStatus.READ, readAt: new Date() },
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, status: NotificationStatus.UNREAD },
    data: { status: NotificationStatus.READ, readAt: new Date() },
  });
}

export async function deleteNotification(id: string, userId: string) {
  return prisma.notification.deleteMany({
    where: { id, userId },
  });
}

// ==================== ANNOUNCEMENT ====================

export async function getAnnouncements(query: QueryAnnouncementInput) {
  const { page, limit, unitId, priority, active } = query;
  const skip = (page - 1) * limit;
  const now = new Date();

  const where: Prisma.AnnouncementWhereInput = {
    ...(unitId && { unitId }),
    ...(priority !== undefined && { priority }),
    ...(active && {
      publishedAt: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      skip,
      take: limit,
      include: {
        unit: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    }),
    prisma.announcement.count({ where }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getAnnouncementById(id: string) {
  return prisma.announcement.findUnique({
    where: { id },
    include: {
      unit: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
}

export async function createAnnouncement(data: CreateAnnouncementInput, createdById: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createData: any = {
    ...data,
    createdById,
    publishedAt: data.publishedAt || new Date(),
  };

  return prisma.announcement.create({
    data: createData,
    include: {
      unit: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
}

export async function updateAnnouncement(id: string, data: UpdateAnnouncementInput) {
  return prisma.announcement.update({
    where: { id },
    data,
    include: {
      unit: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
}

export async function deleteAnnouncement(id: string) {
  return prisma.announcement.delete({ where: { id } });
}
