import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface DateRange {
  startDate?: string;
  endDate?: string;
}

// ==================== DASHBOARD OVERVIEW ====================

export async function getDashboardStats(unitId?: string) {
  const unitFilter = unitId ? { unitId } : {};
  
  const [
    totalStudents,
    totalTeachers,
    totalStaff,
    totalClasses,
    totalAlumni,
    activeStudents,
    pendingPayments,
    todayAttendance,
  ] = await Promise.all([
    prisma.student.count({ where: { ...unitFilter, deletedAt: null } }),
    prisma.teacher.count({ where: { ...unitFilter, deletedAt: null } }),
    prisma.staff.count({ where: { ...unitFilter, deletedAt: null } }),
    prisma.class.count({ where: { ...unitFilter, deletedAt: null } }),
    prisma.alumni.count({ where: { ...unitFilter, deletedAt: null } }),
    prisma.student.count({ where: { ...unitFilter, status: "active", deletedAt: null } }),
    prisma.invoice.count({ where: { status: { in: ["PENDING", "PARTIAL"] } } }),
    prisma.attendance.count({
      where: {
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
        status: "PRESENT",
      },
    }),
  ]);

  return {
    students: { total: totalStudents, active: activeStudents },
    teachers: totalTeachers,
    staff: totalStaff,
    classes: totalClasses,
    alumni: totalAlumni,
    finance: { pendingPayments },
    attendance: { todayPresent: todayAttendance },
  };
}

// ==================== STUDENT STATISTICS ====================

export async function getStudentStats(unitId?: string) {
  const unitFilter = unitId ? { unitId } : {};

  const [byStatus, byGender, byUnit, enrollmentTrend] = await Promise.all([
    prisma.student.groupBy({
      by: ["status"],
      where: { ...unitFilter, deletedAt: null },
      _count: true,
    }),
    prisma.student.groupBy({
      by: ["gender"],
      where: { ...unitFilter, deletedAt: null },
      _count: true,
    }),
    prisma.student.groupBy({
      by: ["unitId"],
      where: { deletedAt: null },
      _count: true,
    }),
    // Enrollment by year
    prisma.student.groupBy({
      by: ["entryYear"],
      where: { ...unitFilter, deletedAt: null, entryYear: { not: null } },
      _count: true,
      orderBy: { entryYear: "desc" },
      take: 5,
    }),
  ]);

  // Get unit names for stats
  const unitIds = byUnit.map(u => u.unitId);
  const units = await prisma.unit.findMany({
    where: { id: { in: unitIds } },
    select: { id: true, name: true, type: true },
  });

  return {
    byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count])),
    byGender: Object.fromEntries(byGender.map(g => [g.gender, g._count])),
    byUnit: byUnit.map(u => ({
      unitId: u.unitId,
      unitName: units.find(unit => unit.id === u.unitId)?.name || "Unknown",
      count: u._count,
    })),
    enrollmentTrend: enrollmentTrend.map(e => ({
      year: e.entryYear,
      count: e._count,
    })),
  };
}

// ==================== TAHFIDZ STATISTICS ====================

export async function getTahfidzStats(unitId?: string, dateRange?: DateRange) {
  const where: Prisma.TahfidzRecordWhereInput = {
    ...(unitId && { student: { unitId } }),
    ...(dateRange?.startDate && dateRange?.endDate && {
      createdAt: {
        gte: new Date(dateRange.startDate),
        lte: new Date(dateRange.endDate),
      },
    }),
  };

  const [byActivity, byScore, topStudents, recentRecords] = await Promise.all([
    prisma.tahfidzRecord.groupBy({
      by: ["activityType"],
      where,
      _count: true,
      _avg: { score: true },
    }),
    // Score distribution
    prisma.tahfidzRecord.groupBy({
      by: ["score"],
      where,
      _count: true,
    }),
    // Top students by total ayah
    prisma.tahfidzRecord.groupBy({
      by: ["studentId"],
      where,
      _sum: { totalAyah: true },
      orderBy: { _sum: { totalAyah: "desc" } },
      take: 10,
    }),
    // Recent activity
    prisma.tahfidzRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        student: { select: { id: true, nis: true, user: { select: { name: true } } } },
      },
    }),
  ]);

  // Get student names for top students
  const studentIds = topStudents.map(s => s.studentId);
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    include: { user: { select: { name: true } } },
  });

  return {
    byActivity: byActivity.map(a => ({
      type: a.activityType,
      count: a._count,
      avgScore: Number(a._avg.score?.toFixed(2)) || 0,
    })),
    scoreDistribution: byScore.map(s => ({
      score: s.score,
      count: s._count,
    })).sort((a, b) => (a.score || 0) - (b.score || 0)),
    topStudents: topStudents.map(s => {
      const student = students.find(st => st.id === s.studentId);
      return {
        studentId: s.studentId,
        name: student?.user.name || "Unknown",
        totalAyah: s._sum.totalAyah || 0,
      };
    }),
    recentActivity: recentRecords.map(r => ({
      id: r.id,
      studentName: r.student.user.name,
      activityType: r.activityType,
      surahName: r.surahName,
      ayahStart: r.ayahStart,
      ayahEnd: r.ayahEnd,
      score: r.score,
      createdAt: r.createdAt,
    })),
  };
}

