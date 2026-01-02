import { prisma } from '@/lib/prisma';
import { Errors } from '@/middleware/error';
import { UserRole, Prisma, AttendanceStatus as PrismaAttendanceStatus } from '@prisma/client';
import {
  AttendanceStatus,
  CreateAttendanceInput,
  BulkAttendanceInput,
  UpdateAttendanceInput,
  Attendance,
  AttendanceCalendarResponse,
  AttendanceSummary
} from '@cipansor/shared';
import type {
  ListAttendanceQuery,
  AttendanceSummaryQuery,
} from './attendance.schema';

export class AttendanceService {
  /**
   * Get attendance records with pagination
   */
  async findAll(query: ListAttendanceQuery, currentUser: { role: UserRole; unitId: string | null }) {
    const { page, limit, classId, studentId, date, startDate, endDate, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AttendanceWhereInput = {};

    // Filter by unit for non-super-admins
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      where.student = {
        unitId: currentUser.unitId || 'none',
      };
    }

    if (classId) {
      where.classId = classId;
    }

    if (studentId) {
      where.studentId = studentId;
    }

    if (status) {
      // Cast shared status to Prisma status (safe because we aligned them)
      where.status = status as unknown as PrismaAttendanceStatus;
    }

    // Date filtering
    if (date) {
      const targetDate = new Date(date);
      where.date = {
        gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        lt: new Date(targetDate.setHours(23, 59, 59, 999)),
      };
    } else if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        include: {
          student: {
            include: {
              user: {
                select: { id: true, name: true },
              },
            },
          },
          class: {
            select: { id: true, name: true, level: true },
          },
          recordedBy: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.attendance.count({ where }),
    ]);

    // Map to shared type Attendance
    const mappedRecords: Attendance[] = records.map(r => ({
      ...r,
      date: r.date,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      status: r.status as unknown as AttendanceStatus
    }));

