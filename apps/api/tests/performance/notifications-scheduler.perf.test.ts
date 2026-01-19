import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationScheduler } from '../../src/modules/notifications/scheduler.service';
import { prisma } from '../../src/lib/prisma';

// Mock @prisma/client enums
vi.mock('@prisma/client', () => ({
  NotificationType: {
    ACADEMIC: 'ACADEMIC',
    PAYMENT: 'PAYMENT',
    ALERT: 'ALERT',
    REMINDER: 'REMINDER',
    INFO: 'INFO',
  },
  AttendanceStatus: {
    ABSENT: 'ABSENT',
  },
  PaymentStatus: {
    PENDING: 'PENDING',
    PARTIAL: 'PARTIAL',
  },
}));

// Mock prisma
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    student: {
      findMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
    setting: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
        update: vi.fn(),
    }
  },
}));

describe('Scheduler Service Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('measures sendMonthlyReport performance', async () => {
    const studentCount = 200;

    // Mock students
    const students = Array.from({ length: studentCount }).map((_, i) => ({
      id: `student-${i}`,
      status: 'ACTIVE',
      user: {
        id: `user-${i}`,
        name: `Student ${i}`,
        email: `student${i}@example.com`,
        phone: `0812345678${i}`,
      },
    }));

    vi.mocked(prisma.student.findMany).mockResolvedValue(students as any);

    // Mock create with delay to simulate DB latency
    vi.mocked(prisma.notification.create).mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 5)); // 5ms latency per insert
      return {} as any;
    });

    // Mock createMany with delay
    vi.mocked(prisma.notification.createMany).mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 20)); // 20ms latency for bulk insert
      return { count: studentCount } as any;
    });

    console.log(`Starting benchmark with ${studentCount} students...`);
    const start = performance.now();
    await notificationScheduler.runTask('monthly-report');
    const end = performance.now();
    const duration = end - start;

    console.log(`\n[Benchmark] sendMonthlyReport took ${duration.toFixed(2)}ms`);

    // Verify calls
    expect(prisma.student.findMany).toHaveBeenCalledTimes(1);

    const createCalls = vi.mocked(prisma.notification.create).mock.calls.length;
    const createManyCalls = vi.mocked(prisma.notification.createMany).mock.calls.length;

    console.log(`prisma.notification.create called: ${createCalls} times`);
    console.log(`prisma.notification.createMany called: ${createManyCalls} times`);

  });
});