// ==================== FINANCE STATISTICS ====================

export async function getFinanceStats(unitId?: string, dateRange?: DateRange) {
  const invoiceWhere: Prisma.InvoiceWhereInput = {
    ...(unitId && { student: { unitId } }),
    ...(dateRange?.startDate && dateRange?.endDate && {
      createdAt: {
        gte: new Date(dateRange.startDate),
        lte: new Date(dateRange.endDate),
      },
    }),
  };

  const paymentWhere: Prisma.PaymentWhereInput = {
    ...(dateRange?.startDate && dateRange?.endDate && {
      paidAt: {
        gte: new Date(dateRange.startDate),
        lte: new Date(dateRange.endDate),
      },
    }),
  };

  const [invoiceStats, paymentStats, byStatus, byMethod, monthlyRevenue] = await Promise.all([
    prisma.invoice.aggregate({
      where: invoiceWhere,
      _sum: { amount: true, paidAmount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: paymentWhere,
      _sum: { amount: true },
      _count: true,
    }),
    prisma.invoice.groupBy({
      by: ["status"],
      where: invoiceWhere,
      _count: true,
      _sum: { amount: true },
    }),
    prisma.payment.groupBy({
      by: ["method"],
      where: paymentWhere,
      _count: true,
      _sum: { amount: true },
    }),
    // Monthly revenue for last 12 months
    prisma.$queryRaw<Array<{ month: string; total: bigint }>>`
      SELECT 
        TO_CHAR(paid_at, 'YYYY-MM') as month,
        COALESCE(SUM(amount), 0)::bigint as total
      FROM payments
      WHERE paid_at >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(paid_at, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `,
  ]);

  return {
    summary: {
      totalInvoiced: Number(invoiceStats._sum.amount) || 0,
      totalPaid: Number(invoiceStats._sum.paidAmount) || 0,
      totalPayments: Number(paymentStats._sum.amount) || 0,
      invoiceCount: invoiceStats._count,
      paymentCount: paymentStats._count,
      outstandingBalance: (Number(invoiceStats._sum.amount) || 0) - (Number(invoiceStats._sum.paidAmount) || 0),
    },
    byStatus: byStatus.map(s => ({
      status: s.status,
      count: s._count,
      amount: Number(s._sum.amount) || 0,
    })),
    byMethod: byMethod.map(m => ({
      method: m.method,
      count: m._count,
      amount: Number(m._sum.amount) || 0,
    })),
    monthlyRevenue: monthlyRevenue.map(m => ({
      month: m.month,
      total: Number(m.total),
    })),
  };
}

// ==================== ATTENDANCE STATISTICS ====================

export async function getAttendanceStats(unitId?: string, dateRange?: DateRange) {
  const where: Prisma.AttendanceWhereInput = {
    ...(unitId && { student: { unitId } }),
    ...(dateRange?.startDate && dateRange?.endDate && {
      date: {
        gte: new Date(dateRange.startDate),
        lte: new Date(dateRange.endDate),
      },
    }),
  };

  const [byStatus, dailyTrend, byClass] = await Promise.all([
    prisma.attendance.groupBy({
      by: ["status"],
      where,
      _count: true,
    }),
    // Daily attendance for last 30 days
    prisma.$queryRaw<Array<{ date: Date; present: bigint; total: bigint }>>`
      SELECT 
        date::date as date,
        COUNT(CASE WHEN status = 'PRESENT' THEN 1 END)::bigint as present,
        COUNT(*)::bigint as total
      FROM attendances
      WHERE date >= NOW() - INTERVAL '30 days'
      GROUP BY date::date
      ORDER BY date DESC
    `,
    // By class
    prisma.attendance.groupBy({
      by: ["classId"],
      where: { ...where, status: "PRESENT" },
      _count: true,
    }),
  ]);

  // Get class names
  const classIds = byClass.map(c => c.classId);
  const classes = await prisma.class.findMany({
    where: { id: { in: classIds } },
    select: { id: true, name: true, level: true },
  });

  const totalRecords = byStatus.reduce((sum, s) => sum + s._count, 0);
  const presentCount = byStatus.find(s => s.status === "PRESENT")?._count || 0;

  return {
    summary: {
      totalRecords,
      presentCount,
      absentCount: totalRecords - presentCount,
      attendanceRate: totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(2) : 0,
    },
    byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count])),
    dailyTrend: dailyTrend.map(d => ({
      date: d.date,
      present: Number(d.present),
      total: Number(d.total),
      rate: Number(d.total) > 0 ? ((Number(d.present) / Number(d.total)) * 100).toFixed(2) : 0,
    })),
    byClass: byClass.map(c => {
      const cls = classes.find(cl => cl.id === c.classId);
      return {
        classId: c.classId,
        className: cls?.name || "Unknown",
        level: cls?.level || "",
        presentCount: c._count,
      };
    }),
  };
}

