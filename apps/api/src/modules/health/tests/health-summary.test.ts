import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../../lib/prisma';
import * as healthService from '../service';

vi.mock('../../../lib/prisma', () => ({
  prisma: {
    medicalRecord: {
      findMany: vi.fn(),
    },
    growthRecord: {
      findMany: vi.fn(),
    },
  },
}));

describe('Health Summary Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return health summary with records and growth history', async () => {
    const studentId = 'student-123';
    const mockMedicalRecords = [
      { id: '1', visitDate: new Date('2024-01-10'), complaint: 'Flu' },
      { id: '2', visitDate: new Date('2024-02-15'), complaint: 'Cough' },
    ];
    const mockGrowthRecords = [
      { id: 'g1', recordDate: new Date('2024-01-01'), height: 160, weight: 50 },
      { id: 'g2', recordDate: new Date('2024-02-01'), height: 161, weight: 51 },
    ];

    vi.mocked(prisma.medicalRecord.findMany).mockResolvedValue(mockMedicalRecords as any);
    vi.mocked(prisma.growthRecord.findMany).mockResolvedValue(mockGrowthRecords as any);

    const result = await healthService.getStudentHealthSummary(studentId);

    expect(result.studentId).toBe(studentId);
    expect(result.recentRecords).toHaveLength(2);
    expect(result.growthHistory).toHaveLength(2);
    expect(result.visitTrend).toContainEqual({ month: '2024-01', count: 1 });
    expect(result.visitTrend).toContainEqual({ month: '2024-02', count: 1 });
    expect(result.latestGrowth?.height).toBe(161);
  });

  it('should handle empty records gracefully', async () => {
    vi.mocked(prisma.medicalRecord.findMany).mockResolvedValue([]);
    vi.mocked(prisma.growthRecord.findMany).mockResolvedValue([]);

    const result = await healthService.getStudentHealthSummary('none');

    expect(result.recentRecords).toHaveLength(0);
    expect(result.growthHistory).toHaveLength(0);
    expect(result.visitTrend).toHaveLength(0);
    expect(result.latestGrowth).toBeNull();
  });
});
