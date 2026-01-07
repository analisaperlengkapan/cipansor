import { prisma } from "../../lib/prisma";
import { PermitStatus, AttendanceStatus, PermitType } from "@prisma/client";
import { CreatePermitDto, UpdatePermitStatusDto, QueryPermitDto } from "./schema";

export async function createPermit(data: CreatePermitDto) {
  return prisma.permit.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    } as any,
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

  // Use a transaction to ensure atomicity
  return prisma.$transaction(async (tx) => {
    // 1. Update Permit
    const updatedPermit = await tx.permit.update({
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

    // 2. Auto-generate Attendance if Approved
    if (data.status === PermitStatus.APPROVED && updatedPermit.studentId) {
      // Get student's active class
      const enrollment = await tx.classEnrollment.findFirst({
        where: {
          studentId: updatedPermit.studentId,
          status: 'active',
        },
      });

      if (enrollment) {
        const dates: Date[] = [];
        const current = new Date(updatedPermit.startDate);
        const end = new Date(updatedPermit.endDate);
        const attendanceStatus = updatedPermit.type === PermitType.SAKIT ? AttendanceStatus.SICK : AttendanceStatus.EXCUSED;
        const notes = `Auto-generated from Permit ${updatedPermit.type}`;

        // Generate all dates in the range
        while (current <= end) {
          dates.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }

        if (dates.length > 0) {
          // Optimize: Update existing records first
          const updateResult = await tx.attendance.updateMany({
            where: {
              studentId: updatedPermit.studentId,
              classId: enrollment.classId,
              date: { in: dates },
            },
            data: {
              status: attendanceStatus,
              notes: notes,
              // recordedById is not updated to preserve original recorder if exists, or should it?
              // Usually we want to know who modified it last, but updateMany doesn't easily support relations or complex logic.
              // Let's assume updating status is enough.
            },
          });

          // Create missing records
          if (updateResult.count < dates.length) {
            const existingRecords = await tx.attendance.findMany({
              where: {
                studentId: updatedPermit.studentId,
                classId: enrollment.classId,
                date: { in: dates },
              },
              select: { date: true },
            });

            const existingDates = new Set(existingRecords.map((r) => r.date.getTime()));
            const missingDates = dates.filter((d) => !existingDates.has(d.getTime()));

            if (missingDates.length > 0) {
              await tx.attendance.createMany({
                data: missingDates.map((date) => ({
                  studentId: updatedPermit.studentId!,
                  classId: enrollment.classId,
                  date: date,
                  status: attendanceStatus,
                  notes: notes,
                  recordedById: approverId,
                })),
              });
            }
          }
        }
      }
    }

    return updatedPermit;
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
