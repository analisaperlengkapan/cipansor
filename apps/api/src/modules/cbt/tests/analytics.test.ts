import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../../lib/prisma';
import { CBTService } from '../cbt.service';

vi.mock('@prisma/client', () => ({
  Prisma: {
    TransactionIsolationLevel: {
      Serializable: 'Serializable',
    },
    Decimal: vi.fn((val) => val),
    JsonNull: 'JsonNull',
  },
  QuestionType: {
    MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
    TRUE_FALSE: 'TRUE_FALSE',
    ESSAY: 'ESSAY',
  },
}));

// Mock external dependencies
vi.mock('../../../lib/prisma', () => ({
  prisma: {
    exam: {
      findUnique: vi.fn(),
    },
    questionBank: {
       findUnique: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}));

describe('CBT Analytics Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTopicMasteryAnalytics', () => {
    it('should correctly calculate topic mastery from exam attempts', async () => {
      const mockExam = {
        id: 'exam-1',
        title: 'Ujian Akhir Semester',
        questionBank: {
          questions: [
            { id: 'q-1', content: 'Soal 1', points: 10 },
            { id: 'q-2', content: 'Soal 2', points: 10 },
          ],
        },
        attempts: [
          {
            id: 'attempt-1',
            status: 'COMPLETED',
            answers: [
              { questionId: 'q-1', score: 10, question: { points: 10, learningObjective: { id: 'tp-1', code: 'TP01', description: 'Tujuan 1' } } },
              { questionId: 'q-2', score: 5, question: { points: 10, learningObjective: { id: 'tp-1', code: 'TP01', description: 'Tujuan 1' } } },
            ],
          },
          {
            id: 'attempt-2',
            status: 'COMPLETED',
            answers: [
              { questionId: 'q-1', score: 0, question: { points: 10, learningObjective: { id: 'tp-1', code: 'TP01', description: 'Tujuan 1' } } },
              { questionId: 'q-2', score: 10, question: { points: 10, learningObjective: { id: 'tp-1', code: 'TP01', description: 'Tujuan 1' } } },
            ],
          },
        ],
      };

      vi.mocked(prisma.exam.findUnique).mockResolvedValue(mockExam as any);

      const result = await CBTService.getTopicMasteryAnalytics('exam-1');

      expect(result).not.toBeNull();
      // Total points for Q1: 10 (A1) + 0 (A2) = 10 out of 20 (graded count * points)
      // Mastery for Q1: 50%
      const q1Mastery = result!.items.find(i => i.objectiveId === 'q-1');
      expect(q1Mastery?.masteryLevel).toBe(50);

      // TP mastery
      expect(result?.topicMastery).toBeDefined();
      const tp1Mastery = result!.topicMastery!.find((i: any) => i.objectiveId === 'tp-1');
      // Total earned: 10+5+0+10 = 25. Total points: 10+10+10+10 = 40. Mastery: (25/40)*100 = 62.5%
      expect(tp1Mastery?.masteryLevel).toBe(62.5);
    });
  });

  describe('getExamDifficultyInsights', () => {
    it('should identify killer questions', async () => {
       const mockExam = {
        id: 'exam-1',
        title: 'Ujian Akhir Semester',
        questionBank: {
          questions: [
            { id: 'q-1', content: 'Soal Sulit', points: 10 },
            { id: 'q-2', content: 'Soal Mudah', points: 10 },
          ],
        },
        attempts: Array(10).fill({
            status: 'COMPLETED',
            answers: [
                { questionId: 'q-1', isCorrect: false, score: 0 },
                { questionId: 'q-2', isCorrect: true, score: 10 },
            ]
        }).map((a, i) => ({ ...a, id: `att-${i}`, answers: a.answers.map(ans => ({ ...ans })) })),
      };

      // Set some correct answers for q-1 to make success rate 20% (<30%)
      mockExam.attempts[0].answers[0].isCorrect = true;
      mockExam.attempts[0].answers[0].score = 10;
      mockExam.attempts[1].answers[0].isCorrect = true;
      mockExam.attempts[1].answers[0].score = 10;

      vi.mocked(prisma.exam.findUnique).mockResolvedValue(mockExam as any);

      const result = await CBTService.getExamDifficultyInsights('exam-1');

      const killerQ = result?.questionInsights.find(q => q.questionId === 'q-1');
      expect(killerQ?.successRate).toBe(20);
      expect(killerQ?.isKiller).toBe(true);

      const easyQ = result?.questionInsights.find(q => q.questionId === 'q-2');
      expect(easyQ?.successRate).toBe(100);
      expect(easyQ?.isKiller).toBe(false);
    });
  });
});
