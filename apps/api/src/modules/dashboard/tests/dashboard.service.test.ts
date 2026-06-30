import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardService } from '../dashboard.service';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    student: { count: vi.fn() },
    teacher: { count: vi.fn() },
    class: { count: vi.fn() },
    unit: { count: vi.fn() },
    attendance: { count: vi.fn() },
    academicYear: { findFirst: vi.fn() },
    registrant: { count: vi.fn(), groupBy: vi.fn(), findMany: vi.fn() },
    admissionPeriod: { count: vi.fn() },
    exam: { count: vi.fn() },
    examAttempt: { count: vi.fn(), aggregate: vi.fn() },
  },
}));

describe('DashboardService - Admissions & CBT', () => {
  let service: DashboardService;

  beforeEach(() => {
    service = new DashboardService();
    vi.clearAllMocks();
  });

  describe('getAdmissionsStats', () => {
    it('should return admissions statistics correctly', async () => {
      (prisma.registrant.count as any).mockResolvedValue(100);
      (prisma.registrant.groupBy as any).mockResolvedValue([
        { status: 'ACCEPTED', _count: { status: 40 } },
        { status: 'REGISTERED', _count: { status: 60 } },
      ]);
      (prisma.admissionPeriod.count as any).mockResolvedValue(2);
      (prisma.registrant.findMany as any).mockResolvedValue([
        { id: '1', fullName: 'Test Student', status: 'REGISTERED', createdAt: new Date() },
      ]);

      const stats = await service.getAdmissionsStats({ unitId: 'unit-1' });

      expect(stats.totalRegistrants).toBe(100);
      expect(stats.byStatus['ACCEPTED']).toBe(40);
      expect(stats.activePeriods).toBe(2);
      expect(stats.recentRegistrants).toHaveLength(1);
    });
  });

  describe('getCBTSummary', () => {
    it('should return CBT summary correctly', async () => {
      (prisma.exam.count as any).mockResolvedValue(10);
      (prisma.examAttempt.count as any).mockResolvedValue(50);
      (prisma.examAttempt.aggregate as any).mockResolvedValue({
        _avg: { score: 85.5 },
      });

      const summary = await service.getCBTSummary({ unitId: 'unit-1' });

      expect(summary.totalExams).toBe(10);
      expect(summary.totalAttempts).toBe(50);
      expect(summary.avgScore).toBe(85.5);
    });
  });
});