// ==================== ACADEMIC STATISTICS ====================

export async function getAcademicStats(unitId?: string) {
  const unitFilter = unitId ? { unitId } : {};

  const [examStats, gradeDistribution, subjectPerformance] = await Promise.all([
    // Exam statistics
    prisma.exam.aggregate({
      where: unitFilter,
      _count: true,
    }),
    // Grade distribution
    prisma.grade.groupBy({
      by: ["letterGrade"],
      _count: true,
      _avg: { percentage: true },
    }),
    // Average performance by subject
    prisma.grade.groupBy({
      by: ["subjectId"],
      _avg: { percentage: true },
      _count: true,
    }),
  ]);

  // Get subject names
  const subjectIds = subjectPerformance.map(s => s.subjectId);
  const subjects = await prisma.subject.findMany({
    where: { id: { in: subjectIds } },
    select: { id: true, name: true, code: true },
  });

  return {
    exams: {
      totalExams: examStats._count,
    },
    gradeDistribution: gradeDistribution
      .filter(g => g.letterGrade)
      .map(g => ({
        grade: g.letterGrade,
        count: g._count,
        avgPercentage: Number(g._avg.percentage?.toFixed(2)) || 0,
      }))
      .sort((a, b) => (a.grade || "").localeCompare(b.grade || "")),
    subjectPerformance: subjectPerformance.map(s => {
      const subject = subjects.find(sub => sub.id === s.subjectId);
      return {
        subjectId: s.subjectId,
        subjectName: subject?.name || "Unknown",
        subjectCode: subject?.code || "",
        avgPercentage: Number(s._avg.percentage?.toFixed(2)) || 0,
        gradeCount: s._count,
      };
    }).sort((a, b) => b.avgPercentage - a.avgPercentage),
  };
}

// ==================== LIBRARY STATISTICS ====================

export async function getLibraryStats(unitId?: string) {
  const unitFilter = unitId ? { unitId } : {};

  const [bookStats, borrowingStats, overdue, popularBooks] = await Promise.all([
    prisma.book.aggregate({
      where: unitFilter,
      _sum: { quantity: true, available: true },
      _count: true,
    }),
    prisma.borrowing.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.borrowing.count({
      where: { status: "OVERDUE" },
    }),
    // Most borrowed books
    prisma.borrowing.groupBy({
      by: ["bookId"],
      _count: true,
      orderBy: { _count: { bookId: "desc" } },
      take: 10,
    }),
  ]);

  // Get book titles
  const bookIds = popularBooks.map(b => b.bookId);
  const books = await prisma.book.findMany({
    where: { id: { in: bookIds } },
    select: { id: true, title: true, author: true },
  });

  return {
    books: {
      totalBooks: bookStats._count,
      totalCopies: Number(bookStats._sum.quantity) || 0,
      available: Number(bookStats._sum.available) || 0,
    },
    borrowings: Object.fromEntries(borrowingStats.map(b => [b.status, b._count])),
    overdue,
    popularBooks: popularBooks.map(b => {
      const book = books.find(bk => bk.id === b.bookId);
      return {
        bookId: b.bookId,
        title: book?.title || "Unknown",
        author: book?.author || "",
        borrowCount: b._count,
      };
    }),
  };
}

// ==================== PSB STATISTICS ====================

export async function getPSBStats(unitId?: string) {
  const unitFilter = unitId ? { admissionPeriod: { unitId } } : {};

  const [registrantStats, byStatus, byPeriod] = await Promise.all([
    prisma.registrant.count({ where: unitFilter }),
    prisma.registrant.groupBy({
      by: ["status"],
      where: unitFilter,
      _count: true,
    }),
    prisma.admissionPeriod.findMany({
      where: { ...(unitId && { unitId }) },
      include: {
        _count: { select: { registrants: true } },
      },
      orderBy: { startDate: "desc" },
      take: 5,
    }),
  ]);

  return {
    totalRegistrants: registrantStats,
    byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count])),
    byPeriod: byPeriod.map(p => ({
      periodId: p.id,
      periodName: p.name,
      quota: p.quota,
      registrantCount: p._count.registrants,
      startDate: p.startDate,
      endDate: p.endDate,
      isActive: p.isActive,
    })),
  };
}
