import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SchedulerService,
  notificationScheduler,
} from '../../src/modules/notifications/scheduler.service';
import { prisma } from '../../src/lib/prisma';
import * as notificationService from '../../src/modules/notifications/notifications.service';
import { NotificationType, AttendanceStatus } from '@prisma/client';

// Mock prisma
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    tahfidzRecord: {
      findMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      createMany: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
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
    },
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
  await new Promise((resolve) => setTimeout(resolve, 1)); // 1ms delay
  return {} as any;
});

// Mock createManyNotifications
vi.spyOn(notificationService, 'createManyNotifications').mockImplementation(async () => {
  await new Promise((resolve) => setTimeout(resolve, 5)); // 5ms delay for bulk
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

  it('measures sendAttendanceSummary performance', async () => {
    const studentCount = 1000;

    // Generate mock attendance records
    const attendanceRecords = Array.from({ length: studentCount }).map((_, i) => ({
      studentId: `student-${i}`,
      status: AttendanceStatus.ABSENT,
      date: new Date(),
      student: {
        user: {
          id: `user-${i}`,
          name: `Student ${i}`,
          email: `student${i}@example.com`,
          phone: `0812345678${i}`,
        },
      },
    }));

    // Mock findMany to return these records
    vi.mocked(prisma.attendance.findMany).mockResolvedValue(attendanceRecords as any);

    // Mock create to resolve successfully
    vi.mocked(prisma.notification.create).mockResolvedValue({ id: 'notif-id' } as any);
    vi.mocked(prisma.notification.createMany).mockResolvedValue({ count: studentCount } as any);

    // Assert on the batching helper (the contract): all absences are dispatched
    // in a single batched call rather than one-per-student.
    const createManySpy = vi.spyOn(notificationService, 'createManyNotifications');

    const start = performance.now();
    await notificationScheduler.runTask('attendance-summary');
    const end = performance.now();
    const duration = end - start;

    const createCalls = vi.mocked(prisma.notification.create).mock.calls.length;

    // eslint-disable-next-line no-console
    console.info(
      `[Benchmark] sendAttendanceSummary ${studentCount} absences in ${duration.toFixed(2)}ms`
    );

    // Per-student create must NOT be used; a single batched call handles all.
    expect(createCalls).toBe(0);
    expect(createManySpy).toHaveBeenCalledTimes(1);

    // Verify the batched payload carries the mapped notifications.
    expect(createManySpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          userId: 'user-0',
          type: 'ALERT',
          priority: 'HIGH',
          channels: ['IN_APP'],
        }),
      ])
    );
    expect(createManySpy.mock.calls[0][0]).toHaveLength(studentCount);
  });
});
