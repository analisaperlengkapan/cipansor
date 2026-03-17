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

interface CreateExamInput {
  unitId: string;
  academicYearId: string;
  subjectId: string;
  classId: string;
  teacherId: string;
  type: any; // ExamType
  title: string;
  description?: string;
  scheduledAt: Date | string;
  duration?: number;
  maxScore?: number;
  passingScore?: number;
  weight?: number;
  status?: any; // ExamStatus
  instructions?: string;
  questionBankId: string;
}

export class CBTService {
  // --- Question Banks ---

  static async createQuestionBank(data: CreateQuestionBankInput) {
    return prisma.questionBank.create({
      data: {
        unitId: data.unitId,
        teacherId: data.teacherId,
        title: data.title,
        description: data.description,
        subjectId: data.subjectId,
      },
    });
  }

  static async getQuestionBanks(query: {
    unitId?: string;
    teacherUserId?: string;
    subjectId?: string;
    search?: string;
  }) {
    const where: Prisma.QuestionBankWhereInput = {
      isActive: true,
    };

    if (query.unitId) where.unitId = query.unitId;
    if (query.teacherUserId) where.teacher = { userId: query.teacherUserId };
    if (query.subjectId) where.subjectId = query.subjectId;
    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }

    return prisma.questionBank.findMany({
      where,
      include: {
        teacher: { select: { user: { select: { name: true } } } },
        subject: { select: { name: true, code: true } },
        _count: { select: { questions: true, exams: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  static async getQuestionBankById(id: string, user: { id: string; role: string; unitId?: string }) {
    const bank = await prisma.questionBank.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { order: 'asc' } },
        teacher: { select: { userId: true, user: { select: { name: true } } } },
        subject: { select: { name: true, code: true } },
      },
    });

    if (!bank) throw Errors.notFound('Question Bank not found');

    if (user.role === 'UNIT_ADMIN' && bank.unitId !== user.unitId) {
      throw Errors.forbidden('You do not have permission to view Question Banks outside your unit');
    }

    if (
      user.role !== 'SUPER_ADMIN' &&
      user.role !== 'UNIT_ADMIN' &&
      bank.teacher.userId !== user.id
    ) {
      throw Errors.forbidden('You do not have permission to view this Question Bank');
    }

    return bank;
  }

  static async deleteQuestionBank(id: string, user: { id: string; role: string; unitId?: string }) {
    const bank = await prisma.questionBank.findUnique({
      where: { id },
      include: { teacher: { select: { userId: true } } },
    });
    if (!bank) throw Errors.notFound('Question Bank not found');

    if (user.role === 'UNIT_ADMIN' && bank.unitId !== user.unitId) {
      throw Errors.forbidden('You do not have permission to delete Question Banks outside your unit');
    }

    if (
      user.role !== 'SUPER_ADMIN' &&
      user.role !== 'UNIT_ADMIN' &&
      bank.teacher.userId !== user.id
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

  static async addQuestion(data: CreateQuestionInput, user: { id: string; role: string; unitId?: string }) {
    const bank = await prisma.questionBank.findUnique({
      where: { id: data.bankId },
      include: { teacher: { select: { userId: true } } },
    });
    if (!bank) throw Errors.notFound('Question Bank not found');

    if (user.role === 'UNIT_ADMIN' && bank.unitId !== user.unitId) {
      throw Errors.forbidden('You do not have permission to modify Question Banks outside your unit');
    }

    if (
      user.role !== 'SUPER_ADMIN' &&
      user.role !== 'UNIT_ADMIN' &&
      bank.teacher.userId !== user.id
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
    user: { id: string; role: string; unitId?: string }
  ) {
    const question = await prisma.question.findUnique({
      where: { id },
      include: { bank: { include: { teacher: { select: { userId: true } } } } },
    });
    if (!question) throw Errors.notFound('Question not found');

    if (user.role === 'UNIT_ADMIN' && question.bank.unitId !== user.unitId) {
      throw Errors.forbidden('You do not have permission to modify questions outside your unit');
    }

    if (
      user.role !== 'SUPER_ADMIN' &&
      user.role !== 'UNIT_ADMIN' &&
      question.bank.teacher.userId !== user.id
    ) {
      throw Errors.forbidden('You do not have permission to update this question');
    }

    return prisma.question.update({
      where: { id },
      data,
    });
  }

  static async deleteQuestion(id: string, user: { id: string; role: string; unitId?: string }) {
    const question = await prisma.question.findUnique({
      where: { id },
      include: { bank: { include: { teacher: { select: { userId: true } } } } },
    });
    if (!question) throw Errors.notFound('Question not found');

    if (user.role === 'UNIT_ADMIN' && question.bank.unitId !== user.unitId) {
      throw Errors.forbidden('You do not have permission to modify questions outside your unit');
    }

    if (
      user.role !== 'SUPER_ADMIN' &&
      user.role !== 'UNIT_ADMIN' &&
      question.bank.teacher.userId !== user.id
    ) {
      throw Errors.forbidden('You do not have permission to delete this question');
    }

    return prisma.question.delete({
      where: { id },
    });
  }

  // --- Exam Scheduling ---

  static async getExams(query: {
    page?: number;
    limit?: number;
    unitId?: string;
    academicYearId?: string;
    subjectId?: string;
    teacherUserId?: string;
    search?: string;
    status?: any;
  }) {
    const where: Prisma.ExamWhereInput = {};

    if (query.unitId) where.unitId = query.unitId;
    if (query.academicYearId) where.academicYearId = query.academicYearId;
    if (query.subjectId) where.subjectId = query.subjectId;
    if (query.teacherUserId) where.teacher = { userId: query.teacherUserId };
    if (query.status) where.status = query.status;
    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [total, data] = await prisma.$transaction([
      prisma.exam.count({ where }),
      prisma.exam.findMany({
        where,
        include: {
          subject: { select: { name: true } },
          class: { select: { name: true } },
          questionBank: { select: { title: true, _count: { select: { questions: true } } } },
          _count: { select: { attempts: true } },
        },
        orderBy: { scheduledAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data,
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  static async createExam(data: CreateExamInput, user: { id: string; role: string; unitId?: string }) {
    // Check question bank
    const bank = await prisma.questionBank.findUnique({
      where: { id: data.questionBankId },
      include: { questions: true, teacher: { select: { userId: true } } },
    });
    if (!bank) throw Errors.notFound('Question Bank not found');

    if (!bank.isActive) {
      throw Errors.badRequest('This Question Bank has been deactivated');
    }

    if (user.role === 'UNIT_ADMIN' && bank.unitId !== user.unitId) {
      throw Errors.forbidden('You do not have permission to use Question Banks outside your unit');
    }

    if (
      user.role !== 'SUPER_ADMIN' &&
      user.role !== 'UNIT_ADMIN' &&
      bank.teacher.userId !== user.id
    ) {
      throw Errors.forbidden('You do not have permission to use this Question Bank');
    }

    return prisma.exam.create({
      data: {
        unitId: data.unitId,
        academicYearId: data.academicYearId,
        subjectId: data.subjectId,
        classId: data.classId,
        teacherId: data.teacherId,
        type: data.type || 'MIDTERM',
        title: data.title,
        description: data.description,
        scheduledAt: new Date(data.scheduledAt),
        duration: data.duration ?? 60,
        maxScore: (data.maxScore ?? 100) as any,
        passingScore: (data.passingScore ?? 70) as any,
        weight: (data.weight ?? 1) as any,
        status: ['DRAFT', 'SCHEDULED'].includes(data.status) ? data.status : 'DRAFT',
        instructions: data.instructions,
        questionBankId: data.questionBankId,
      },
    });
  }

  static async getExamMonitoring(examId: string, user: { id: string; role: string; unitId?: string }) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        teacher: { select: { userId: true } },
        attempts: {
          include: {
            student: { select: { id: true, user: { select: { name: true } } } },
          },
        },
      },
    });

    if (!exam) throw Errors.notFound('Exam not found');

    if (user.role === 'UNIT_ADMIN' && exam.unitId !== user.unitId) {
      throw Errors.forbidden('You do not have permission to view exams outside your unit');
    }

    if (
      user.role !== 'SUPER_ADMIN' &&
      user.role !== 'UNIT_ADMIN' &&
      exam.teacher.userId !== user.id
    ) {
      throw Errors.forbidden('You do not have permission to view this exam');
    }

    return exam;
  }

  // --- Teacher Grading ---

  static async getAttemptForGrading(attemptId: string, user: { id: string; role: string; unitId?: string }) {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        student: { select: { id: true, user: { select: { name: true } } } },
        exam: {
          include: {
            teacher: { select: { userId: true } },
            questionBank: {
              include: { questions: true },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) throw Errors.notFound('Attempt not found');

    if (user.role === 'UNIT_ADMIN' && attempt.exam.unitId !== user.unitId) {
      throw Errors.forbidden('You do not have permission to grade exams outside your unit');
    }

    if (
      user.role !== 'SUPER_ADMIN' &&
      user.role !== 'UNIT_ADMIN' &&
      attempt.exam.teacher.userId !== user.id
    ) {
      throw Errors.forbidden('You do not have permission to grade this attempt');
    }

    return attempt;
  }

  static async gradeEssayAnswer(
    attemptId: string,
    questionId: string,
    grading: { score: number; isCorrect: boolean },
    user: { id: string; role: string; unitId?: string }
  ) {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: { select: { unitId: true, questionBankId: true, teacher: { select: { userId: true } } } },
      },
    });

    if (!attempt) throw Errors.notFound('Attempt not found');

    if (attempt.status === 'IN_PROGRESS') {
      throw Errors.badRequest('Cannot grade an attempt that is still in progress');
    }

    if (user.role === 'UNIT_ADMIN' && attempt.exam.unitId !== user.unitId) {
      throw Errors.forbidden('You do not have permission to grade exams outside your unit');
    }

    if (
      user.role !== 'SUPER_ADMIN' &&
      user.role !== 'UNIT_ADMIN' &&
      attempt.exam.teacher.userId !== user.id
    ) {
      throw Errors.forbidden('You do not have permission to grade this attempt');
    }

    return prisma.$transaction(async (tx) => {
      const question = await tx.question.findUnique({ where: { id: questionId } });
      if (!question) throw Errors.notFound('Question not found');

      if (question.bankId !== attempt.exam.questionBankId) {
        throw Errors.badRequest('Question does not belong to this exam');
      }

      if (question.type !== 'ESSAY') {
        throw Errors.badRequest('Only ESSAY questions can be manually graded');
      }

      if (
        typeof grading.score !== 'number' ||
        Number.isNaN(grading.score) ||
        grading.score < 0 ||
        grading.score > question.points
      ) {
        throw Errors.badRequest(`Score must be a valid number between 0 and ${question.points}`);
      }

      // Ensure answer exists
      const existingAnswer = await tx.examAnswer.findUnique({
        where: { attemptId_questionId: { attemptId, questionId } },
      });

      if (!existingAnswer) {
        throw Errors.badRequest('Cannot grade an unanswered question');
      }

      // Update the answer
      await tx.examAnswer.update({
        where: {
          attemptId_questionId: { attemptId, questionId },
        },
        data: {
          isCorrect: grading.isCorrect,
          score: grading.score as any,
        },
      });

      // Recalculate total score for attempt
      const allAnswers = await tx.examAnswer.findMany({
        where: { attemptId },
        include: { question: true },
      });

      const totalScore = allAnswers.reduce((sum, ans) => {
        const s = ans.score ? Number(ans.score) : 0;
        return sum + s;
      }, 0);

      // Check if any ESSAY answer is still lacking a score to decide status
      const hasUngradedEssay = allAnswers.some(
        (ans) => ans.question.type === 'ESSAY' && ans.score === null
      );

      return tx.examAttempt.update({
        where: { id: attemptId },
        data: {
          score: totalScore as any,
          status: hasUngradedEssay ? 'NEEDS_REVIEW' : 'COMPLETED'
        },
      });
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

  static async submitAnswer(attemptId: string, questionId: string, answer: any, studentId: string) {
    const attempt = await prisma.examAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw Errors.notFound('Attempt not found');
    if (attempt.studentId !== studentId) throw Errors.forbidden('Access denied');

    if (attempt.status !== 'IN_PROGRESS') {
      throw Errors.badRequest('Cannot submit answer for a completed or expired attempt');
    }

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

  static async finishExamAttempt(attemptId: string, studentId: string) {
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
    if (attempt.studentId !== studentId) throw Errors.forbidden('Access denied');
    if (attempt.status !== 'IN_PROGRESS') return attempt;

    // Auto grading
    let totalScore = 0;
    let hasEssay = false;
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
      } else if (question.type === 'ESSAY') {
        hasEssay = true;
      }
      // Essay needs manual grading, score remains 0 or null.

      if (studentAnswer) {
        const isEssay = question.type === 'ESSAY';
        gradedAnswers.push(
          prisma.examAnswer.update({
            where: { id: studentAnswer.id },
            data: {
              isCorrect: isEssay ? null : isCorrect,
              score: isEssay ? null : score,
            },
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
        status: hasEssay ? 'NEEDS_REVIEW' : 'COMPLETED',
        finishedAt: new Date(),
        score: totalScore as any,
      },
    });

    // Optionally update Gradebook if configured
    // This would require checking if a Grade entry exists or creating one.
    // For now, we store score in Attempt. Syncing to Gradebook can be a separate step or trigger.

    return finishedAttempt;
  }
}
