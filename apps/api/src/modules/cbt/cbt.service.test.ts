import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../lib/prisma';
import { CBTService } from './cbt.service';
import { Prisma } from '@prisma/client';

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
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    examAttempt: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    examAnswer: {
      upsert: vi.fn(),
      update: vi.fn(),
    },
    classEnrollment: {
      findFirst: vi.fn(),
    },
    grade: {
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
    },
    $transaction: vi.fn((arg) => {
        if (typeof arg === 'function') return arg(prisma);
        return Promise.resolve(arg);
    }),
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

    // ... keeping existing question tests if needed, or focusing on new logic
  });

  describe('Student Exams', () => {
      it('should get student exams based on active class enrollment', async () => {
          vi.mocked(prisma.classEnrollment.findFirst).mockResolvedValue({ classId: 'class-1' } as any);
          vi.mocked(prisma.exam.findMany).mockResolvedValue([
              { id: 'exam-1', title: 'Ujian 1', attempts: [] }
          ] as any);

          const result = await CBTService.getStudentExams('std-1');

          expect(prisma.classEnrollment.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { studentId: 'std-1', status: 'active' } }));
          expect(prisma.exam.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ classId: 'class-1' }) }));
          expect(result).toHaveLength(1);
      });

      it('should return empty list if no active enrollment', async () => {
          vi.mocked(prisma.classEnrollment.findFirst).mockResolvedValue(null);
          const result = await CBTService.getStudentExams('std-1');
          expect(result).toHaveLength(0);
      });
  });

  describe('Exam Attempts', () => {
    it('should start a new attempt if eligible', async () => {
      vi.mocked(prisma.exam.findUnique).mockResolvedValue({
        id: 'exam-1',
        classId: 'class-1',
        status: 'SCHEDULED',
        questionBank: {},
      } as any);
      
      // Eligibility check
      vi.mocked(prisma.classEnrollment.findFirst).mockResolvedValue({ id: 'enroll-1' } as any);

      vi.mocked(prisma.examAttempt.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.examAttempt.create).mockResolvedValue({ id: 'attempt-1' } as any);

      await CBTService.startExamAttempt('exam-1', 'std-1');

      expect(prisma.classEnrollment.findFirst).toHaveBeenCalled();
      expect(prisma.examAttempt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          examId: 'exam-1',
          studentId: 'std-1',
          status: 'IN_PROGRESS',
        }),
      });
    });

    it('should forbid starting exam if not in class', async () => {
        vi.mocked(prisma.exam.findUnique).mockResolvedValue({
            id: 'exam-1',
            classId: 'class-1',
            questionBank: {},
        } as any);
        vi.mocked(prisma.classEnrollment.findFirst).mockResolvedValue(null);

        await expect(CBTService.startExamAttempt('exam-1', 'std-1'))
            .rejects.toThrow('You are not enrolled');
    });

    it('should submit an answer securely', async () => {
      vi.mocked(prisma.examAttempt.findUnique).mockResolvedValue({
          id: 'attempt-1',
          studentId: 'std-1',
          status: 'IN_PROGRESS'
      } as any);
      vi.mocked(prisma.examAnswer.upsert).mockResolvedValue({ id: 'ans-1' } as any);

      await CBTService.submitAnswer('attempt-1', 'q-1', 'opt-B', 'std-1');

      expect(prisma.examAnswer.upsert).toHaveBeenCalled();
    });

    it('should forbid submitting answer for others attempt', async () => {
        vi.mocked(prisma.examAttempt.findUnique).mockResolvedValue({
            id: 'attempt-1',
            studentId: 'other-std',
            status: 'IN_PROGRESS'
        } as any);

        await expect(CBTService.submitAnswer('attempt-1', 'q-1', 'opt-B', 'std-1'))
            .rejects.toThrow('Access denied');
      });

    it('should grade and finish exam attempt', async () => {
      vi.mocked(prisma.examAttempt.findUnique).mockResolvedValue({
        id: 'attempt-1',
        studentId: 'std-1',
        status: 'IN_PROGRESS',
        exam: {
          maxScore: 100,
          questionBank: {
            questions: [
              { id: 'q-1', type: 'MULTIPLE_CHOICE', answerKey: 'opt-A', points: 10 },
              { id: 'q-2', type: 'MULTIPLE_CHOICE', answerKey: 'opt-C', points: 10 },
            ],
          },
          teacher: {
              userId: 'teacher-1'
          }
        },
        answers: [
          { id: 'ans-1', questionId: 'q-1', answer: 'opt-A' }, // correct
          { id: 'ans-2', questionId: 'q-2', answer: 'opt-B' }, // wrong
        ],
      } as any);

      vi.mocked(prisma.examAttempt.update).mockResolvedValue({} as any);
      vi.mocked(prisma.grade.create).mockResolvedValue({} as any);

      await CBTService.finishExamAttempt('attempt-1', 'std-1');
      
      expect(prisma.examAttempt.update).toHaveBeenCalledWith({
        where: { id: 'attempt-1' },
        data: expect.objectContaining({
          status: 'COMPLETED',
          // Score logic: 1 correct out of 2. Raw 10/20 = 50%. Max 100. Final 50.
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

  describe('Manual Grading', () => {
    it('should allow teacher to grade manual answers', async () => {
      vi.mocked(prisma.examAttempt.findUnique).mockResolvedValue({
        id: 'attempt-essay',
        studentId: 'std-1',
        examId: 'exam-1',
        exam: {
          maxScore: 100,
          academicYearId: 'ay-1',
          subjectId: 'sub-1',
          teacher: { userId: 'teacher-1' },
          questionBank: {
            questions: [
              { id: 'q-1', type: 'ESSAY', points: 100 },
            ],
          },
        },
        answers: [
          { id: 'ans-1', questionId: 'q-1', answer: 'Essay content' },
        ],
      } as any);

      vi.mocked(prisma.grade.findFirst).mockResolvedValue(null);

      const result = await CBTService.gradeManualAnswers('attempt-essay', 'teacher-1', [
        { answerId: 'ans-1', score: 85 }
      ]);

      expect(prisma.examAnswer.update).toHaveBeenCalledWith(expect.objectContaining({
          where: { id: 'ans-1' },
          data: { score: 85, isCorrect: true }
      }));

      expect(prisma.examAttempt.update).toHaveBeenCalledWith(expect.objectContaining({
          where: { id: 'attempt-essay' },
          data: { score: 85 }
      }));

      expect(prisma.grade.create).toHaveBeenCalledWith(expect.objectContaining({
          data: expect.objectContaining({ score: 85, gradedById: 'teacher-1' })
      }));
    });

    it('should forbid non-teacher from manual grading', async () => {
      vi.mocked(prisma.examAttempt.findUnique).mockResolvedValue({
        id: 'attempt-essay',
        studentId: 'std-1',
        examId: 'exam-1',
        exam: {
          teacher: { userId: 'teacher-1' },
        },
      } as any);

      await expect(CBTService.gradeManualAnswers('attempt-essay', 'teacher-OTHER', [], 'TEACHER'))
        .rejects.toThrow('Only the assigned teacher can grade this exam');
    });

    it('should allow admin to grade manual answers even if not assigned teacher', async () => {
      vi.mocked(prisma.examAttempt.findUnique).mockResolvedValue({
        id: 'attempt-essay', studentId: 'std-1', examId: 'exam-1',
        exam: { teacher: { userId: 'teacher-1' }, maxScore: 100, questionBank: { questions: [] } },
        answers: [],
      } as any);
      await expect(CBTService.gradeManualAnswers('attempt-essay', 'admin-1', [], 'SUPER_ADMIN')).resolves.toBeDefined();
    });
});
});
});