    return {
      records: mappedRecords,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single attendance record
   */
  async findById(id: string): Promise<Attendance> {
    const attendance = await prisma.attendance.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            unit: { select: { id: true, name: true } },
          },
        },
        class: true,
        recordedBy: { select: { id: true, name: true } },
      },
    });

    if (!attendance) {
      throw Errors.notFound('Attendance record');
    }

    return {
      ...attendance,
      status: attendance.status as unknown as AttendanceStatus
    };
  }

  /**
   * Create single attendance record
   */
  async create(input: CreateAttendanceInput, recordedById: string): Promise<Attendance> {
    // Verify student exists
    const student = await prisma.student.findFirst({
      where: { id: input.studentId, deletedAt: null },
    });

    if (!student) {
      throw Errors.notFound('Student');
    }

    // Verify class exists and student is enrolled
    const enrollment = await prisma.classEnrollment.findFirst({
      where: {
        studentId: input.studentId,
        classId: input.classId,
        status: 'active',
      },
    });

    if (!enrollment) {
      throw Errors.badRequest('Student is not enrolled in this class');
    }

    // Check for duplicate attendance on same date
    const inputDate = new Date(input.date);
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        studentId: input.studentId,
        classId: input.classId,
        date: {
          gte: new Date(new Date(inputDate).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(inputDate).setHours(23, 59, 59, 999)),
        },
      },
    });

    if (existingAttendance) {
      throw Errors.conflict('Attendance already recorded for this student on this date');
    }

    const attendance = await prisma.attendance.create({
      data: {
        studentId: input.studentId,
        classId: input.classId,
        date: inputDate,
        status: input.status as unknown as PrismaAttendanceStatus,
        notes: input.notes,
        recordedById,
      },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        class: { select: { id: true, name: true } },
      },
    });

    return {
      ...attendance,
      status: attendance.status as unknown as AttendanceStatus
    };
  }

  /**
   * Bulk create attendance for a class
   */
  async bulkCreate(input: BulkAttendanceInput, recordedById: string) {
    // Verify class exists
    const classData = await prisma.class.findFirst({
      where: { id: input.classId, deletedAt: null },
    });

    if (!classData) {
      throw Errors.notFound('Class');
    }

    // Get all enrolled students
    const enrolledStudentIds = await prisma.classEnrollment.findMany({
      where: { classId: input.classId, status: 'active' },
      select: { studentId: true },
    }).then(e => e.map(x => x.studentId));

    // Validate all students are enrolled
    for (const record of input.records) {
      if (!enrolledStudentIds.includes(record.studentId)) {
        throw Errors.badRequest(`Student ${record.studentId} is not enrolled in this class`);
      }
    }

    // Check for existing attendance on this date
    const targetDate = new Date(input.date);
    const existingAttendance = await prisma.attendance.findMany({
      where: {
        classId: input.classId,
        date: {
          gte: new Date(targetDate.setHours(0, 0, 0, 0)),
          lt: new Date(new Date(targetDate).setHours(23, 59, 59, 999)),
        },
      },
      select: { studentId: true },
    });

    const existingStudentIds = new Set(existingAttendance.map(a => a.studentId));

    // Filter out students who already have attendance
    const newRecords = input.records.filter(r => !existingStudentIds.has(r.studentId));

    if (newRecords.length === 0) {
      throw Errors.conflict('All students already have attendance recorded for this date');
    }

    // Create attendance records
    const created = await prisma.attendance.createMany({
      data: newRecords.map(record => ({
        studentId: record.studentId,
        classId: input.classId,
        date: targetDate,
        status: record.status as unknown as PrismaAttendanceStatus,
        notes: record.notes,
        recordedById,
      })),
    });

    return {
      created: created.count,
      skipped: input.records.length - newRecords.length,
    };
  }

  /**
   * Update attendance record
   */
  async update(id: string, input: UpdateAttendanceInput): Promise<Attendance> {
    const attendance = await prisma.attendance.findUnique({
      where: { id },
    });

    if (!attendance) {
      throw Errors.notFound('Attendance record');
    }

    const updated = await prisma.attendance.update({
      where: { id },
      data: {
        status: input.status ? (input.status as unknown as PrismaAttendanceStatus) : undefined,
        notes: input.notes,
      },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        class: { select: { id: true, name: true } },
      },
    });

    return {
      ...updated,
      status: updated.status as unknown as AttendanceStatus
    };
  }

  /**
   * Delete attendance record
   */
  async delete(id: string) {
    const attendance = await prisma.attendance.findUnique({
      where: { id },
    });

    if (!attendance) {
      throw Errors.notFound('Attendance record');
    }

    await prisma.attendance.delete({
      where: { id },
    });

    return { message: 'Attendance record deleted' };
  }

  /**
   * Get attendance summary/statistics
   */
  async getSummary(query: AttendanceSummaryQuery, currentUser: { role: UserRole; unitId: string | null }): Promise<AttendanceSummary> {
    const { classId, studentId, startDate, endDate } = query;

    const where: Prisma.AttendanceWhereInput = {
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    // Filter by unit for non-super-admins
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      where.student = {
        unitId: currentUser.unitId || 'none',
      };
    }

    if (classId) {
      where.classId = classId;
    }

    if (studentId) {
      where.studentId = studentId;
    }

    // Get counts by status
    const statusCounts = await prisma.attendance.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
    });

    // Get total count
    const total = await prisma.attendance.count({ where });

    // Transform to summary object
    const counts = {
      total,
      present: 0,
      absent: 0,
      late: 0,
      sick: 0,
      excused: 0,
    };

    for (const item of statusCounts) {
      const statusKey = item.status.toLowerCase();
      // Ensure we map known statuses correctly
      if (statusKey === 'present') counts.present = item._count._all;
      else if (statusKey === 'absent') counts.absent = item._count._all;
      else if (statusKey === 'late') counts.late = item._count._all;
      else if (statusKey === 'sick') counts.sick = item._count._all;
      else if (statusKey === 'excused') counts.excused = item._count._all;
    }

    // Calculate percentages
    const percentages = {
      present: total > 0 ? ((counts.present / total) * 100).toFixed(1) : '0',
      absent: total > 0 ? ((counts.absent / total) * 100).toFixed(1) : '0',
      late: total > 0 ? ((counts.late / total) * 100).toFixed(1) : '0',
      sick: total > 0 ? ((counts.sick / total) * 100).toFixed(1) : '0',
      excused: total > 0 ? ((counts.excused / total) * 100).toFixed(1) : '0',
    };

    return {
      period: { startDate, endDate },
      counts,
      percentages,
    };
  }

  /**
   * Get attendance calendar for a class (monthly view)
   */
  async getCalendar(classId: string, year: number, month: number, currentUser: { role: UserRole; unitId: string | null }): Promise<AttendanceCalendarResponse> {
    // Get class info
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        unit: { select: { id: true, name: true } },
        enrollments: { where: { status: 'active' }, select: { id: true } },
      },
    });

    if (!classInfo) {
      throw Errors.notFound('Class');
    }

    // Check permission for non-super-admins
    if (currentUser.role !== UserRole.SUPER_ADMIN && classInfo.unitId !== currentUser.unitId) {
      throw Errors.forbidden('Access denied to this class');
    }

    const totalStudents = classInfo.enrollments.length;

    // Calculate start and end of month
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // Get all attendance records for the month
    const attendances = await prisma.attendance.findMany({
      where: {
        classId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        date: true,
        status: true,
      },
    });

    // Group by date and count statuses
    const dayMap = new Map<string, {
      present: number;
      absent: number;
      late: number;
      sick: number;
      excused: number;
      total: number;
    }>();

    for (const att of attendances) {
      const dateKey = att.date.toISOString().split('T')[0];
      
      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, { present: 0, absent: 0, late: 0, sick: 0, excused: 0, total: 0 });
      }
      
      const day = dayMap.get(dateKey)!;
      day.total++;
      
      switch (att.status) {
        case 'PRESENT': day.present++; break;
        case 'ABSENT': day.absent++; break;
        case 'LATE': day.late++; break;
        case 'SICK': day.sick++; break;
        case 'EXCUSED': day.excused++; break;
      }
    }

    // Convert to array sorted by date
    const days = Array.from(dayMap.entries())
      .map(([date, counts]) => ({
        date,
        ...counts,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate summary
    const totalSchoolDays = days.length;
    const totalPresent = days.reduce((sum, d) => sum + d.present, 0);
    const totalRecords = days.reduce((sum, d) => sum + d.total, 0);
    const avgAttendanceRate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

    return {
      classId,
      className: classInfo.name,
      year,
      month,
      days,
      summary: {
        totalStudents,
        totalSchoolDays,
        avgAttendanceRate,
      },
    };
  }
}

export const attendanceService = new AttendanceService();
