import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkAndTriggerAlerts } from '../../src/modules/analytics/alerts.service';
import { prisma } from '../../src/lib/prisma';
import { NotificationType } from '@prisma/client';

// Define Mock Interfaces for better type safety
interface InvoiceMock {
  id: string;
  paymentTypeId: string;
  amount: number;
  studentId: string;
  student: { user: { name: string; id: string } };
  createdAt: Date;
  invoiceNumber: string;
}

interface StatMock {
  payment_type_id: string;
  avg_val: number;
  stddev_val: number;
}

// Mock dependencies with inline object to avoid hoisting issues
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    invoice: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    student: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    grade: {
      findMany: vi.fn(),
    },
    violation: {
      groupBy: vi.fn(),
    },
    attendance: {
      findMany: vi.fn(),
    },
    notification: {
      findMany: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

// Also mock the alias path just in case, with the same inline structure
vi.mock('@/lib/prisma', () => ({
  prisma: {
    invoice: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    student: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    grade: {
      findMany: vi.fn(),
    },
    violation: {
      groupBy: vi.fn(),
    },
    attendance: {
      findMany: vi.fn(),
    },
    notification: {
      findMany: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

vi.mock('../../src/modules/notifications/notifications.service', () => ({
  createNotification: vi.fn(),
}));

vi.mock('../../src/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Finance Anomaly Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should restrict anomaly checks to the last 24 hours', async () => {
    const now = new Date('2023-10-27T12:00:00Z');
    vi.setSystemTime(now);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Mock return values to prevent crashes
    (prisma.$queryRaw as any).mockResolvedValue([]);
    (prisma.invoice.groupBy as any).mockResolvedValue([]);
    (prisma.invoice.findMany as any).mockResolvedValue([]);
    (prisma.student.findMany as any).mockResolvedValue([]);
    (prisma.grade.findMany as any).mockResolvedValue([]);
    (prisma.violation.groupBy as any).mockResolvedValue([]);
    (prisma.attendance.findMany as any).mockResolvedValue([]);

    await checkAndTriggerAlerts();

    // Verify duplicates check uses 24h window
    expect(prisma.invoice.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: { gte: oneDayAgo },
        }),
      })
    );

    // Verify outliers check uses 24h window
    // Note: findMany is called for other rules too, so we look for the one with oneDayAgo
    expect(prisma.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: { gte: oneDayAgo },
        }),
      })
    );
  });

  it('should detect statistical outliers (z-score > 2)', async () => {
    // Mock stats: Mean = 100,000, StdDev = 10,000
    const stats: StatMock[] = [{ payment_type_id: 'pt1', avg_val: 100000, stddev_val: 10000 }];
    (prisma.$queryRaw as any).mockResolvedValue(stats);

    // Mock findMany with implementation to handle different calls
    (prisma.invoice.findMany as any).mockImplementation((args: any) => {
      // Return empty for overdue check to avoid noise
      if (args?.where?.status === 'OVERDUE') {
        return Promise.resolve([]);
      }
      // Return data for anomaly check (recent invoices)
      return Promise.resolve([
        {
          id: 'inv1',
          paymentTypeId: 'pt1',
          amount: 130000, // Outlier: (130k - 100k) / 10k = 3
          studentId: 's1',
          student: { user: { name: 'Student 1', id: 'u1' } },
          createdAt: new Date(),
          invoiceNumber: 'INV-1',
        },
        {
          id: 'inv2',
          paymentTypeId: 'pt1',
          amount: 110000, // Normal: (110k - 100k) / 10k = 1
          studentId: 's2',
          student: { user: { name: 'Student 2', id: 'u2' } },
          createdAt: new Date(),
          invoiceNumber: 'INV-2',
        },
      ]);
    });

    // Mock groupBy to return no duplicates for this test case
    (prisma.invoice.groupBy as any).mockResolvedValue([]);

    // Mock existing notifications to allow sending
    (prisma.notification.findMany as any).mockResolvedValue([]);

    // Mock other rules data to return empty
    (prisma.student.findMany as any).mockResolvedValue([]);
    (prisma.grade.findMany as any).mockResolvedValue([]);
    (prisma.violation.groupBy as any).mockResolvedValue([]);
    (prisma.attendance.findMany as any).mockResolvedValue([]);

    const triggers = await checkAndTriggerAlerts();

    const anomalies = triggers.filter((t) => t.ruleId === 'finance-anomaly');

    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].studentName).toBe('Student 1');
    expect(anomalies[0].value).toBe(130000);
    expect(anomalies[0].message).toContain('Tagihan tidak wajar');
    expect(anomalies[0].message).toContain('Z-Score');
  });

  it('should detect duplicate invoices', async () => {
    // Mock stats to avoid outliers logic triggering anything unexpectedly
    (prisma.$queryRaw as any).mockResolvedValue([
      { payment_type_id: 'pt1', avg_val: 100000, stddev_val: 10000 },
    ]);

    (prisma.invoice.findMany as any).mockImplementation((args: any) => {
      return Promise.resolve([]); // No recent invoices for outliers check in this test
    });

    // Mock groupBy to return duplicates
    (prisma.invoice.groupBy as any).mockResolvedValue([
      {
        studentId: 's1',
        paymentTypeId: 'pt1',
        amount: 50000,
        period: 'JAN',
        _count: { _all: 2 },
      },
    ]);

    // Mock student.findMany to return the student for the duplicate check (N+1 fix)
    (prisma.student.findMany as any).mockImplementation((args: any) => {
      if (args?.where?.id?.in) {
        return Promise.resolve([{ id: 's1', user: { name: 'Student 1', id: 'u1' } }]);
      }
      return Promise.resolve([]);
    });

    // Mock existing notifications to allow sending
    (prisma.notification.findMany as any).mockResolvedValue([]);

    // Mock other rules data to return empty
    (prisma.grade.findMany as any).mockResolvedValue([]);
    (prisma.violation.groupBy as any).mockResolvedValue([]);
    (prisma.attendance.findMany as any).mockResolvedValue([]);

    const triggers = await checkAndTriggerAlerts();

    const duplicates = triggers.filter((t) => t.ruleId === 'finance-anomaly');

    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].studentName).toBe('Student 1');
    expect(duplicates[0].value).toBe(2);
    expect(duplicates[0].message).toContain('Terdeteksi 2 tagihan duplikat');
  });

  it('should detect anomaly when stddev is 0 but amount differs', async () => {
    const stats: StatMock[] = [{ payment_type_id: 'pt1', avg_val: 100000, stddev_val: 0 }];
    (prisma.$queryRaw as any).mockResolvedValue(stats);

    (prisma.invoice.findMany as any).mockImplementation((args: any) => {
      if (args?.where?.status === 'OVERDUE') return Promise.resolve([]);
      return Promise.resolve([
        {
          id: 'inv1',
          paymentTypeId: 'pt1',
          amount: 101000, // Difference > 100
          studentId: 's1',
          student: { user: { name: 'Student 1', id: 'u1' } },
          createdAt: new Date(),
          invoiceNumber: 'INV-1',
        },
      ]);
    });
    (prisma.invoice.groupBy as any).mockResolvedValue([]);
    (prisma.notification.findMany as any).mockResolvedValue([]);
    (prisma.student.findMany as any).mockResolvedValue([]);
    (prisma.grade.findMany as any).mockResolvedValue([]);
    (prisma.violation.groupBy as any).mockResolvedValue([]);
    (prisma.attendance.findMany as any).mockResolvedValue([]);

    const triggers = await checkAndTriggerAlerts();
    const anomalies = triggers.filter((t) => t.ruleId === 'finance-anomaly');

    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].message).toContain('Tagihan tidak wajar');
  });
});
