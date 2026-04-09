import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { ApiError, ErrorCode } from '@/middleware/error';
import { CreateSimaanInput, UpdateSimaanResultInput, ListSimaanQuery } from './takhosus.schema';

export const simaanService = {
  async create(data: CreateSimaanInput, creatorId: string) {
    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
      include: { takhosusEnrollment: true },
    });

    if (!student) {
      throw new ApiError(ErrorCode.NOT_FOUND, 'Student not found');
    }

    // Create simaan exam
    return prisma.simaanExam.create({
      data: {
        studentId: data.studentId,
        enrollmentId: student.takhosusEnrollment?.id,
        // @ts-ignore - Prisma enum mismatch workaroud or raw string
        simaanType: data.simaanType as any,
        examDate: new Date(data.examDate),
        juzStart: data.juzStart,
        juzEnd: data.juzEnd,
        // @ts-ignore
        duration: data.durationMinutes,
        notes: data.notes,
        examiners: {
          create: data.examinerIds.map((examinerId) => ({
            examinerId,
          })),
        },
      },
      include: {
        student: {
          include: { user: { select: { name: true } } },
        },
        examiners: {
          include: { examiner: { include: { user: { select: { name: true } } } } },
        },
      },
    });
  },

  async findAll(query: ListSimaanQuery) {
    const { page, limit, studentId, unitId, classId, startDate, endDate, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SimaanExamWhereInput = {
      ...(studentId && { studentId }),
      ...(unitId && { student: { unitId } }),
      ...(classId && { student: { enrollments: { some: { classId, status: 'active' } } } }),
      ...(startDate &&
        endDate && {
          examDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      // @ts-ignore
      ...(status && { status }), // Note: status field might be string in schema but inferred as enum in Prisma types
    };

    const [exams, total] = await Promise.all([
      prisma.simaanExam.findMany({
        where,
        skip,
        take: limit,
        orderBy: { examDate: 'desc' },
        include: {
          student: {
            include: { user: { select: { name: true } } },
          },
          examiners: {
            include: { examiner: { include: { user: { select: { name: true } } } } },
          },
          _count: {
            select: { examiners: true },
          },
        },
      }),
      prisma.simaanExam.count({ where }),
    ]);

    return {
      exams,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id: string) {
    const exam = await prisma.simaanExam.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            takhosusEnrollment: true,
          },
        },
        examiners: {
          include: { examiner: { include: { user: { select: { name: true } } } } },
        },
      },
    });

    if (!exam) {
      throw new ApiError(ErrorCode.NOT_FOUND, 'Simaan exam not found');
    }

    return exam;
  },

  async updateResult(id: string, data: UpdateSimaanResultInput) {
    // Lightweight existence check outside the transaction
    const examExists = await prisma.simaanExam.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!examExists) {
      throw new ApiError(ErrorCode.NOT_FOUND, 'Simaan exam not found');
    }

    const updatedExam = await prisma.$transaction(async (tx) => {
      // Re-read inside transaction for a consistent snapshot of enrollment data
      const exam = await tx.simaanExam.findUnique({
        where: { id },
        include: { student: { include: { takhosusEnrollment: true } } },
      });
      if (!exam) {
        throw new ApiError(ErrorCode.NOT_FOUND, 'Simaan exam not found');
      }

      const result = await tx.simaanExam.update({
        where: { id },
        data: {
          overallScore: data.overallScore,
          tajwidScore: data.tajwidScore,
          fashohaScore: data.fashohaScore,
          tartilScore: data.tartilScore,
          grade: data.grade,
          passed: data.passed,
          notes: data.notes,
          recommendations: data.recommendations,
          // @ts-ignore
          status: data.passed ? 'PASSED' : 'FAILED',
        },
      });

      if (data.passed && !exam.passed && exam.student.takhosusEnrollment) {
        // 1. Level-up trigger: If passed 30 juz simaan, mark enrollment as COMPLETED and eligible for certificate
        if (exam.juzEnd === 30 && exam.juzStart === 1) {
          await tx.takhosusEnrollment.update({
            where: { studentId: exam.studentId },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
              currentJuz: 30,
              notes: `Lulus Simaan 30 Juz pada ${new Date().toLocaleDateString()}`
            }
          });

          // 2. Auto-record Hafidz status
          await tx.hafidzStudent.upsert({
            where: { studentId: exam.studentId },
            create: {
              studentId: exam.studentId,
              completedAt: new Date(),
              notes: 'Lulus program Takhosus'
            },
            update: { completedAt: new Date() }
          });
        } else if (exam.juzEnd >= (exam.student.takhosusEnrollment.currentJuz || 0)) {
          // 3. Update current juz progress in enrollment if passed a juz simaan
          await tx.takhosusEnrollment.update({
            where: { studentId: exam.studentId },
            data: { currentJuz: Math.min(30, exam.juzEnd + 1) }
          });
        }
      } else if (!data.passed && exam.passed && exam.student.takhosusEnrollment) {
        // Revert side-effects when re-grading from passed to failed
        const enrollment = exam.student.takhosusEnrollment;

        if (exam.juzEnd === 30 && exam.juzStart === 1) {
          // Check if another passed 30-juz exam exists for this student
          const otherPassed30JuzExam = await tx.simaanExam.findFirst({
            where: {
              studentId: exam.studentId,
              id: { not: exam.id },
              passed: true,
              juzStart: 1,
              juzEnd: 30,
            },
            select: { id: true },
          });

          // Only revert if no other passed 30-juz exam justifies the completion
          if (!otherPassed30JuzExam) {
            if (enrollment.status === 'COMPLETED') {
              // Derive the correct currentJuz from other passed simaan exams
              const otherPassedExams = await tx.simaanExam.findMany({
                where: {
                  studentId: exam.studentId,
                  id: { not: exam.id },
                  passed: true,
                },
                select: { juzEnd: true },
                orderBy: { juzEnd: 'desc' },
                take: 1,
              });
              const derivedCurrentJuz = otherPassedExams.length > 0
                ? Math.min(30, otherPassedExams[0].juzEnd + 1)
                : 1;

              await tx.takhosusEnrollment.update({
                where: { studentId: exam.studentId },
                data: {
                  status: 'ACTIVE',
                  completedAt: null,
                  currentJuz: derivedCurrentJuz,
                  notes: null,
                }
              });
            }

            // Remove Hafidz record only if no other 30-juz pass exists
            await tx.hafidzStudent.deleteMany({
              where: { studentId: exam.studentId }
            });
          }
        } else if ((enrollment.currentJuz || 0) === Math.min(30, exam.juzEnd + 1)) {
          // Revert currentJuz bump: derive correct value from remaining passed exams
          // Only revert if the enrollment's currentJuz was likely set by this exam
          const otherPassedExams = await tx.simaanExam.findMany({
            where: {
              studentId: exam.studentId,
              id: { not: exam.id },
              passed: true,
            },
            select: { juzEnd: true },
            orderBy: { juzEnd: 'desc' },
            take: 1,
          });
          const derivedCurrentJuz = otherPassedExams.length > 0
            ? Math.min(30, otherPassedExams[0].juzEnd + 1)
            : 1;

          await tx.takhosusEnrollment.update({
            where: { studentId: exam.studentId },
            data: { currentJuz: derivedCurrentJuz }
          });
        }
      }

      return result;
    });

    return updatedExam;
  },

  async delete(id: string) {
    await prisma.simaanExam.delete({ where: { id } });
    return { success: true };
  },
};
