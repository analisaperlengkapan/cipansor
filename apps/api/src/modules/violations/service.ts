import { prisma } from '../../lib/prisma';
import { CreateViolationDto, UpdateViolationDto, QueryViolationDto } from './schema';
import { createNotification } from '../notifications/service';
import { NotificationType } from '@prisma/client';

export async function createViolation(data: CreateViolationDto, reportedById: string) {
  const result = await prisma.violation.create({
    data: {
      ...data,
      occurredAt: new Date(data.occurredAt),
      reportedById,
    } as any,
    include: {
      student: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          parents: { include: { parent: true } },
        },
      },
      reportedBy: { select: { id: true, name: true } },
      violationType: true,
    },
  });

  // Notify Parents
  if (result.student && result.student.parents.length > 0) {
    const violationName = result.violationType?.name || 'Pelanggaran';
    await Promise.allSettled(
      result.student.parents.map((sp) =>
        createNotification({
          userId: sp.parentId,
          type: NotificationType.ALERT,
          title: 'Laporan Pelanggaran Santri',
          message: `Ananda ${result.student.user.name} tercatat melakukan pelanggaran: ${violationName}. Mohon perhatian orang tua.`,
          data: { violationId: result.id },
        }).catch((e) => console.error('Failed to notify parent of violation', e))
      )
    );
  }

  return result;
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
        violationType: true,
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
      violationType: true,
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
    include: { violationType: true }
  });

  const totalPoints = await getStudentViolationPoints(studentId);

  // Group by violation type (using prisma groupBy)
  const byTypeRaw = await prisma.violation.groupBy({
    by: ['violationTypeId'],
    where: { studentId },
    _count: true,
  });

  // Need to fetch names separately or just use raw data if frontend accepts it
  // Assuming frontend handles it or we map it.
  // Let's keep it simple: Just return stats.

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
    byType: byTypeRaw, // Simplified
    byCategory,
  };
}

export async function getGlobalViolationSummary(unitId?: string, startDate?: Date, endDate?: Date) {
  const where = {
    ...(unitId && { student: { unitId } }),
    ...(startDate || endDate
      ? {
          occurredAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          },
        }
      : {}),
  };

  const totalViolations = await prisma.violation.count({ where });

  const byCategory = await prisma.violation.groupBy({
    by: ['category'],
    where,
    _count: { category: true },
    orderBy: { _count: { category: 'desc' } },
  });

  // Top Violators (Students with most points)
  // Prisma groupBy doesn't support summing relations easily without raw query or post-processing
  // For performance, let's use groupBy studentId and sum points
  const topStudentsRaw = await prisma.violation.groupBy({
    by: ['studentId'],
    where,
    _sum: { points: true },
    _count: { id: true },
    orderBy: { _sum: { points: 'desc' } },
    take: 5,
  });

  // Fetch student details
  const topStudents = await Promise.all(
    topStudentsRaw.map(async (item) => {
      const student = await prisma.student.findUnique({
        where: { id: item.studentId },
        include: { user: { select: { name: true } } },
      });
      return {
        studentId: item.studentId,
        name: student?.user.name || 'Unknown',
        points: item._sum.points || 0,
        count: item._count.id,
      };
    })
  );

  // Top Violation Types
  const topTypesRaw = await prisma.violation.groupBy({
    by: ['violationTypeId'],
    where,
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5,
  });

  const topViolationTypes = await Promise.all(
    topTypesRaw.map(async (item) => {
      // Handle case where violationTypeId might be null (though schema implies relation)
      if (!item.violationTypeId) return null;
      const type = await prisma.violationType.findUnique({
        where: { id: item.violationTypeId },
        select: { id: true, name: true },
      });
      return {
        violationTypeId: item.violationTypeId,
        name: type?.name || 'Unknown',
        count: item._count.id,
      };
    })
  );

  return {
    totalViolations,
    byCategory: byCategory.map((c) => ({ category: c.category, count: c._count.category })),
    topStudents,
    topViolationTypes: topViolationTypes.filter(t => t !== null),
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
