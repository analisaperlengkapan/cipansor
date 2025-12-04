import { prisma } from "../../lib/prisma";
import { Prisma, LeaveStatus, StaffAttendanceStatus, LeaveType } from "@prisma/client";
import {
  CreateStaffAttendanceInput,
  UpdateStaffAttendanceInput,
  BulkAttendanceInput,
  CreateLeaveInput,
  UpdateLeaveInput,
  ApproveLeaveInput,
} from "./schema";

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
      orderBy: { date: "desc" },
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
    data.records.map((record) =>
      prisma.staffAttendance.upsert({
        where: {
          staffId_date: { staffId: record.staffId, date },
        },
        update: {
          status: record.status,
          checkIn: record.checkIn ? new Date(record.checkIn) : undefined,
          checkOut: record.checkOut ? new Date(record.checkOut) : undefined,
          notes: record.notes,
        },
        create: {
          staffId: record.staffId,
          date,
          status: record.status,
          checkIn: record.checkIn ? new Date(record.checkIn) : undefined,
          checkOut: record.checkOut ? new Date(record.checkOut) : undefined,
          notes: record.notes,
        },
      })
    )
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
  unitId?: string;
  type?: LeaveType;
  status?: LeaveStatus;
  startDate?: string;
  endDate?: string;
}) {
  const { page, limit, staffId, unitId, type, status, startDate, endDate } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.LeaveWhereInput = {};

  if (staffId) where.staffId = staffId;
  if (unitId) where.staff = { unitId };
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
      orderBy: { createdAt: "desc" },
      include: {
        staff: {
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
      approvedBy: { select: { id: true, name: true } },
    },
  });
}

export async function createLeave(data: CreateLeaveInput) {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  const totalDays = calculateTotalDays(startDate, endDate);

  return prisma.leave.create({
    data: {
      staffId: data.staffId,
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
    include: { staff: true },
  });

  // If approved, mark staff attendance as LEAVE for those days
  if (data.status === LeaveStatus.APPROVED) {
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);
    
    const dates: Date[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    await prisma.$transaction(
      dates.map((date) =>
        prisma.staffAttendance.upsert({
          where: {
            staffId_date: { staffId: leave.staffId, date },
          },
          update: { status: StaffAttendanceStatus.LEAVE, notes: `Cuti: ${leave.type}` },
          create: {
            staffId: leave.staffId,
            date,
            status: StaffAttendanceStatus.LEAVE,
            notes: `Cuti: ${leave.type}`,
          },
        })
      )
    );
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
    throw new Error("Cannot delete approved leave");
  }
  return prisma.leave.delete({ where: { id } });
}

export async function getLeaveBalance(staffId: string, year: number) {
  const leaves = await prisma.leave.findMany({
    where: {
      staffId,
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
    staffId,
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
      { user: { name: { contains: search, mode: "insensitive" } } },
      { nip: { contains: search, mode: "insensitive" } },
      { position: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.staff.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
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
