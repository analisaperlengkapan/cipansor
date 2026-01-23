import { prisma } from '@/lib/prisma';
import { Prisma, QuestionType, ExamAttemptStatus } from '@prisma/client';
import { Errors } from '@/middleware/error';

// Types for inputs (can be moved to shared types later)
interface CreateQuestionBankInput {
  unitId: string;
  teacherId: string;
  title: string;
  description?: string;
  subjectId?: string;
}

interface CreateQuestionInput {
  bankId: string;
  type: QuestionType;
  content: string;
  options?: any;
  answerKey?: any;
  explanation?: string;
  points?: number;
  order?: number;
}

interface UpdateQuestionInput {
  content?: string;
  options?: any;
  answerKey?: any;
  explanation?: string;
  points?: number;
  order?: number;
}

export class CBTService {
  // --- Question Banks ---

  static async createQuestionBank(data: CreateQuestionBankInput) {
    return prisma.questionBank.create({
      data,
    });
  }

  static async getQuestionBanks(query: {
    unitId?: string;
    teacherId?: string;
    subjectId?: string;
    search?: string;
  }) {
    const where: Prisma.QuestionBankWhereInput = {
      isActive: true,
    };

    if (query.unitId) where.unitId = query.unitId;
    if (query.teacherId) where.teacherId = query.teacherId;
    if (query.subjectId) where.subjectId = query.subjectId;
    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }

    return prisma.questionBank.findMany({
      where,
      include: {
        teacherRel: { select: { user: { select: { name: true } } } },
        subject: { select: { name: true, code: true } },
        _count: { select: { questions: true, exams: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  static async getQuestionBankById(id: string) {
    const bank = await prisma.questionBank.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { order: 'asc' } },
        teacherRel: { select: { user: { select: { name: true } } } },
        subject: { select: { name: true, code: true } },
      },
    });

    if (!bank) throw Errors.notFound('Question Bank not found');
    return bank;
  }

  static async deleteQuestionBank(id: string, user: { id: string; role: string }) {
    const bank = await prisma.questionBank.findUnique({ where: { id } });
    if (!bank) throw Errors.notFound('Question Bank not found');

    if (
      !user.role.includes('SUPER_ADMIN') &&
      !user.role.includes('UNIT_ADMIN') &&
      bank.teacherId !== user.id
    ) {
      throw Errors.forbidden('You do not have permission to delete this Question Bank');
    }

    // Soft delete
    return prisma.questionBank.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // --- Questions ---

  static async addQuestion(data: CreateQuestionInput, user: { id: string; role: string }) {
    const bank = await prisma.questionBank.findUnique({ where: { id: data.bankId } });
    if (!bank) throw Errors.notFound('Question Bank not found');

    if (
      !user.role.includes('SUPER_ADMIN') &&
      !user.role.includes('UNIT_ADMIN') &&
      bank.teacherId !== user.id
    ) {
      throw Errors.forbidden('You do not have permission to add questions to this Question Bank');
    }

    return prisma.question.create({
      data: {
        ...data,
        points: data.points ?? 1,
        order: data.order ?? 0,
      },
    });
  }

  static async updateQuestion(
    id: string,
    data: UpdateQuestionInput,
    user: { id: string; role: string }
  ) {
    const question = await prisma.question.findUnique({
      where: { id },
      include: { bank: true },
    });
    if (!question) throw Errors.notFound('Question not found');

    if (
      !user.role.includes('SUPER_ADMIN') &&
      !user.role.includes('UNIT_ADMIN') &&
      question.bank.teacherId !== user.id
    ) {
      throw Errors.forbidden('You do not have permission to update this question');
    }

    return prisma.question.update({
      where: { id },
      data,
    });
  }

  static async deleteQuestion(id: string, user: { id: string; role: string }) {
    const question = await prisma.question.findUnique({
      where: { id },
      include: { bank: true },
    });
    if (!question) throw Errors.notFound('Question not found');

    if (
      !user.role.includes('SUPER_ADMIN') &&
      !user.role.includes('UNIT_ADMIN') &&
      question.bank.teacherId !== user.id
    ) {
      throw Errors.forbidden('You do not have permission to delete this question');
    }

    return prisma.question.delete({
      where: { id },
    });
  }

  // --- Exam Attempts (Student) ---

  static async startExamAttempt(examId: string, studentId: string) {
    // 1. Check if exam exists and is open
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questionBank: {
          include: { questions: true },
        },
      },
    });

