import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getStudentAchievements } from '../../../../src/modules/ibadah/ibadah.service';
import { prisma } from '../../../../src/lib/prisma';

vi.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    dailyIbadahRecord: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('Ibadah Service - Achievements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate points and level correctly', async () => {
    vi.mocked(prisma.dailyIbadahRecord.aggregate).mockResolvedValue({
      _sum: { pointsEarned: 1500, bonusEarned: 200 },
    } as any);

    vi.mocked(prisma.dailyIbadahRecord.findMany).mockResolvedValue([]);

    const result = await getStudentAchievements('student-1');

    expect(result.totalPoints).toBe(1700);
    expect(result.level).toBe(2);
    expect(result.badges).toContainEqual(expect.objectContaining({ id: 'beginner' }));
  });
});
