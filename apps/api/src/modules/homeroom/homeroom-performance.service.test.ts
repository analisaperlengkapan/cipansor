import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    class: { findMany: vi.fn() },
    attendance: { groupBy: vi.fn() },
    grade: { groupBy: vi.fn() },
    tahfidzRecord: { groupBy: vi.fn() },
    violation: { groupBy: vi.fn() },
    reward: { groupBy: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import { homeroomService } from './homeroom.service';

const mocked = prisma as unknown as {
  class: { findMany: ReturnType<typeof vi.fn> };
  attendance: { groupBy: ReturnType<typeof vi.fn> };
  grade: { groupBy: ReturnType<typeof vi.fn> };
  tahfidzRecord: { groupBy: ReturnType<typeof vi.fn> };
  violation: { groupBy: ReturnType<typeof vi.fn> };
  reward: { groupBy: ReturnType<typeof vi.fn> };
};

const superAdmin = { sub: 'u-admin', role: 'SUPER_ADMIN', unitId: null };
const unitAdmin = { sub: 'u-unit', role: 'UNIT_ADMIN', unitId: 'unit-1' };

const mockClass = {
  id: 'class-1',
  name: 'VII A',
  unit: { name: 'SMP IT' },
  homeroomTeacher: { id: 't-1', user: { name: 'Ust. Fulan' } },
  enrollments: [{ studentId: 's-1' }, { studentId: 's-2' }],
};

describe('HomeroomService.getPerformanceOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.attendance.groupBy.mockResolvedValue([]);
    mocked.grade.groupBy.mockResolvedValue([]);
    mocked.tahfidzRecord.groupBy.mockResolvedValue([]);
    mocked.violation.groupBy.mockResolvedValue([]);
    mocked.reward.groupBy.mockResolvedValue([]);
  });

  it('scopes non-super-admins to their own unit', async () => {
    mocked.class.findMany.mockResolvedValue([]);

    await homeroomService.getPerformanceOverview(unitAdmin, 'unit-other');

    expect(mocked.class.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ unitId: 'unit-1' }),
      })
    );
  });

  it('computes per-class metrics and a weighted overall score', async () => {
    mocked.class.findMany.mockResolvedValue([mockClass]);
    mocked.attendance.groupBy
      // First call: by [classId, status]
      .mockResolvedValueOnce([
        { classId: 'class-1', status: 'PRESENT', _count: { id: 90 } },
        { classId: 'class-1', status: 'ABSENT', _count: { id: 10 } },
      ])
      // Second call: by [classId, date] — 11 recorded days
      .mockResolvedValueOnce(
        Array.from({ length: 11 }, (_, i) => ({
          classId: 'class-1',
          date: new Date(2026, 5, i + 1),
          _count: { id: 30 },
        }))
      );
    mocked.grade.groupBy.mockResolvedValue([
      { studentId: 's-1', _avg: { percentage: 80 } },
      { studentId: 's-2', _avg: { percentage: 90 } },
    ]);
    mocked.tahfidzRecord.groupBy.mockResolvedValue([
      { studentId: 's-1', _count: { id: 20 } },
      { studentId: 's-2', _count: { id: 20 } },
    ]);
    mocked.violation.groupBy.mockResolvedValue([{ studentId: 's-1', _count: { id: 2 } }]);
    mocked.reward.groupBy.mockResolvedValue([{ studentId: 's-2', _count: { id: 5 } }]);

    const result = await homeroomService.getPerformanceOverview(superAdmin);

    expect(result.items).toHaveLength(1);
    const item = result.items[0];
    expect(item).toMatchObject({
      classId: 'class-1',
      className: 'VII A',
      teacherName: 'Ust. Fulan',
      studentCount: 2,
    });
    expect(item.metrics.attendanceRate).toBe(90);
    expect(item.metrics.academicAverage).toBe(85);
    expect(item.metrics.tahfidzActivityPerStudent).toBe(20);
    expect(item.metrics.behaviorBalance).toBe(3);
    expect(item.metrics.recordingDiscipline).toBeGreaterThan(0);
    expect(item.metrics.recordingDiscipline).toBeLessThanOrEqual(100);
    // attendance 90*.35 + discipline*.15 + academic 85*.3 + tahfidz 100*.2
    expect(item.overallScore).toBeGreaterThan(70);
    expect(item.overallScore).toBeLessThanOrEqual(100);
    expect(result.averageScore).toBe(item.overallScore);
  });

  it('returns zeroed metrics when a class has no activity data', async () => {
    mocked.class.findMany.mockResolvedValue([mockClass]);

    const result = await homeroomService.getPerformanceOverview(superAdmin);

    expect(result.items[0].metrics).toEqual({
      attendanceRate: 0,
      recordingDiscipline: 0,
      academicAverage: 0,
      tahfidzActivityPerStudent: 0,
      behaviorBalance: 0,
    });
    expect(result.items[0].overallScore).toBe(0);
  });

  it('returns empty overview when there are no homeroom classes', async () => {
    mocked.class.findMany.mockResolvedValue([]);

    const result = await homeroomService.getPerformanceOverview(superAdmin);

    expect(result).toEqual({ items: [], averageScore: 0 });
  });
});