    if (!exam) throw Errors.notFound('Exam not found');
    if (!exam.questionBank)
      throw Errors.badRequest('This exam is not configured for CBT (no Question Bank)');

    // Check timing (simplified, ideally check scheduledAt + duration)
    // For now, allow starting if status is not COMPLETED/GRADED (assuming generic exam status)
    // Or check if current time is within window.

    // Check if attempt already exists
    const existingAttempt = await prisma.examAttempt.findUnique({
      where: {
        examId_studentId: { examId, studentId },
      },
    });

    if (existingAttempt) {
      if (existingAttempt.status === 'IN_PROGRESS') {
        return existingAttempt; // Resume
      }
      // If expired or completed, maybe allow retake? For now, block.
      // throw Errors.badRequest('You have already taken this exam');
      // Let's just return it, frontend can handle status.
      return existingAttempt;
    }

    // Create new attempt
    return prisma.examAttempt.create({
      data: {
        examId,
        studentId,
        startedAt: new Date(),
        status: 'IN_PROGRESS',
      },
    });
  }

  static async getAttempt(attemptId: string, studentId: string) {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: true,
        exam: {
          include: {
            questionBank: {
              include: {
                questions: {
                  select: {
                    id: true,
                    type: true,
                    content: true,
                    options: true,
                    points: true,
                    // NO ANSWER KEY
                  },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) throw Errors.notFound('Attempt not found');
    if (attempt.studentId !== studentId) throw Errors.forbidden('Access denied');

    return attempt;
  }

  static async submitAnswer(attemptId: string, questionId: string, answer: any) {
    // Upsert answer
    return prisma.examAnswer.upsert({
      where: {
        attemptId_questionId: { attemptId, questionId },
      },
      create: {
        attemptId,
        questionId,
        answer,
      },
      update: {
        answer,
      },
    });
  }

  static async finishExamAttempt(attemptId: string) {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: { questionBank: { include: { questions: true } } },
        },
        answers: true,
      },
    });

    if (!attempt) throw Errors.notFound('Attempt not found');
    if (attempt.status !== 'IN_PROGRESS') return attempt;

    // Auto grading
    let totalScore = 0;
    const questions = attempt.exam.questionBank?.questions || [];

    const gradedAnswers = [];

    for (const question of questions) {
      const studentAnswer = attempt.answers.find((a) => a.questionId === question.id);
      let isCorrect = false;
      let score = 0;

      if (question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE') {
        // Compare answerKey. Assuming answerKey is { optionId: "..." } or simple string
        // studentAnswer.answer should match structure.
        // Simple logic: if JSON stringify matches (careful with order) or direct value check.
        // Assuming answerKey is just the ID of the correct option.

        const key = question.answerKey as any; // e.g. "opt-1"
        const studentAns = studentAnswer?.answer as any; // e.g. "opt-1"

        if (key && studentAns && key === studentAns) {
          isCorrect = true;
          score = question.points;
        }
      }
      // Essay needs manual grading, score remains 0 or null.

      if (studentAnswer) {
        gradedAnswers.push(
          prisma.examAnswer.update({
            where: { id: studentAnswer.id },
            data: { isCorrect, score },
          })
        );
      }

      totalScore += score;
    }

    await prisma.$transaction(gradedAnswers);

    // Update attempt
    const finishedAttempt = await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'COMPLETED',
        finishedAt: new Date(),
        score: new Prisma.Decimal(totalScore),
      },
    });

    // Optionally update Gradebook if configured
    // This would require checking if a Grade entry exists or creating one.
    // For now, we store score in Attempt. Syncing to Gradebook can be a separate step or trigger.

    return finishedAttempt;
  }
}
