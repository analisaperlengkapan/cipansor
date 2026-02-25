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
        teacher: { select: { user: { select: { name: true } } } },
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
        teacher: { select: { user: { select: { name: true } } } },
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

  static async getStudentExams(studentId: string) {
    // 1. Get student's active class
    const enrollments = await prisma.classEnrollment.findMany({
      where: {
        studentId,
        status: 'active',
      },
      include: {
        class: true,
      },
    });

    if (enrollments.length === 0) {
      return []; // No active class, no exams
    }

    const classIds = enrollments.map((e) => e.classId);

    // 2. Find exams scheduled for this class
    // TODO: Add logic for specific student assignments if needed (not just class)
    const exams = await prisma.exam.findMany({
      where: {
        classId: { in: classIds },
        status: { in: ['SCHEDULED', 'ONGOING', 'COMPLETED', 'GRADED'] }, // Show upcoming and past
      },
        status: { in: ['SCHEDULED', 'ONGOING', 'COMPLETED', 'GRADED'] }, // Show upcoming and past
      },
      include: {
        subject: {
          select: { name: true, code: true },
        },
        attempts: {
          where: { studentId },
          take: 1,
          select: { status: true, score: true, finishedAt: true },
        },
      },
      orderBy: { scheduledAt: 'desc' },
    });

    return exams.map((exam) => ({
      ...exam,
      attemptStatus: exam.attempts[0]?.status || null,
      score: exam.attempts[0]?.score || null,
      finishedAt: exam.attempts[0]?.finishedAt || null,
    }));
  }

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

    // 2. Validate Student Eligibility (Same Class)
    const enrollment = await prisma.classEnrollment.findFirst({
      where: {
        studentId,
        status: 'active',
        classId: exam.classId,
      },
    });

    if (!enrollment) {
      throw Errors.forbidden('You are not enrolled in the class for this exam');
    }

    // 3. Check Timing
    const now = new Date();
    // Assuming simple logic: exam must be 'SCHEDULED' or 'ONGOING' and start time passed
    // Ideally we check if (now >= scheduledAt && now <= scheduledAt + duration)
    // For MVP, just check if it's not DRAFT.
    if (exam.status === 'DRAFT') {
      throw Errors.forbidden('Exam is not yet published');
    }

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
      // If completed, check if retake is allowed (not implemented yet, default NO)
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
            subject: { select: { name: true } },
            questionBank: {
              include: {
                questions: {
                  select: {
                    id: true,
                    type: true,
                    content: true,
                    options: true,
                    points: true,
                    // NO ANSWER KEY sent to frontend!
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
    // Verify attempt ownership
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      select: { studentId: true, status: true },
    });

    if (!attempt) throw Errors.notFound('Attempt not found');
    if (attempt.studentId !== studentId) throw Errors.forbidden('Access denied');
    if (attempt.status !== 'IN_PROGRESS') throw Errors.badRequest('Exam attempt is closed');

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
    let maxPossibleScore = 0;
    const questions = attempt.exam.questionBank?.questions || [];

    const gradedAnswers = [];

    for (const question of questions) {
      const studentAnswer = attempt.answers.find((a) => a.questionId === question.id);
      let isCorrect = false;
      let score = 0;
      maxPossibleScore += question.points;

      if (question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE') {
        const key = question.answerKey as any; // e.g. "opt-1"
        const studentAns = studentAnswer?.answer as any; // e.g. "opt-1"

        if (key && studentAns && key === studentAns) {
          isCorrect = true;
          score = question.points;
        }
      }
      // Essay needs manual grading, score remains 0.

      if (studentAnswer) {
        gradedAnswers.push(
          prisma.examAnswer.update({
            where: { id: studentAnswer.id },
            data: { isCorrect, score },
          })
        );
      } else {
        // Create empty answer record for unanswered questions if needed, or just ignore.
        // Better to verify everything is accounted for.
      }

      totalScore += score;
    }

    await prisma.$transaction(gradedAnswers);

    // Calculate final score based on Exam maxScore scaling
    // Exam maxScore is typically 100.
    // Raw score = totalScore / maxPossibleScore * exam.maxScore
    let finalScore = new Prisma.Decimal(totalScore);
    if (maxPossibleScore > 0) {
        const scale = Number(attempt.exam.maxScore) / maxPossibleScore;
        finalScore = new Prisma.Decimal(totalScore * scale);
    }

    // Update attempt
    const finishedAttempt = await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'COMPLETED',
        finishedAt: new Date(),
        score: finalScore,
      },
    });

    // Automatically create a Grade entry?
    // Doing it here ensures integration with Report Card.
    await prisma.grade.create({
        data: {
            studentId: attempt.studentId,
            examId: attempt.examId,
            academicYearId: attempt.exam.academicYearId,
            subjectId: attempt.exam.subjectId,
            type: 'EXAM',
            score: finalScore,
            maxScore: attempt.exam.maxScore,
            gradedById: attempt.exam.teacherId, // Auto-graded but attributed to teacher
            notes: 'Auto-graded from CBT',
        }
    });

    return finishedAttempt;
  }
}
