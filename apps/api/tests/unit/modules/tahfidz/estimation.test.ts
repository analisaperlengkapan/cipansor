import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tahfidzService } from '../../../../src/modules/tahfidz/tahfidz.service';
import { prisma } from '../../../../src/lib/prisma';

vi.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    student: { findFirst: vi.fn() },
    tahfidzRecord: {
      groupBy: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      findMany: vi.fn()
    },
  },
}));

describe('Tahfidz Service - Estimation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate graduation estimation correctly', async () => {
    vi.mocked(prisma.student.findFirst).mockResolvedValue({ id: 's1', user: {}, unit: {} } as any);
    vi.mocked(prisma.tahfidzRecord.groupBy).mockResolvedValue([]);
    vi.mocked(prisma.tahfidzRecord.count).mockResolvedValue(10);
    vi.mocked(prisma.tahfidzRecord.aggregate).mockResolvedValue({ _sum: { totalAyah: 1000 }, _avg: { score: 80 } } as any);
    vi.mocked(prisma.tahfidzRecord.findMany).mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([
      { activityType: 'ZIYADAH', totalAyah: 10 },
      { activityType: 'ZIYADAH', totalAyah: 10 },
      { activityType: 'ZIYADAH', totalAyah: 10 },
    ] as any);

    const result = await tahfidzService.getStudentSummary('s1');
    expect(result.estimation.status).toBe('ON_TRACK');
  });
});
