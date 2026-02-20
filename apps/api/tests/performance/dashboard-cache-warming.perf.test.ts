import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest';
import { warmDashboardCache } from '../../src/lib/realtime';
import { prisma } from '../../src/lib/prisma';

// Mock logger
vi.mock('../../src/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock prisma
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    unit: {
      findMany: vi.fn(),
    },
    student: {
      count: vi.fn(),
    },
    teacher: {
      count: vi.fn(),
    },
    attendance: {
      count: vi.fn(),
    },
    hafidzStudent: {
      count: vi.fn(),
    },
    murojaahRecord: {
      aggregate: vi.fn(),
    },
    payment: {
      aggregate: vi.fn(), // called by getLiveDashboardSummary potentially, but not by getCurrentDashboardMetrics
    },
    dashboardHistory: {
      create: vi.fn(),
    },
  },
}));

// Helper to simulate DB delay
const simulateDbDelay = async <T>(result: T, delayMs = 10): Promise<T> => {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  return result;
};

describe('Dashboard Cache Warming Performance', () => {
  const UNIT_COUNT = 20;
  const units = Array.from({ length: UNIT_COUNT }, (_, i) => ({
    id: `unit-${i}`,
    name: `Unit ${i}`,
  }));

  beforeAll(() => {
    // Setup mocks with delays
    (prisma.unit.findMany as any).mockImplementation(() => simulateDbDelay(units));

    // Mock counts to return a number
    (prisma.student.count as any).mockImplementation(() => simulateDbDelay(100));
    (prisma.teacher.count as any).mockImplementation(() => simulateDbDelay(10));
    (prisma.attendance.count as any).mockImplementation(() => simulateDbDelay(90));
    (prisma.hafidzStudent.count as any).mockImplementation(() => simulateDbDelay(5));

    // Mock aggregate
    (prisma.murojaahRecord.aggregate as any).mockImplementation(() =>
      simulateDbDelay({
        _avg: { qualityScore: 85 },
      })
    );
  });

  it('measures execution time for warming cache for 20 units', async () => {
    const start = performance.now();

    await warmDashboardCache();

    const end = performance.now();
    const duration = end - start;

    console.warn(`Cache warming for ${UNIT_COUNT} units took ${duration.toFixed(2)}ms`);

    // Verify calls
    // Global metrics (1 set of calls) + 20 units (20 sets of calls)
    // Each getCurrentDashboardMetrics calls:
    // student.count (2x)
    // teacher.count (1x)
    // attendance.count (1x)
    // hafidzStudent.count (1x)
    // murojaahRecord.aggregate (1x)

    const callsPerMetric = {
      student: 2,
      teacher: 1,
      attendance: 1,
      hafidz: 1,
      murojaah: 1,
    };

    const totalSets = 1 + UNIT_COUNT; // Global + Units

    expect(prisma.student.count).toHaveBeenCalledTimes(totalSets * callsPerMetric.student);
    expect(prisma.teacher.count).toHaveBeenCalledTimes(totalSets * callsPerMetric.teacher);
  });
});
