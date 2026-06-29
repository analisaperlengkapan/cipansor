import { prisma } from '@/lib/prisma';
import {
  Prisma,
  AttendanceStatus,
  CounselingCategory,
  PaymentStatus
} from '@prisma/client';

export interface Student360Data {
  profile: any;
  academic: {
    recentGrades: any[];
    averageScore: number;
    passRate: number;
  };
  tahfidz: {
    totalJuz: number;
    recentRecords: any[];
    progress: number;
  };
  attendance: {
    summary: {
      present: number;
      absent: number;
      late: number;
      sick: number;
      excused: number;
    };
    recentLogs: any[];
  };
  counseling: {
    recentSessions: any[];
    summaries: string[];
  };
  health: {
    recentRecords: any[];
    growthTrend: any[];
  };
  finance: {
    outstandingAmount: number;
    recentInvoices: any[];
    paymentStatus: string;
  };
}

export class Student360Service {
  async getStudent360(studentId: string): Promise<Student360Data> {
    const student = await prisma.student.findUniqueOrThrow({
      where: { id: studentId },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        unit: { select: { name: true, type: true } },
        enrollments: {
          where: { status: 'active' },
          include: { class: { select: { name: true, level: true } } },
          take: 1,
        },
      },
    });

    const [
      grades,
      tahfidzRecords,
      attendance,
      counseling,
      health,
      growth,
      invoices
    ] = await Promise.all([
      // Academic
      prisma.grade.findMany({
        where: { studentId },
        include: { subject: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // Tahfidz
      prisma.tahfidzRecord.findMany({
        where: { studentId },
        orderBy: { recordedAt: 'desc' },
        take: 10,
      }),
      // Attendance
      prisma.attendance.findMany({
        where: { studentId },
        orderBy: { date: 'desc' },
        take: 30,
      }),
      // Counseling
      prisma.counselingSession.findMany({
        where: { studentId },
        include: { counselor: { select: { user: { select: { name: true } } } } },
        orderBy: { scheduledAt: 'desc' },
        take: 5,
      }),
      // Health
      prisma.medicalRecord.findMany({
        where: { studentId },
        orderBy: { visitDate: 'desc' },
        take: 5,
      }),
      // Growth
      prisma.growthRecord.findMany({
        where: { studentId },
        orderBy: { recordDate: 'asc' },
      }),
      // Finance
      prisma.invoice.findMany({
        where: { studentId },
        orderBy: { dueDate: 'desc' },
        take: 5,
      }),
    ]);

    // Calculate aggregated metrics
    const avgScore = grades.length > 0
      ? grades.reduce((sum, g) => sum + Number(g.score), 0) / grades.length
      : 0;

    const attendanceSummary = attendance.reduce((acc, curr) => {
      if (curr.status === AttendanceStatus.PRESENT) acc.present++;
      else if (curr.status === AttendanceStatus.ABSENT) acc.absent++;
      else if (curr.status === AttendanceStatus.LATE) acc.late++;
      else if (curr.status === AttendanceStatus.SICK) acc.sick++;
      else if (curr.status === AttendanceStatus.EXCUSED) acc.excused++;
      return acc;
    }, { present: 0, absent: 0, late: 0, sick: 0, excused: 0 });

    const outstanding = invoices.reduce((sum, inv) => {
      if (inv.status !== PaymentStatus.PAID) {
        return sum + (Number(inv.amount) - Number(inv.paidAmount));
      }
      return sum;
    }, 0);

    // Get unique Juz count for Tahfidz progress
    const uniqueJuz = new Set(tahfidzRecords.map(r => r.juz)).size;

    return {
      profile: {
        id: student.id,
        name: student.user.name,
        nis: student.nis,
        email: student.user.email,
        unit: student.unit.name,
        class: student.enrollments[0]?.class?.name || 'N/A',
      },
      academic: {
        recentGrades: grades,
        averageScore: Number(avgScore.toFixed(2)),
        passRate: 0, // Placeholder
      },
      tahfidz: {
        totalJuz: uniqueJuz,
        recentRecords: tahfidzRecords,
        progress: (uniqueJuz / 30) * 100,
      },
      attendance: {
        summary: attendanceSummary,
        recentLogs: attendance,
      },
      counseling: {
        recentSessions: counseling,
        summaries: counseling
          .filter(s => s.category === CounselingCategory.PSYCHOLOGICAL_OBSERVATION)
          .map(s => s.summary || '')
          .filter(Boolean),
      },
      health: {
        recentRecords: health,
        growthTrend: growth.map(g => ({
          date: g.recordDate,
          weight: g.weight,
          height: g.height,
        })),
      },
      finance: {
        outstandingAmount: outstanding,
        recentInvoices: invoices,
        paymentStatus: outstanding > 0 ? 'PENDING' : 'CLEAR',
      },
    };
  }
}

export const student360Service = new Student360Service();
