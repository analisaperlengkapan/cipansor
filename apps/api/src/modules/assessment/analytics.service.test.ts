import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { AssessmentAnalyticsService } from './analytics.service';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    academicYear: { findUnique: vi.fn() },
    grade: { aggregate: vi.fn(), groupBy: vi.fn() },
    tahfidzRecord: { aggregate: vi.fn() },
    violation: { aggregate: vi.fn() },
    attendance: { groupBy: vi.fn() },
    dailyIbadahRecord: { aggregate: vi.fn() },
    student: { count: vi.fn() },
  },
}));

describe('AssessmentAnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate student holistic score correctly', async () => {
    const studentId = 's1';
    const academicYearId = 'ay1';

    // Mock Academic Year date range
    (prisma.academicYear.findUnique as any).mockResolvedValue({
      startDate: new Date('2024-07-01'),
      endDate: new Date('2025-06-30'),
    });

    // Mock Academic (80%)
    (prisma.grade.aggregate as any).mockResolvedValue({ _avg: { percentage: 80 } });

    // Mock Tahfidz (15 juz = 50%)
    (prisma.tahfidzRecord.aggregate as any).mockResolvedValue({
      _sum: { totalAyah: 1000 },
      _max: { juz: 15 }
    });

    // Mock Behavior (20 points violation = 80%)
    (prisma.violation.aggregate as any).mockResolvedValue({ _sum: { points: 20 } });

    // Mock Attendance (9/10 days = 90%)
    (prisma.attendance.groupBy as any).mockResolvedValue([
      { status: 'PRESENT', _count: { _all: 9 } },
      { status: 'ABSENT', _count: { _all: 1 } }
    ]);

    // Mock Ibadah (1500 points / 3000 target = 50%)
    (prisma.dailyIbadahRecord.aggregate as any).mockResolvedValue({ _sum: { pointsEarned: 1500 } });

    const result = await AssessmentAnalyticsService.getStudentHolisticAnalytics(studentId, academicYearId);

    // Expected Calculation:
    // Academic: 80 * 0.3 = 24
    // Tahfidz: 50 * 0.25 = 12.5
    // Behavior: 80 * 0.2 = 16
    // Attendance: 90 * 0.15 = 13.5
    // Ibadah: 50 * 0.1 = 5
    // Total: 24 + 12.5 + 16 + 13.5 + 5 = 71

    expect(result.holisticScore).toBe(71);
    expect(result.breakdown.academic).toBe(80);
    expect(result.breakdown.tahfidz).toBe(50);
    expect(result.interpretation).toContain('Jayyid');
  });

  it('should score behavior as 100 for students with zero violations', async () => {
    const studentId = 's2';
    const academicYearId = 'ay1';

    (prisma.academicYear.findUnique as any).mockResolvedValue({
      startDate: new Date('2024-07-01'),
      endDate: new Date('2025-06-30'),
    });

    // Mock Academic (80%)
    (prisma.grade.aggregate as any).mockResolvedValue({ _avg: { percentage: 80 } });

    // Mock Tahfidz (15 juz = 50%)
    (prisma.tahfidzRecord.aggregate as any).mockResolvedValue({
      _sum: { totalAyah: 1000 },
      _max: { juz: 15 }
    });

    // Mock Behavior: zero violations — Prisma returns _sum.points as null
    (prisma.violation.aggregate as any).mockResolvedValue({ _sum: { points: null } });

    // Mock Attendance (10/10 days = 100%)
    (prisma.attendance.groupBy as any).mockResolvedValue([
      { status: 'PRESENT', _count: { _all: 10 } }
    ]);

    // Mock Ibadah (1500 points / 3000 target = 50%)
    (prisma.dailyIbadahRecord.aggregate as any).mockResolvedValue({ _sum: { pointsEarned: 1500 } });

    const result = await AssessmentAnalyticsService.getStudentHolisticAnalytics(studentId, academicYearId);

    // Behavior should be 100 (clean record), not null (excluded)
    expect(result.breakdown.behavior).toBe(100);
    expect(result.dataCompleteness).toBe('COMPLETE');

    // Expected Calculation with all 5 dimensions:
    // Academic: 80 * 0.3 = 24
    // Tahfidz: 50 * 0.25 = 12.5
    // Behavior: 100 * 0.2 = 20
    // Attendance: 100 * 0.15 = 15
    // Ibadah: 50 * 0.1 = 5
    // Total: 24 + 12.5 + 20 + 15 + 5 = 76.5
    expect(result.holisticScore).toBe(76.5);
  });

  it('should throw error for non-existent academic year', async () => {
    const studentId = 's1';
    const academicYearId = 'non-existent';

    (prisma.academicYear.findUnique as any).mockResolvedValue(null);

    await expect(
      AssessmentAnalyticsService.getStudentHolisticAnalytics(studentId, academicYearId)
    ).rejects.toThrow('Academic year with id non-existent not found');
  });

  it('should calculate unit education analytics correctly', async () => {
    const unitId = 'u1';
    const academicYearId = 'ay1';

    // Mock Subject Averages
    (prisma.grade.groupBy as any).mockResolvedValue([
      { subjectId: 'sub1', _avg: { percentage: 88.5 } },
      { subjectId: 'sub2', _avg: { percentage: 76.2 } }
    ]);

    // Mock Tahfidz Unit Stats
    (prisma.tahfidzRecord.aggregate as any).mockResolvedValue({
      _avg: { juz: 12.4 },
      _count: { id: 150 }
    });

    // Mock Student Count
    (prisma.student.count as any).mockResolvedValue(200);

    const result = await AssessmentAnalyticsService.getUnitEducationAnalytics(unitId, academicYearId);

    expect(result.studentCount).toBe(200);
    expect(result.averageJuz).toBe(12.4);
    expect(result.subjectAverages).toHaveLength(2);
    expect(result.subjectAverages[0].averagePercentage).toBe(88.5);
  });
});
