import { prisma } from "../../lib/prisma";
import { PermitStatus } from "@prisma/client";
import { CreatePermitDto, UpdatePermitStatusDto, QueryPermitDto } from "./schema";

export async function createPermit(data: CreatePermitDto) {
  return prisma.permit.create({
    data: {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    },
    include: {
      student: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
}

export async function getPermits(query: QueryPermitDto) {
  const { studentId, type, status, startDate, endDate, page, limit } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(studentId && { studentId }),
    ...(type && { type }),
    ...(status && { status }),
    ...(startDate && { startDate: { gte: new Date(startDate) } }),
    ...(endDate && { endDate: { lte: new Date(endDate) } }),
  };

  const [data, total] = await Promise.all([
    prisma.permit.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.permit.count({ where }),
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

export async function getPermitById(id: string) {
  return prisma.permit.findUnique({
    where: { id },
    include: {
      student: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          unit: { select: { id: true, name: true } },
        },
      },
      approvedBy: { select: { id: true, name: true } },
    },
  });
}

export async function updatePermitStatus(
  id: string,
  data: UpdatePermitStatusDto,
  approverId: string
) {
  const updateData: any = {
    status: data.status,
  };

  if (data.status === PermitStatus.APPROVED) {
    updateData.approvedById = approverId;
    updateData.approvedAt = new Date();
  } else if (data.status === PermitStatus.REJECTED) {
    updateData.approvedById = approverId;
    updateData.rejectionNote = data.rejectionNote;
  }

  return prisma.permit.update({
    where: { id },
    data: updateData,
    include: {
      student: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      approvedBy: { select: { id: true, name: true } },
    },
  });
}

export async function markReturned(id: string, returnedAt?: string) {
  return prisma.permit.update({
    where: { id },
    data: {
      status: PermitStatus.COMPLETED,
      returnedAt: returnedAt ? new Date(returnedAt) : new Date(),
    },
  });
}

export async function getStudentActivePermit(studentId: string) {
  return prisma.permit.findFirst({
    where: {
      studentId,
      status: PermitStatus.APPROVED,
      returnedAt: null,
    },
    include: {
      student: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export async function getPermitStats(unitId?: string) {
  const where = unitId
    ? { student: { unitId } }
    : {};

  const [pending, approved, active, completed] = await Promise.all([
    prisma.permit.count({
      where: { ...where, status: PermitStatus.PENDING },
    }),
    prisma.permit.count({
      where: { ...where, status: PermitStatus.APPROVED },
    }),
    prisma.permit.count({
      where: {
        ...where,
        status: PermitStatus.APPROVED,
        returnedAt: null,
      },
    }),
    prisma.permit.count({
      where: { ...where, status: PermitStatus.COMPLETED },
    }),
  ]);

  return { pending, approved, active, completed };
}
