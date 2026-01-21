import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest';
import { notificationService } from '../../src/modules/notifications/email-sms.service';
import { prisma } from '../../src/lib/prisma';

// Mock dependencies
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
    },
    notification: {
      create: vi.fn().mockResolvedValue({ id: 'mock-notification-id' }),
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  },
}));

vi.mock('../../src/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'mock-email-id' }),
    }),
  },
}));

describe('Broadcast Announcement Performance', () => {
  const USER_COUNT = 1000;
  const users = Array.from({ length: USER_COUNT }, (_, i) => ({
    id: `user-${i}`,
    email: `user${i}@example.com`,
    phone: `+628123456${i.toString().padStart(4, '0')}`,
  }));

  const announcement = {
    id: 'announcement-1',
    title: 'Test Announcement',
    content: 'This is a test announcement content.',
    priority: 'HIGH',
  };

  beforeAll(() => {
    // Setup mocks
    (prisma.user.findMany as any).mockResolvedValue(users);
  });

  it('measures execution time for broadcasting to 1000 users', async () => {
    const start = performance.now();

    const result = await notificationService.broadcastAnnouncement(announcement);

    const end = performance.now();
    const duration = end - start;

    console.warn(`Broadcast to ${USER_COUNT} users took ${duration.toFixed(2)}ms`);

    expect(result.sent).toBe(USER_COUNT);
    expect(prisma.notification.createMany).toHaveBeenCalledTimes(1);
    expect(prisma.notification.create).toHaveBeenCalledTimes(0);
  });
});
