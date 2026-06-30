/**
 * Firebase Cloud Messaging (FCM) Service
 *
 * Logic to send push notifications to mobile devices.
 */

import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';

interface PushNotificationOptions {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export class FCMService {
  /**
   * Send push notification to a specific user
   */
  async sendPushNotification(options: PushNotificationOptions) {
    const { userId, title, body, data } = options;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fcmToken: true },
      });

      if (!user?.fcmToken) {
        logger.debug(`User ${userId} has no FCM token, skipping push notification`);
        return null;
      }

      // In a real implementation, we would use the firebase-admin SDK here.
      // Since we don't have the google-services.json yet, we'll log it.
      logger.info(`[FCM PUSH] To: ${user.fcmToken} | Title: ${title} | Body: ${body}`);

      // Placeholder for firebase-admin send
      // await admin.messaging().send({
      //   token: user.fcmToken,
      //   notification: { title, body },
      //   data: data || {},
      // });

      return { success: true, token: user.fcmToken };
    } catch (error) {
      logger.error('FCM send error:', error);
      return { success: false, error };
    }
  }

  /**
   * Bulk send push notifications
   */
  async sendBulkPush(userIds: string[], title: string, body: string, data?: Record<string, string>) {
    const users = await prisma.user.findMany({
      where: { id: { in: userIds }, fcmToken: { not: null } },
      select: { fcmToken: true },
    });

    const tokens = users.map(u => u.fcmToken).filter(Boolean) as string[];

    if (tokens.length === 0) return { sent: 0 };

    logger.info(`[FCM BULK PUSH] Sending to ${tokens.length} devices. Title: ${title}`);

    // admin.messaging().sendEachForMulticast({ tokens, notification: { title, body }, data })

    return { sent: tokens.length };
  }
}

export const fcmService = new FCMService();
