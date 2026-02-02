import { prisma } from '../../lib/prisma';
import { PermitStatus, AttendanceStatus, PermitType, UserRole } from '@prisma/client';
import { CreatePermitDto, UpdatePermitStatusDto, QueryPermitDto } from './schema';
import { Errors } from '../../middleware/error';
import { createNotification } from '../notifications/service';
import { NotificationType } from '@prisma/client';

// Helper to generate random code
function generatePermitCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'PMT-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createPermit(data: CreatePermitDto) {
  let code = generatePermitCode();
  let isUnique = false;

  // Ensure uniqueness (simple retry)
  while (!isUnique) {
    const existing = await prisma.permit.findUnique({ where: { code } });
    if (!existing) {
      isUnique = true;
    } else {
      code = generatePermitCode();
    }
  }

  return prisma.permit.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      ...data,
      code,
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
      orderBy: { createdAt: 'desc' },
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
            parents: { include: { parent: true } }, // Fetch parents for notification
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
        const attendanceStatus =
          updatedPermit.type === PermitType.SAKIT
            ? AttendanceStatus.SICK
            : AttendanceStatus.EXCUSED;
        const notes = `Auto-generated from Permit ${updatedPermit.type}`;

        // Generate all dates in the range
        while (current <= end) {
          dates.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }

        if (dates.length > 0) {
          const updateResult = await tx.attendance.updateMany({
            where: {
              studentId: updatedPermit.studentId,
              classId: enrollment.classId,
              date: { in: dates },
            },
            data: {
              status: attendanceStatus,
              notes: notes,
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

      // Notify Parents
      await Promise.allSettled(
        updatedPermit.student.parents.map((sp) =>
          createNotification({
            userId: sp.parentId,
            type: NotificationType.INFO,
            title: 'Izin Disetujui',
            message: `Pengajuan izin ${updatedPermit.type} untuk ${updatedPermit.student.user.name} telah disetujui.`,
            data: { permitId: updatedPermit.id },
          }).catch((e) => console.error('Failed to notify parent', e))
        )
      );
    } else if (data.status === PermitStatus.REJECTED) {
      // Notify Parents of Rejection
      await Promise.allSettled(
        updatedPermit.student.parents.map((sp) =>
          createNotification({
            userId: sp.parentId,
            type: NotificationType.INFO,
            title: 'Izin Ditolak',
            message: `Pengajuan izin untuk ${updatedPermit.student.user.name} ditolak. Alasan: ${updatedPermit.rejectionNote}`,
            data: { permitId: updatedPermit.id },
          }).catch((e) => console.error('Failed to notify parent', e))
        )
      );
    }

    return updatedPermit;
  });
}

export async function markReturned(id: string, returnedAt?: string) {
  const permit = await prisma.permit.findUnique({
    where: { id },
    include: {
      student: {
        include: {
          user: true,
          parents: { include: { parent: true } },
        },
      },
    },
  });
  if (!permit) throw Errors.notFound('Permit');

  const result = await prisma.permit.update({
    where: { id },
    data: {
      status: PermitStatus.COMPLETED,
      returnedAt: returnedAt ? new Date(returnedAt) : new Date(),
    },
  });

  // Notify Parents
  await Promise.allSettled(
    permit.student.parents.map((sp) =>
      createNotification({
        userId: sp.parentId,
        type: NotificationType.INFO,
        title: 'Santri Kembali',
        message: `${permit.student.user.name} telah kembali ke asrama.`,
        data: { permitId: permit.id },
      }).catch((e) => console.error('Failed to notify parent', e))
    )
  );

  return result;
}

export async function markDeparted(id: string) {
  const permit = await prisma.permit.findUnique({
    where: { id },
    include: {
      student: {
        include: {
          user: true,
          parents: { include: { parent: true } },
        },
      },
    },
  });

  if (!permit) throw Errors.notFound('Permit');
  if (permit.status !== PermitStatus.APPROVED) {
    throw Errors.badRequest('Permit must be APPROVED to depart');
  }

  const result = await prisma.permit.update({
    where: { id },
    data: {
      departedAt: new Date(),
    },
  });

  // Notify Parents
  await Promise.allSettled(
    permit.student.parents.map((sp) =>
      createNotification({
        userId: sp.parentId,
        type: NotificationType.INFO,
        title: 'Santri Keluar',
        message: `${permit.student.user.name} telah meninggalkan area pesantren sesuai izin.`,
        data: { permitId: permit.id },
      }).catch((e) => console.error('Failed to notify parent', e))
    )
  );

  return result;
}

export async function getPermitByCode(code: string) {
  const permit = await prisma.permit.findUnique({
    where: { code },
    include: {
      student: {
        include: {
          user: { select: { id: true, name: true, email: true } }, // Removed photoUrl
          unit: { select: { id: true, name: true } },
          // dormitories: { include: { dormitory: true, room: true } }, // Removed invalid relation
        },
      },
      approvedBy: { select: { id: true, name: true } },
    },
  });

  // Fetch room info manually if needed or add relation to include
  if (permit) {
    const roomAssignment = await prisma.roomAssignment.findFirst({
      where: { studentId: permit.studentId, isActive: true },
      include: { room: { include: { dormitory: true } } },
    });
    return { ...permit, roomAssignment };
  }

  return null;
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
  const where = unitId ? { student: { unitId } } : {};

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
