import { describe, it, expect, vi, beforeEach } from 'vitest';
import { talentaService } from './talenta.service';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    pKGEvaluation: {
      findUnique: vi.fn(),
    },
    talentProfile: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    talentAssessment: {
      create: vi.fn(),
    },
  },
}));

describe('Talenta Service - PKG Sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should sync talent assessment from PKG evaluation', async () => {
    const mockEvaluation = {
      teacherId: 'teacher-1',
      periodId: 'period-1',
      totalScore: new Prisma.Decimal(95),
      assessorId: 'assessor-1',
      teacher: { userId: 'user-1', unitId: 'unit-1' },
    };

    const mockProfile = {
      id: 'talent-1',
      userId: 'user-1',
      assessments: [],
    };

    (prisma.pKGEvaluation.findUnique as any).mockResolvedValue(mockEvaluation);
    (prisma.talentProfile.findUnique as any).mockResolvedValue(mockProfile);
    (prisma.talentAssessment.create as any).mockResolvedValue({ id: 'ass-1' });
    (prisma.talentProfile.update as any).mockResolvedValue({ id: 'talent-1' });

    const result = await talentaService.syncFromPKG('teacher-1', 'period-1');

    expect(prisma.talentAssessment.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        overallScore: 95,
        performanceRating: 'OUTSTANDING',
      }),
    }));
    expect(result).toBeDefined();
  });
});
