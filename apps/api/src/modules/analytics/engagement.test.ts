import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as service from './service';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
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
  },
}));

describe('Parent Engagement Analytics Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return parent engagement statistics', async () => {
    // Mock user counts
    (prisma.user.count as any).mockResolvedValueOnce(100); // total
    (prisma.user.count as any).mockResolvedValueOnce(80);  // active
    (prisma.user.count as any).mockResolvedValueOnce(75);  // prev active

    // Mock metrics
    (prisma.auditLog.count as any).mockResolvedValue(10);
    (prisma.payment.count as any).mockResolvedValue(5);
    (prisma.message.count as any).mockResolvedValue(3);

    // Mock classes
    (prisma.class.findMany as any).mockResolvedValue([
      {
        id: 'class-1',
        name: 'VII A',
        students: [
          {
            id: 's1',
            parentOf: [{ parent: { lastLoginAt: new Date() } }]
          }
        ]
      }
    ]);

    // Mock low engagement users
    (prisma.user.findMany as any).mockResolvedValue([]);

    const stats = await service.getParentEngagementStats();

    expect(stats.summary.totalParents).toBe(100);
    expect(stats.summary.activeParents).toBe(80);
    expect(stats.summary.engagementRate).toBe(80);
    expect(stats.metrics.portalLogins.value).toBe(10);
    expect(stats.classBreakdown[0].class).toBe('VII A');
  });
});
