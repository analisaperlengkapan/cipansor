import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { aggregateDashboardMetrics } from '../../src/jobs/dashboard-metrics.job';
import { prisma } from '../../src/lib/prisma';
import * as realtime from '../../src/lib/realtime';

// Mock logger to keep output clean
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock Prisma
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    unit: {
      findMany: vi.fn(),
    },
    dashboardHistory: {
      create: vi.fn(),
    },
    student: {
      count: vi.fn(),
    },
    attendance: {
      count: vi.fn(),
    },
    murojaahRecord: {
      count: vi.fn(),
    },
    invoice: {
      count: vi.fn(),
    },
  },
}));

// Mock Realtime
vi.mock('../../src/lib/realtime', () => ({
  getCurrentDashboardMetrics: vi.fn(),
  publishDashboardMetrics: vi.fn(),
  publishDashboardAlert: vi.fn(),
}));

describe('Dashboard Metrics Job Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('measures aggregateDashboardMetrics performance', async () => {
    const unitCount = 50;
    const units = Array.from({ length: unitCount }).map((_, i) => ({
      id: `unit-${i}`,
      name: `Unit ${i}`,
    }));

    // Mock units
    vi.mocked(prisma.unit.findMany).mockResolvedValue(units as any);

    // Mock getCurrentDashboardMetrics with delay
    vi.mocked(realtime.getCurrentDashboardMetrics).mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20)); // 20ms delay
      return {} as any;
    });

    // Mock publishDashboardMetrics with delay
    vi.mocked(realtime.publishDashboardMetrics).mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20)); // 20ms delay
    });

    // Mock history create with delay
    (vi.mocked(prisma.dashboardHistory.create) as any).mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10)); // 10ms delay
      return {} as any;
    });

    // Mock other DB calls to be fast (for checkAndPublishAlerts)
    vi.mocked(prisma.student.count).mockResolvedValue(100);
    vi.mocked(prisma.attendance.count).mockResolvedValue(90);
    vi.mocked(prisma.murojaahRecord.count).mockResolvedValue(0);
    vi.mocked(prisma.invoice.count).mockResolvedValue(0);

    console.log(`Starting benchmark with ${unitCount} units...`);
    const start = performance.now();
    await aggregateDashboardMetrics();
    const end = performance.now();
    const duration = end - start;

    console.log(`\n[Benchmark] aggregateDashboardMetrics took ${duration.toFixed(2)}ms`);

    // Verify calls
    expect(prisma.unit.findMany).toHaveBeenCalled();
    // getCurrentDashboardMetrics is called once globally + once per unit = 51 times
    expect(realtime.getCurrentDashboardMetrics).toHaveBeenCalledTimes(unitCount + 1);
    expect(realtime.publishDashboardMetrics).toHaveBeenCalledTimes(unitCount + 1);
  }, 30000); // Increase timeout for the slow sequential version
});
