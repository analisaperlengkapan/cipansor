import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    exam: { findUnique: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import { CBTService } from './cbt.service';

const mocked = prisma as unknown as {
  exam: { findUnique: ReturnType<typeof vi.fn> };
};

/**
 * Build 10 attempts with scores 100..10 descending. Group size is
 * floor(10 × 0.27) = 2. The top-3 scorers answer q1 correctly (so the whole
 * upper group is correct) while the bottom group is wrong → D(q1) = 1.
 * q2 is answered correctly by everyone → D(q2) = 0, difficulty 1.0.
 */
function buildAttempts() {
  return Array.from({ length: 10 }, (_, i) => {
    const rank = i; // 0 = best
    return {
      id: `attempt-${i}`,
      score: 100 - rank * 10,
      status: 'COMPLETED',
      answers: [
        {
          questionId: 'q1',
          isCorrect: rank < 3, // only the top group gets q1 right
          score: 1,
        },
        { questionId: 'q2', isCorrect: true, score: 1 },
      ],
    };
  });
}

describe('CBTService.getExamDifficultyInsights', () => {
  beforeEach(() => vi.clearAllMocks());

  it('computes difficulty and discrimination indices with 27% groups', async () => {
    mocked.exam.findUnique.mockResolvedValue({
      id: 'exam-1',
      title: 'UTS Matematika',
      questionBank: {
        questions: [
          { id: 'q1', content: 'Soal sulit yang membedakan', order: 1 },
          { id: 'q2', content: 'Soal mudah untuk semua', order: 2 },
        ],
      },
      attempts: buildAttempts(),
    });

    const insights = await CBTService.getExamDifficultyInsights('exam-1');

    expect(insights).not.toBeNull();
    expect(insights!.totalParticipants).toBe(10);
    expect(insights!.discriminationGroupSize).toBe(2); // floor(10 * 0.27)

    const q1 = insights!.questionInsights.find((q) => q.questionId === 'q1')!;
    const q2 = insights!.questionInsights.find((q) => q.questionId === 'q2')!;

    // q1: top-2 correct, bottom-2 wrong → D = (2-0)/2 = 1
    expect(q1.discriminationIndex).toBe(1);
    expect(q1.difficultyIndex).toBeCloseTo(0.3);
    // q2: everyone correct → D = 0, flagged for review (poor discrimination)
    expect(q2.discriminationIndex).toBe(0);
    expect(q2.difficultyIndex).toBe(1);
    expect(q2.needsReview).toBe(true);
  });

  it('skips discrimination with fewer than 10 attempts', async () => {
    mocked.exam.findUnique.mockResolvedValue({
      id: 'exam-2',
      title: 'Kuis Kecil',
      questionBank: {
        questions: [{ id: 'q1', content: 'Soal', order: 1 }],
      },
      attempts: [
        {
          id: 'a1',
          score: 80,
          status: 'COMPLETED',
          answers: [{ questionId: 'q1', isCorrect: true, score: 1 }],
        },
      ],
    });

    const insights = await CBTService.getExamDifficultyInsights('exam-2');

    expect(insights!.discriminationGroupSize).toBeNull();
    expect(insights!.questionInsights[0].discriminationIndex).toBeNull();
  });
});
