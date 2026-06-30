import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getConsolidatedExecutiveDashboard } from '../../../../src/modules/foundation/service';
import { prisma } from '../../../../src/lib/prisma';

vi.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    foundation: { findUnique: vi.fn() },
    student: { groupBy: vi.fn() },
    teacher: { groupBy: vi.fn() },
    attendance: { groupBy: vi.fn() },
    payment: { aggregate: vi.fn() },
    tahfidzRecord: { aggregate: vi.fn() },
  },
}));

describe('Foundation Service - Consolidated', () => {
  it('should consolidate unit data', async () => {
    vi.mocked(prisma.foundation.findUnique).mockResolvedValue({ id: 'f1', units: [] } as any);
    vi.mocked(prisma.student.groupBy).mockResolvedValue([]);
    vi.mocked(prisma.teacher.groupBy).mockResolvedValue([]);
    vi.mocked(prisma.attendance.groupBy).mockResolvedValue([]);
    vi.mocked(prisma.payment.aggregate).mockResolvedValue({ _sum: { amount: 0 } } as any);
    vi.mocked(prisma.tahfidzRecord.aggregate).mockResolvedValue({ _avg: { juz: 0 } } as any);

    const result = await getConsolidatedExecutiveDashboard('f1');
    expect(result.metrics).toBeDefined();
  });
});
