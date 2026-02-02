import { prisma } from '../../lib/prisma';
import { CreateViolationDto, UpdateViolationDto, QueryViolationDto } from './schema';

export async function createViolation(data: CreateViolationDto, reportedById: string) {
  const violation = await prisma.violation.create({
    data: {
      ...data,
      occurredAt: new Date(data.occurredAt),
      reportedById,
    } as any,
    include: {
      student: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      reportedBy: { select: { id: true, name: true } },
    },
  });

  // Check for auto-referral logic
  try {
    const totalPoints = await getStudentViolationPoints(data.studentId);
    if (totalPoints >= 50) {
      const activeSession = await prisma.counselingSession.findFirst({
        where: {
          studentId: data.studentId,
          status: { in: ['SCHEDULED' as any, 'IN_PROGRESS' as any] },
        },
      });

      if (!activeSession) {
        // Determine counselor: Try Reporter (if Teacher) -> Try Homeroom Teacher
        let counselorId: string | undefined;

        // Check if reporter is a teacher
        const reporterAsTeacher = await prisma.teacher.findUnique({
          where: { userId: reportedById },
        });

        if (reporterAsTeacher) {
          counselorId = reporterAsTeacher.id;
        } else {
          // Check homeroom teacher
          const enrollment = await prisma.classEnrollment.findFirst({
            where: { studentId: data.studentId, status: 'active' },
            include: { class: true },
          });
          if (enrollment?.class?.homeroomTeacherId) {
            counselorId = enrollment.class.homeroomTeacherId;
          }
        }

        if (counselorId) {
          const student = await prisma.student.findUnique({
            where: { id: data.studentId },
            select: { unitId: true },
          });

          if (student) {
            await prisma.counselingSession.create({
              data: {
                unitId: student.unitId,
                studentId: data.studentId,
                counselorId: counselorId,
                category: 'BEHAVIOR' as any,
                priority: 'HIGH' as any,
                title: 'Auto-referral: High Violation Points',
                description: `Student has accumulated ${totalPoints} violation points. Latest violation: ${data.description}`,
                scheduledAt: new Date(), // Schedule for today/now as placeholder
                status: 'SCHEDULED' as any,
                isConfidential: true,
              },
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in auto-referral logic:', error);
    // Don't block the violation creation
  }

  return violation;
}

export async function getViolations(query: QueryViolationDto) {
  const { studentId, type, category, startDate, endDate, page, limit } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(studentId && { studentId }),
    ...(type && { type }),
    ...(category && { category: { contains: category, mode: 'insensitive' as const } }),
    ...(startDate || endDate
      ? {
          occurredAt: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) }),
          },
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.violation.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            unit: { select: { id: true, name: true } },
          },
        },
        reportedBy: { select: { id: true, name: true } },
      },
      orderBy: { occurredAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.violation.count({ where }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getViolationById(id: string) {
  return prisma.violation.findUnique({
    where: { id },
    include: {
      student: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          unit: { select: { id: true, name: true } },
        },
      },
      reportedBy: { select: { id: true, name: true } },
    },
  });
}

export async function updateViolation(id: string, data: UpdateViolationDto) {
  return prisma.violation.update({
    where: { id },
    data: {
      ...data,
      ...(data.occurredAt && { occurredAt: new Date(data.occurredAt) }),
    },
    include: {
      student: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
      reportedBy: { select: { id: true, name: true } },
    },
  });
}

export async function deleteViolation(id: string) {
  return prisma.violation.delete({ where: { id } });
}

export async function getStudentViolationPoints(studentId: string) {
  const result = await prisma.violation.aggregate({
    where: { studentId },
    _sum: { points: true },
  });
  return result._sum.points || 0;
}

export async function getStudentViolationSummary(studentId: string) {
  const violations = await prisma.violation.findMany({
    where: { studentId },
    orderBy: { occurredAt: 'desc' },
    take: 10,
  });

  const totalPoints = await getStudentViolationPoints(studentId);

  const byType = await prisma.violation.groupBy({
    by: ['type'],
    where: { studentId },
    _count: true,
  });

  const byCategory = await prisma.violation.groupBy({
    by: ['category'],
    where: { studentId },
    _count: true,
    orderBy: { _count: { category: 'desc' } },
    take: 5,
  });

  return {
    totalPoints,
    recentViolations: violations,
    byType,
    byCategory,
  };
}

export async function getViolationCategories() {
  const categories = await prisma.violation.groupBy({
    by: ['category'],
    _count: true,
    orderBy: { _count: { category: 'desc' } },
  });
  return categories.map((c) => c.category);
}
