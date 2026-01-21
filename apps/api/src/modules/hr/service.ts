import { prisma } from '../../lib/prisma';
import {
  Prisma,
  LeaveStatus,
  StaffAttendanceStatus,
  LeaveType,
  UserRole,
  User,
} from '@prisma/client';
import {
  CreateStaffAttendanceInput,
  UpdateStaffAttendanceInput,
  BulkAttendanceInput,
  CreateLeaveInput,
  UpdateLeaveInput,
  ApproveLeaveInput,
  CreateEmployeeInput,
  UpdateEmployeeInput,
} from './schema';
import bcrypt from 'bcryptjs';
import { Errors } from '../../middleware/error';

// =====================================
// EMPLOYEE SERVICE (UNIFIED TEACHER & STAFF)
// =====================================

export async function getEmployees(params: {
  page: number;
  limit: number;
  unitId?: string;
  role?: 'TEACHER' | 'STAFF';
  search?: string;
}) {
  const { page, limit, unitId, role, search } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    role: role ? (role as UserRole) : { in: [UserRole.TEACHER, UserRole.STAFF] },
  };

  if (unitId) where.unitId = unitId;

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { teacher: { nip: { contains: search, mode: 'insensitive' } } },
      { staff: { nip: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        unit: { select: { id: true, name: true } },
        teacher: true,
        staff: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getEmployeeById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      unit: { select: { id: true, name: true } },
      teacher: true,
      staff: true,
    },
  });
}

export async function createEmployee(data: CreateEmployeeInput) {
  // Validate unique email
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw Errors.badRequest('Email already exists');
  }

  // Hash password (default to 'password123' if not provided)
  const password = data.password || 'password123';
  const passwordHash = await bcrypt.hash(password, 10);

  return prisma.$transaction(async (tx) => {
    // 1. Create User
    const user = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role as UserRole,
        unitId: data.unitId,
        phone: data.phone,
      },
    });

    // 2. Create Profile based on Role
    if (data.role === 'TEACHER') {
      await tx.teacher.create({
        data: {
          userId: user.id,
          unitId: data.unitId,
          nip: data.nip,
          nuptk: data.nuptk,
          gender: data.gender,
          birthPlace: data.birthPlace,
          birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
          address: data.address,
          nik: data.nik,
          noKK: data.noKK,
          religion: data.religion || 'ISLAM',
          joinDate: data.joinDate ? new Date(data.joinDate) : undefined,
          employmentStatus: data.employmentStatus,
          specialization: data.specialization,
          certificationNumber: data.certificationNumber,
        },
      });
    } else {
      // STAFF
      if (!data.position) throw Errors.badRequest('Position is required for Staff');

      await tx.staff.create({
        data: {
          userId: user.id,
          unitId: data.unitId,
          nip: data.nip,
          position: data.position,
          department: data.department,
          joinDate: data.joinDate ? new Date(data.joinDate) : undefined,
        },
      });
    }

    return user;
  });
}

export async function updateEmployee(id: string, data: UpdateEmployeeInput) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { teacher: true, staff: true },
  });

  if (!user) throw Errors.notFound('Employee not found');

  return prisma.$transaction(async (tx) => {
    // 1. Update User
    const updatedUser = await tx.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        unitId: data.unitId,
        phone: data.phone,
        isActive: data.isActive,
      },
    });

    // 2. Update Profile
    if (user.role === 'TEACHER' && user.teacher) {
      await tx.teacher.update({
        where: { id: user.teacher.id },
        data: {
          nip: data.nip,
          nuptk: data.nuptk,
          gender: data.gender,
          birthPlace: data.birthPlace,
          birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
          address: data.address,
          nik: data.nik,
          noKK: data.noKK,
          religion: data.religion,
          joinDate: data.joinDate ? new Date(data.joinDate) : undefined,
          employmentStatus: data.employmentStatus,
          specialization: data.specialization,
          certificationNumber: data.certificationNumber,
          unitId: data.unitId, // Update unit if user moved
        },
      });
    } else if (user.role === 'STAFF' && user.staff) {
      await tx.staff.update({
        where: { id: user.staff.id },
        data: {
          nip: data.nip,
          position: data.position,
          department: data.department,
          joinDate: data.joinDate ? new Date(data.joinDate) : undefined,
          unitId: data.unitId,
        },
      });
    }

    return updatedUser;
  });
}

