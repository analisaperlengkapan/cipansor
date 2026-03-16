import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../lib/prisma';
import { CBTService } from './cbt.service';

// Mock external dependencies
vi.mock('../../lib/prisma', () => ({
  prisma: {
    questionBank: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    question: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    exam: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    examAttempt: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    examAnswer: {
      upsert: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

describe('CBT Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Question Banks and Questions', () => {
    it('should create question bank', async () => {
      const dto = {
        unitId: 'unit-1',
        teacherId: 'user-1',
        title: 'Bank Soal Matematika K13',
      };

      vi.mocked(prisma.questionBank.create).mockResolvedValue({ id: 'bank-1', ...dto } as any);

      await CBTService.createQuestionBank(dto);

      expect(prisma.questionBank.create).toHaveBeenCalledWith({ data: dto });
    });

    it('should add question to bank if authorized', async () => {
      vi.mocked(prisma.questionBank.findUnique).mockResolvedValue({ id: 'bank-1', teacherId: 'user-1' } as any);
      vi.mocked(prisma.question.create).mockResolvedValue({ id: 'q-1' } as any);

      const dto = {
        bankId: 'bank-1',
        type: 'MULTIPLE_CHOICE' as any,
        content: 'Berapa 2+2?',
        options: [{ id: 'opt-1', text: '4' }],
        answerKey: 'opt-1',
        points: 5,
      };

      await CBTService.addQuestion(dto, { id: 'user-1', role: 'TEACHER' });

      expect(prisma.question.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          content: 'Berapa 2+2?',
          points: 5,
          order: 0,
        }),
      });
    });

    it('should throw error if unauthorized to add question', async () => {
      vi.mocked(prisma.questionBank.findUnique).mockResolvedValue({ id: 'bank-1', teacherId: 'user-2' } as any);

      await expect(
        CBTService.addQuestion(
          { bankId: 'bank-1', type: 'ESSAY' as any, content: 'Sebutkan...' },
          { id: 'user-1', role: 'TEACHER' }
        )
      ).rejects.toThrow('You do not have permission');
    });
  });

  describe('Exam Scheduling & Grading', () => {
    it('should create an exam if authorized', async () => {
      vi.mocked(prisma.questionBank.findUnique).mockResolvedValue({ id: 'bank-1', teacherId: 'user-1' } as any);
      vi.mocked(prisma.exam.create).mockResolvedValue({ id: 'exam-1' } as any);

      const dto = {
        unitId: 'unit-1',
        academicYearId: 'ay-1',
        subjectId: 'sub-1',
        classId: 'cls-1',
        teacherId: 'user-1',
        type: 'MIDTERM' as any,
        title: 'UTS Matematika',
        scheduledAt: new Date(),
        questionBankId: 'bank-1',
      };

      await CBTService.createExam(dto, { id: 'user-1', role: 'TEACHER' });

      expect(prisma.exam.create).toHaveBeenCalled();
    });

    it('should allow teacher to grade essay answers and recalculate total score', async () => {
      vi.mocked(prisma.examAttempt.findUnique).mockResolvedValue({
        id: 'attempt-1',
        exam: { teacherId: 'user-1' },
      } as any);

      vi.mocked(prisma.examAnswer.upsert).mockResolvedValue({ id: 'ans-1' } as any);
      vi.mocked(prisma.examAnswer.findMany).mockResolvedValue([
        { id: 'ans-1', score: 10 },
        { id: 'ans-2', score: 20 },
      ] as any);
      vi.mocked(prisma.examAttempt.update).mockResolvedValue({ id: 'attempt-1', score: 30 } as any);

      const result = await CBTService.gradeEssayAnswer(
        'attempt-1',
        'q-1',
        { score: 10, isCorrect: true },
        { id: 'user-1', role: 'TEACHER' }
      );

      expect(prisma.examAnswer.upsert).toHaveBeenCalledWith({
        where: { attemptId_questionId: { attemptId: 'attempt-1', questionId: 'q-1' } },
        create: expect.any(Object),
        update: expect.any(Object),
      });

      expect(prisma.examAttempt.update).toHaveBeenCalledWith({
        where: { id: 'attempt-1' },
        data: { score: 30 },
      });
      expect(result.score).toBe(30);
    });
  });

  describe('Exam Attempts', () => {
    it('should start a new attempt if not exists', async () => {
      vi.mocked(prisma.exam.findUnique).mockResolvedValue({
        id: 'exam-1',
        questionBank: {},
      } as any);
      
      vi.mocked(prisma.examAttempt.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.examAttempt.create).mockResolvedValue({ id: 'attempt-1' } as any);

      await CBTService.startExamAttempt('exam-1', 'std-1');

      expect(prisma.examAttempt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          examId: 'exam-1',
          studentId: 'std-1',
          status: 'IN_PROGRESS',
        }),
      });
    });

    it('should submit an answer using upsert', async () => {
      vi.mocked(prisma.examAnswer.upsert).mockResolvedValue({ id: 'ans-1' } as any);

      await CBTService.submitAnswer('attempt-1', 'q-1', 'opt-B');

      expect(prisma.examAnswer.upsert).toHaveBeenCalledWith({
        where: {
          attemptId_questionId: { attemptId: 'attempt-1', questionId: 'q-1' },
        },
        create: expect.any(Object),
        update: { answer: 'opt-B' },
      });
    });

    it('should grade and finish exam attempt', async () => {
      vi.mocked(prisma.examAttempt.findUnique).mockResolvedValue({
        id: 'attempt-1',
        status: 'IN_PROGRESS',
        exam: {
          questionBank: {
            questions: [
              { id: 'q-1', type: 'MULTIPLE_CHOICE', answerKey: 'opt-A', points: 10 },
              { id: 'q-2', type: 'MULTIPLE_CHOICE', answerKey: 'opt-C', points: 10 },
            ],
          },
        },
        answers: [
          { id: 'ans-1', questionId: 'q-1', answer: 'opt-A' }, // correct
          { id: 'ans-2', questionId: 'q-2', answer: 'opt-B' }, // wrong
        ],
      } as any);

      vi.mocked(prisma.examAttempt.update).mockResolvedValue({} as any);

      // We expect the transaction to run the updates for answers
      let transactionCalls: any[] = [];
      vi.mocked(prisma.$transaction).mockImplementation((promises) => {
        transactionCalls = promises as any[];
        return Promise.resolve() as any;
      });

      await CBTService.finishExamAttempt('attempt-1');

      // (We mock $transaction above, which receives arrays of promises or Prisma operations)
      
      expect(prisma.examAttempt.update).toHaveBeenCalledWith({
        where: { id: 'attempt-1' },
        data: expect.objectContaining({
          status: 'COMPLETED',
          score: expect.objectContaining({} as any), // new Prisma.Decimal(10)
        }),
      });

      // q-1 correct, q-2 wrong
      expect(prisma.examAnswer.update).toHaveBeenCalledWith({
        where: { id: 'ans-1' },
        data: { isCorrect: true, score: 10 },
      });
      expect(prisma.examAnswer.update).toHaveBeenCalledWith({
        where: { id: 'ans-2' },
        data: { isCorrect: false, score: 0 },
      });
    });
  });
});
