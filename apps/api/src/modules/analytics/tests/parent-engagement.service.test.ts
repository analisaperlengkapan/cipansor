import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../../lib/prisma';
import * as service from '../service';

vi.mock('../../../lib/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
    },
    auditLog: {
      count: vi.fn(),
    },
    message: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    payment: {
      aggregate: vi.fn(),
    },
  },
}));

describe('ParentEngagementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return parent engagement stats', async () => {
    const mockParents = [
      {
        id: 'parent1',
        name: 'Parent 1',
        lastLoginAt: new Date(),
        parentOf: [
          {
            student: {
              id: 'student1',
              user: { name: 'Child 1' },
              enrollments: [
                {
                  class: { name: 'Class A' },
                },
              ],
            },
          },
        ],
      },
    ];

    (prisma.user.findMany as any).mockResolvedValue(mockParents);
    (prisma.auditLog.count as any).mockResolvedValue(10);
    (prisma.message.count as any).mockResolvedValue(5);
    (prisma.message.findMany as any).mockResolvedValue([]);
    (prisma.payment.aggregate as any).mockResolvedValue({ _sum: { amount: 100000 } });

    const stats = await service.getParentEngagementStats();

    expect(stats.summary.totalParents).toBe(1);
    expect(stats.summary.activeParents).toBe(1);
    expect(stats.summary.engagementRate).toBe(100);
    expect(stats.metrics.portalLogins.value).toBe(10);
    expect(stats.metrics.messageSent.value).toBe(5);
    expect(stats.metrics.billPayments.value).toBe(100000);
    expect(stats.classBreakdown[0].class).toBe('Class A');
    expect(stats.classBreakdown[0].parents).toBe(1);
    expect(stats.weeklyActivity).toHaveLength(7);
  });
});
