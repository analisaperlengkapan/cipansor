import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    studentParent: { findMany: vi.fn() },
    message: { findMany: vi.fn() },
    notification: { findMany: vi.fn() },
    invoice: { groupBy: vi.fn(), count: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import { getParentEngagement } from './parent-engagement.service';

const mocked = prisma as unknown as {
  studentParent: { findMany: ReturnType<typeof vi.fn> };
  message: { findMany: ReturnType<typeof vi.fn> };
  notification: { findMany: ReturnType<typeof vi.fn> };
  invoice: { groupBy: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> };
};

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

const classA = { id: 'class-a', name: 'VII A' };

function link(
  parentId: string,
  opts: { lastLoginAt?: Date | null; childName?: string; role?: string } = {}
) {
  return {
    parent: {
      id: parentId,
      name: `Parent ${parentId}`,
      lastLoginAt: opts.lastLoginAt ?? null,
      role: opts.role ?? 'PARENT',
    },
    student: {
      user: { name: opts.childName ?? `Child of ${parentId}` },
      enrollments: [{ class: classA }],
    },
  };
}

describe('getParentEngagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.message.findMany.mockResolvedValue([]);
    mocked.notification.findMany.mockResolvedValue([]);
    mocked.invoice.groupBy.mockResolvedValue([]);
    mocked.invoice.count.mockResolvedValue(0);
  });

  it('deduplicates parents, computes rates and class breakdown', async () => {
    mocked.studentParent.findMany.mockResolvedValue([
      link('p1', { lastLoginAt: daysAgo(2) }), // active
      link('p1', { lastLoginAt: daysAgo(2), childName: 'Second child' }), // same parent, 2nd child
      link('p2', { lastLoginAt: daysAgo(60) }), // inactive
      link('p3', { lastLoginAt: null }), // never logged in
      link('p4', { role: 'TEACHER' }), // non-parent link must be ignored
    ]);
    mocked.invoice.groupBy.mockResolvedValue([
      { status: 'PAID', _count: { id: 7 } },
      { status: 'PENDING', _count: { id: 3 } },
    ]);
    mocked.invoice.count.mockResolvedValue(2); // overdue

    const result = await getParentEngagement('unit-1');

    expect(result.summary.totalParents).toBe(3);
    expect(result.summary.activeParents).toBe(1);
    expect(result.summary.engagementRate).toBe(33.3);
    expect(result.summary.avgResponseHours).toBeNull();

    expect(result.classBreakdown).toEqual([
      { classId: 'class-a', className: 'VII A', parents: 3, activeParents: 1, engagement: 33 },
    ]);

    expect(result.invoiceStatus).toEqual({ paid: 7, pending: 1, overdue: 2 });

    // Never-logged-in parent ranks first, then longest inactive
    expect(result.lowEngagement.map((p) => p.parentId)).toEqual(['p3', 'p2']);
    expect(result.lowEngagement[0].daysSinceLogin).toBeNull();
    expect(result.lowEngagement[1].daysSinceLogin).toBeGreaterThanOrEqual(59);

    // Unit filter must reach the student relation
    expect(mocked.studentParent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { student: { deletedAt: null, unitId: 'unit-1' } },
      })
    );
  });

  it('computes average reply latency from parent replies', async () => {
    mocked.studentParent.findMany.mockResolvedValue([link('p1', { lastLoginAt: daysAgo(1) })]);
    const base = daysAgo(3);
    mocked.message.findMany
      // First call: replies (2h and 4h latency -> avg 3h)
      .mockResolvedValueOnce([
        {
          createdAt: new Date(base.getTime() + 2 * 36e5),
          parent: { createdAt: base },
        },
        {
          createdAt: new Date(base.getTime() + 4 * 36e5),
          parent: { createdAt: base },
        },
      ])
      // Second call: weekly activity messages
      .mockResolvedValueOnce([]);

    const result = await getParentEngagement();

    expect(result.summary.avgResponseHours).toBe(3);
  });

  it('returns a 7-day activity series with zeroes when there is no data', async () => {
    mocked.studentParent.findMany.mockResolvedValue([]);

    const result = await getParentEngagement();

    expect(result.weeklyActivity).toHaveLength(7);
    expect(result.weeklyActivity.every((d) => d.messages === 0 && d.notificationsRead === 0)).toBe(
      true
    );
    expect(result.summary).toEqual({
      totalParents: 0,
      activeParents: 0,
      engagementRate: 0,
      avgResponseHours: null,
    });
    expect(result.lowEngagement).toEqual([]);
    expect(result.classBreakdown).toEqual([]);
  });
});
