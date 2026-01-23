import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDailySnapshots } from '@/jobs/dashboard-snapshot.job';
import { prisma } from '@/lib/prisma';
import { dashboardService } from '@/modules/dashboard-enhancement/dashboard.service';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    unit: {
      findMany: vi.fn(),
    },
    academicYear: {
      findFirst: vi.fn(),
    },
    dashboardMetricSnapshot: {
      upsert: vi.fn(),
    },
  },
}));

// Mock logger to avoid clutter
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock dashboardService
vi.mock('@/modules/dashboard-enhancement/dashboard.service', () => ({
  dashboardService: {
    getOverview: vi.fn(),
  },
}));

describe('Dashboard Snapshot Job Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('measures createDailySnapshots performance', async () => {
    const unitCount = 20;
    const delayMs = 50;

    // Mock units
    const units = Array.from({ length: unitCount }).map((_, i) => ({
      id: `unit-${i}`,
      name: `Unit ${i}`,
    }));

    vi.mocked(prisma.unit.findMany).mockResolvedValue(units as any);

    // Mock academic year
    vi.mocked(prisma.academicYear.findFirst).mockResolvedValue({
      id: 'academic-year-1',
    } as any);

    // Mock getOverview with delay
    vi.mocked(dashboardService.getOverview).mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return {
        students: { total: 100, active: 90, inactive: 10 },
        attendance: { rate: 95, total: 100, present: 95 },
        tahfidz: { avgScore: 80, totalRecords: 50, totalAyah: 1000 },
        murojaah: { avgQuality: 85, totalRecords: 40, totalPages: 100 },
        simaan: { passRate: 90, totalExams: 10, passedExams: 9 },
        teachers: { total: 10 },
        classes: { total: 5 },
      } as any;
    });

    console.log(`Starting benchmark with ${unitCount} units and ${delayMs}ms delay per unit...`);
    const start = performance.now();
    await createDailySnapshots();
    const end = performance.now();
    const duration = end - start;

    console.log(`\n[Benchmark] createDailySnapshots took ${duration.toFixed(2)}ms`);

    // Verify calls
    expect(prisma.unit.findMany).toHaveBeenCalledTimes(1);
    expect(dashboardService.getOverview).toHaveBeenCalledTimes(unitCount);
    // 7 metrics per unit
    expect(prisma.dashboardMetricSnapshot.upsert).toHaveBeenCalledTimes(unitCount * 7);
  });
});
