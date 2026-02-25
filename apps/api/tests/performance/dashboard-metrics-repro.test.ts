import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    unit: {
      findMany: vi.fn(),
    },
    student: {
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    attendance: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('Dashboard Metrics Performance (Query Count)', () => {
  const units = Array.from({ length: 10 }, (_, i) => ({ id: `unit-${i}`, name: `Unit ${i}` }));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.unit.findMany as any).mockResolvedValue(units);
  });

  it('Baseline: N+1 implementation makes 2*N queries', async () => {
    // Mock return values for loop
    (prisma.student.count as any).mockResolvedValue(50);
    (prisma.attendance.count as any).mockResolvedValue(40);

    // Original Logic (Simulated)
    const fetchedUnits = await prisma.unit.findMany({ where: { deletedAt: null } });

    for (const unit of fetchedUnits) {
      await prisma.student.count({
        where: {
          unitId: unit.id,
          status: 'ACTIVE',
        },
      });

      await prisma.attendance.count({
        where: {
          date: { gte: today },
          status: 'PRESENT',
          student: {
            unitId: unit.id,
          },
        },
      });
    }

    // Assertions
    expect(prisma.unit.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.student.count).toHaveBeenCalledTimes(10);
    expect(prisma.attendance.count).toHaveBeenCalledTimes(10);
    // Total DB calls: 1 + 10 + 10 = 21
  });

  it('Optimization: Makes constant number of queries', async () => {
    // Mock return values for bulk queries
    (prisma.student.groupBy as any).mockResolvedValue(
      units.map((u) => ({ unitId: u.id, _count: 50 }))
    );
    (prisma.attendance.findMany as any).mockResolvedValue(
      units.flatMap((u) => Array(40).fill({ student: { unitId: u.id } }))
    );

    // Optimized Logic (Simulated)
    const fetchedUnits = await prisma.unit.findMany({ where: { deletedAt: null } });
    const unitIds = fetchedUnits.map((u) => u.id);

    // 1. Group active students by unit
    const activeStudentsCounts = await prisma.student.groupBy({
      by: ['unitId'],
      where: {
        status: 'ACTIVE',
        // In real impl, we might not filter by unitId if we want all,
        // but for safety/performance on large sets we might.
        // Let's assume we fetch all active students grouped.
      },
      _count: true,
    });

    // 2. Fetch present attendance
    const presentAttendance = await prisma.attendance.findMany({
      where: {
        date: { gte: today },
        status: 'PRESENT',
      },
      select: {
        student: {
          select: { unitId: true },
        },
      },
    });

    // 3. Aggregate
    const activeMap = new Map<string, number>();
    activeStudentsCounts.forEach((item: any) => {
      activeMap.set(item.unitId, item._count);
    });

    const presentMap = new Map<string, number>();
    presentAttendance.forEach((att: any) => {
      const uid = att.student.unitId;
      presentMap.set(uid, (presentMap.get(uid) || 0) + 1);
    });

    // Loop for processing (no DB calls)
    for (const unit of fetchedUnits) {
      const unitActiveStudents = activeMap.get(unit.id) || 0;
      const unitPresent = presentMap.get(unit.id) || 0;
      const rate = unitActiveStudents > 0 ? (unitPresent / unitActiveStudents) * 100 : 0;
      expect(rate).toBe(80); // 40/50 * 100
    }

    // Assertions
    expect(prisma.unit.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.student.groupBy).toHaveBeenCalledTimes(1);
    expect(prisma.attendance.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.student.count).toHaveBeenCalledTimes(0);
    expect(prisma.attendance.count).toHaveBeenCalledTimes(0);
    // Total DB calls: 3
  });
});