export async function deleteEmployee(id: string) {
  // Soft delete user and related profile
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        email: `deleted_${id}_${Date.now()}@example.com`, // Free up email
      },
      include: { teacher: true, staff: true },
    });

    if (user.teacher) {
      await tx.teacher.update({
        where: { id: user.teacher.id },
        data: { deletedAt: new Date(), nip: null, nuptk: null },
      });
    }

    if (user.staff) {
      await tx.staff.update({
        where: { id: user.staff.id },
        data: { deletedAt: new Date(), nip: null },
      });
    }

    return user;
  });
}

// =====================================
// STAFF ATTENDANCE SERVICE
// =====================================

export async function getStaffAttendance(params: {
  page: number;
  limit: number;
  staffId?: string;
  unitId?: string;
  status?: StaffAttendanceStatus;
  startDate?: string;
  endDate?: string;
}) {
  const { page, limit, staffId, unitId, status, startDate, endDate } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.StaffAttendanceWhereInput = {};

  if (staffId) where.staffId = staffId;
  if (unitId) where.staff = { unitId };
  if (status) where.status = status;

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const [data, total] = await Promise.all([
    prisma.staffAttendance.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'desc' },
      include: {
        staff: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            unit: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.staffAttendance.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getStaffAttendanceById(id: string) {
  return prisma.staffAttendance.findUnique({
    where: { id },
    include: {
      staff: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          unit: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export async function createStaffAttendance(data: CreateStaffAttendanceInput) {
  const date = new Date(data.date);
  date.setHours(0, 0, 0, 0);

  return prisma.staffAttendance.create({
    data: {
      staffId: data.staffId,
      teacherId: data.teacherId,
      date,
      status: data.status,
      checkIn: data.checkIn ? new Date(data.checkIn) : undefined,
      checkOut: data.checkOut ? new Date(data.checkOut) : undefined,
      notes: data.notes,
    },
  });
}

export async function updateStaffAttendance(id: string, data: UpdateStaffAttendanceInput) {
  return prisma.staffAttendance.update({
    where: { id },
    data: {
      status: data.status,
      checkIn: data.checkIn ? new Date(data.checkIn) : undefined,
      checkOut: data.checkOut ? new Date(data.checkOut) : undefined,
      notes: data.notes,
    },
  });
}

export async function recordBulkAttendance(data: BulkAttendanceInput) {
  const date = new Date(data.date);
  date.setHours(0, 0, 0, 0);

  const results = await prisma.$transaction(
    data.records.map((record) => {
      // Handle upsert with new composite key
      // Must explicitly set the other ID to null for the unique constraint
      const whereUnique = record.staffId
        ? { staffId_teacherId_date: { staffId: record.staffId, teacherId: null, date } }
        : { staffId_teacherId_date: { staffId: null, teacherId: record.teacherId!, date } };

      return prisma.staffAttendance.upsert({
        where: whereUnique as any,
        update: {
          status: record.status,
          checkIn: record.checkIn ? new Date(record.checkIn) : undefined,
          checkOut: record.checkOut ? new Date(record.checkOut) : undefined,
          notes: record.notes,
        },
        create: {
          staffId: record.staffId,
          teacherId: record.teacherId,
          date,
          status: record.status,
          checkIn: record.checkIn ? new Date(record.checkIn) : undefined,
          checkOut: record.checkOut ? new Date(record.checkOut) : undefined,
          notes: record.notes,
        },
      });
    })
  );

  return { count: results.length, records: results };
}

export async function getStaffAttendanceSummary(staffId: string, month: number, year: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const records = await prisma.staffAttendance.findMany({
    where: {
      staffId,
      date: { gte: startDate, lte: endDate },
    },
  });

  const summary = records.reduce(
    (acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    staffId,
    month,
    year,
    totalDays: endDate.getDate(),
    recordedDays: records.length,
    summary,
  };
}

export async function deleteStaffAttendance(id: string) {
  return prisma.staffAttendance.delete({ where: { id } });
}

// =====================================
// LEAVE SERVICE
// =====================================

function calculateTotalDays(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

export async function getLeaves(params: {
  page: number;
  limit: number;
  staffId?: string;
  teacherId?: string;
  unitId?: string;
  type?: LeaveType;
  status?: LeaveStatus;
  startDate?: string;
  endDate?: string;
}) {
  const { page, limit, staffId, teacherId, unitId, type, status, startDate, endDate } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.LeaveWhereInput = {};

  if (staffId) where.staffId = staffId;
  if (teacherId) where.teacherId = teacherId;
  if (unitId) {
    where.OR = [{ staff: { unitId } }, { teacher: { unitId } }];
  }
  if (type) where.type = type;
  if (status) where.status = status;

  if (startDate || endDate) {
    where.OR = [
      {
        startDate: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      },
      {
        endDate: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.leave.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        staff: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            unit: { select: { id: true, name: true } },
          },
        },
        teacher: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            unit: { select: { id: true, name: true } },
          },
        },
        approvedBy: { select: { id: true, name: true } },
      },
    }),
    prisma.leave.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getLeaveById(id: string) {
  return prisma.leave.findUnique({
    where: { id },
    include: {
      staff: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          unit: { select: { id: true, name: true } },
        },
      },
      teacher: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          unit: { select: { id: true, name: true } },
        },
      },
      approvedBy: { select: { id: true, name: true } },
    },
  });
}

export async function createLeave(data: CreateLeaveInput) {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  const totalDays = calculateTotalDays(startDate, endDate);

  if (!data.staffId && !data.teacherId) {
    throw Errors.badRequest('Either staffId or teacherId must be provided');
  }

  return prisma.leave.create({
    data: {
      staffId: data.staffId,
      teacherId: data.teacherId,
      type: data.type,
      startDate,
      endDate,
      totalDays,
      reason: data.reason,
    },
  });
}

export async function updateLeave(id: string, data: UpdateLeaveInput) {
  const updateData: Prisma.LeaveUpdateInput = {
    type: data.type,
    reason: data.reason,
  };

  if (data.startDate || data.endDate) {
    const leave = await prisma.leave.findUnique({ where: { id } });
    if (leave) {
      const startDate = data.startDate ? new Date(data.startDate) : leave.startDate;
      const endDate = data.endDate ? new Date(data.endDate) : leave.endDate;
      updateData.startDate = startDate;
      updateData.endDate = endDate;
      updateData.totalDays = calculateTotalDays(startDate, endDate);
    }
  }

  return prisma.leave.update({ where: { id }, data: updateData });
}

export async function approveLeave(id: string, approverId: string, data: ApproveLeaveInput) {
  const updateData: Prisma.LeaveUpdateInput = {
    status: data.status,
    approvedBy: { connect: { id: approverId } },
    approvedAt: new Date(),
  };

  if (data.status === LeaveStatus.REJECTED && data.rejectedNote) {
    updateData.rejectedNote = data.rejectedNote;
  }

  const leave = await prisma.leave.update({
    where: { id },
    data: updateData,
    include: { staff: true, teacher: true },
  });

  // If approved, mark staff/teacher attendance as LEAVE for those days
  if (data.status === LeaveStatus.APPROVED) {
    // 1. Update Leave Balance
    const userId = leave.staff?.userId || leave.teacher?.userId;
    if (userId) {
      // Find relevant academic year for the leave start date
      const academicYear = await prisma.academicYear.findFirst({
        where: {
          startDate: { lte: leave.startDate },
          endDate: { gte: leave.startDate },
          isActive: true, // Prefer active, but date match is key
        },
      });

      if (academicYear) {
        // Update balance if exists
        const balance = await prisma.leaveBalance.findUnique({
          where: {
            userId_academicYearId_leaveType: {
              userId,
              academicYearId: academicYear.id,
              leaveType: leave.type,
            },
          },
        });

        if (balance) {
          await prisma.leaveBalance.update({
            where: { id: balance.id },
            data: {
              usedDays: { increment: leave.totalDays },
              remainingDays: { decrement: leave.totalDays },
            },
          });
        }
      }
    }

    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);

    const dates: Date[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Determine target ID (staff or teacher)
    const staffId = leave.staffId;
    const teacherId = leave.teacherId;

    const transactionOperations = dates
      .map((date) => {
        // Construct upsert args carefully
        // Note: For upsert to work with @@unique([staffId, teacherId, date]),
        // we must explicitly set the other ID to null in the where clause
        // AND ensure the type safety for Prisma client

        if (staffId) {
          return prisma.staffAttendance.upsert({
            where: {
              staffId_teacherId_date: { staffId: staffId, teacherId: null, date } as any,
            },
            update: { status: StaffAttendanceStatus.LEAVE, notes: `Cuti: ${leave.type}` },
            create: {
              staffId: staffId,
              date,
              status: StaffAttendanceStatus.LEAVE,
              notes: `Cuti: ${leave.type}`,
            },
          });
        } else if (teacherId) {
          return prisma.staffAttendance.upsert({
            where: {
              staffId_teacherId_date: { staffId: null, teacherId: teacherId, date } as any,
            },
            update: { status: StaffAttendanceStatus.LEAVE, notes: `Cuti: ${leave.type}` },
            create: {
              teacherId: teacherId,
              date,
              status: StaffAttendanceStatus.LEAVE,
              notes: `Cuti: ${leave.type}`,
            },
          });
        }

        return null;
      })
      .filter((op): op is Prisma.Prisma__StaffAttendanceClient<any, never> => op !== null);

    await prisma.$transaction(transactionOperations);
  }

  return leave;
}

export async function cancelLeave(id: string) {
  return prisma.leave.update({
    where: { id },
    data: { status: LeaveStatus.CANCELLED },
  });
}

export async function deleteLeave(id: string) {
  const leave = await prisma.leave.findUnique({ where: { id } });
  if (leave?.status === LeaveStatus.APPROVED) {
    throw new Error('Cannot delete approved leave');
  }
  return prisma.leave.delete({ where: { id } });
}

export async function getLeaveBalance(employeeId: string, year: number) {
  // Check both staff and teacher
  const leaves = await prisma.leave.findMany({
    where: {
      OR: [{ staffId: employeeId }, { teacherId: employeeId }],
      status: LeaveStatus.APPROVED,
      startDate: {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31),
      },
    },
  });

  const usedByType = leaves.reduce(
    (acc, leave) => {
      acc[leave.type] = (acc[leave.type] || 0) + leave.totalDays;
      return acc;
    },
    {} as Record<string, number>
  );

  // Default annual leave quota (can be configured per company policy)
  const annualQuota = 12;

  return {
    employeeId,
    year,
    annualQuota,
    usedAnnual: usedByType[LeaveType.ANNUAL] || 0,
    remainingAnnual: annualQuota - (usedByType[LeaveType.ANNUAL] || 0),
    usedByType,
    totalUsed: leaves.reduce((sum, leave) => sum + leave.totalDays, 0),
  };
}

// =====================================
// STAFF SERVICE (for HR listing)
// =====================================

export async function getStaffList(params: {
  page: number;
  limit: number;
  unitId?: string;
  department?: string;
  search?: string;
}) {
  const { page, limit, unitId, department, search } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.StaffWhereInput = {
    deletedAt: null,
  };

  if (unitId) where.unitId = unitId;
  if (department) where.department = department;

  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { nip: { contains: search, mode: 'insensitive' } },
      { position: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.staff.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
        unit: { select: { id: true, name: true } },
      },
    }),
    prisma.staff.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getStaffById(id: string) {
  return prisma.staff.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
      unit: { select: { id: true, name: true } },
    },
  });
}
