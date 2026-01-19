
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { SchedulerService } from '../../src/modules/notifications/scheduler.service';
import { prisma } from '../../src/lib/prisma';
import * as notificationService from '../../src/modules/notifications/service';
import { NotificationType } from '@prisma/client';

// Mock prisma
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    tahfidzRecord: {
      findMany: vi.fn(),
    },
    notification: {
      createMany: vi.fn(),
    },
    invoice: {
        findMany: vi.fn(),
    },
    attendance: {
        findMany: vi.fn(),
    },
    calendarEvent: {
        findMany: vi.fn(),
    },
    user: {
        findMany: vi.fn(),
    },
    student: {
        findMany: vi.fn(),
    }
  },
}));

// Mock logger to avoid clutter
vi.mock('../../src/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock createNotification to simulate DB latency
vi.spyOn(notificationService, 'createNotification').mockImplementation(async () => {
  await new Promise(resolve => setTimeout(resolve, 1)); // 1ms delay
  return {} as any;
});

// Mock createManyNotifications
vi.spyOn(notificationService, 'createManyNotifications').mockImplementation(async () => {
  await new Promise(resolve => setTimeout(resolve, 5)); // 5ms delay for bulk
  return {} as any;
});

describe('SchedulerService Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should measure execution time of sendTahfidzProgress', async () => {
    const recordCount = 1000;
    const mockRecords = Array.from({ length: recordCount }).map((_, i) => ({
      studentId: `student-${i}`,
      totalAyah: 10,
      student: {
        user: {
          id: `user-${i}`,
          name: `Student ${i}`,
          email: `student${i}@example.com`,
          phone: `0812345678${i}`,
        },
      },
      createdAt: new Date(),
    }));

    vi.mocked(prisma.tahfidzRecord.findMany).mockResolvedValue(mockRecords as any);

    process.stdout.write(`\nStarting benchmark with ${recordCount} records...`);
    const start = performance.now();

    await SchedulerService.runTask('tahfidz-progress');

    const end = performance.now();
    const duration = end - start;

    process.stdout.write(`\nExecution time: ${duration.toFixed(2)} ms\n`);

    // Verify bulk behavior
    expect(notificationService.createManyNotifications).toHaveBeenCalledTimes(1);
    expect(notificationService.createNotification).toHaveBeenCalledTimes(0);
  });
});
