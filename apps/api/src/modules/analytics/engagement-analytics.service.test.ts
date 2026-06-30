import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as service from './engagement-analytics.service';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      count: vi.fn(),
    },
    auditLog: {
      count: vi.fn(),
    },
    payment: {
      count: vi.fn(),
    },
    message: {
      count: vi.fn(),
    },
    class: {
      findMany: vi.fn(),
    },
    studentParent: {
      findMany: vi.fn(),
    },
    teacher: {
      findMany: vi.fn(),
    },
    dailyReport: {
      count: vi.fn(),
    },
  },
}));

describe('Engagement Analytics Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getParentEngagementStats', () => {
    it('should calculate engagement stats correctly', async () => {
      // Mock data
      (prisma.user.count as any).mockResolvedValueOnce(100); // total
      (prisma.user.count as any).mockResolvedValueOnce(80);  // active
      (prisma.user.count as any).mockResolvedValueOnce(70);  // last month active

      (prisma.auditLog.count as any).mockResolvedValue(50);
      (prisma.payment.count as any).mockResolvedValue(20);
      (prisma.message.count as any).mockResolvedValue(10);

      (prisma.class.findMany as any).mockResolvedValue([]);
      (prisma.studentParent.findMany as any).mockResolvedValue([]);

      const stats = await service.getParentEngagementStats();

      expect(stats.summary.totalParents).toBe(100);
      expect(stats.summary.activeParents).toBe(80);
      expect(stats.summary.engagementRate).toBe(80);
      expect(stats.summary.monthlyTrend).toBe('+10.0%');
      expect(stats.metrics.reportViews.value).toBe(50);
    });
  });

  describe('getHomeroomPerformanceStats', () => {
    it('should calculate homeroom performance stats correctly', async () => {
      (prisma.teacher.findMany as any).mockResolvedValue([
        {
          id: 't1',
          user: { name: 'Teacher 1' },
          classes: [
            {
              class: {
                name: 'Class A',
                _count: { enrollments: 30 }
              }
            }
          ]
        }
      ]);
      (prisma.dailyReport.count as any).mockResolvedValue(15);

      const stats = await service.getHomeroomPerformanceStats();

      expect(stats.teachers).toHaveLength(1);
      expect(stats.teachers[0].teacherName).toBe('Teacher 1');
      expect(stats.teachers[0].studentCount).toBe(30);
      expect(stats.teachers[0].metrics.dailyReportCompletion).toBe(75); // 15/20 * 100
    });
  });
});
