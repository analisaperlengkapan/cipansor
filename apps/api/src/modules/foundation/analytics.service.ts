import { prisma } from '../../lib/prisma';
import {
  FoundationExecutiveSummary,
  FoundationFinancialOverview,
  FoundationUnitComparison,
} from '@cipansor/shared';

/**
 * Get executive summary statistics for the foundation
 * Includes total counts and growth metrics
 */
export async function getExecutiveSummary(): Promise<FoundationExecutiveSummary> {
  // Count active students
  const totalStudents = await prisma.student.count({
    where: { status: 'ACTIVE' },
  });

  // Count teachers via role assignments (roles containing GURU)
  const totalTeachers = await prisma.userRoleAssignment.count({
    where: {
      role: {
        code: { in: ['TKQ_GURU', 'SDIT_GURU', 'SMPIT_GURU', 'SMAQ_GURU', 'MUSYRIF'] },
      },
      isActive: true,
    },
  });

  // Count staff via role assignments (admin/tata usaha roles)
  const totalStaff = await prisma.userRoleAssignment.count({
    where: {
      role: {
        code: { in: ['TKQ_TATA_USAHA', 'SDIT_TATA_USAHA', 'SMPIT_TATA_USAHA', 'SMAQ_TATA_USAHA'] },
      },
      isActive: true,
    },
  });

  // Count units
  const totalUnits = await prisma.unit.count();

  // Calculate growth based on students created in the last month
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const studentsLastMonth = await prisma.student.count({
    where: {
      status: 'ACTIVE',
      createdAt: { lt: oneMonthAgo },
    },
  });

  const growth =
    studentsLastMonth > 0 ? ((totalStudents - studentsLastMonth) / studentsLastMonth) * 100 : 0;

  return {
    totalStudents,
    totalTeachers,
    totalStaff,
    totalUnits,
    growth: {
      students: Number(growth.toFixed(1)),
    },
  };
}

/**
 * Get financial overview including current/last month comparison
 * and breakdown by unit
 */
export async function getFinancialOverview(): Promise<FoundationFinancialOverview> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Helper to get totals from journal entries
  const getTotals = async (start: Date, end: Date) => {
    // Revenue (Credit balance on Revenue accounts - code starting with '4')
    const revenue = await prisma.journalEntry.aggregate({
      _sum: { credit: true },
      where: {
        date: { gte: start, lte: end },
        account: { code: { startsWith: '4' } },
      },
    });

    // Expense (Debit balance on Expense accounts - code starting with '5')
    const expense = await prisma.journalEntry.aggregate({
      _sum: { debit: true },
      where: {
        date: { gte: start, lte: end },
        account: { code: { startsWith: '5' } },
      },
    });

    return {
      revenue: Number(revenue._sum.credit || 0),
      expense: Number(expense._sum.debit || 0),
      net: Number(revenue._sum.credit || 0) - Number(expense._sum.debit || 0),
    };
  };

  const [current, last] = await Promise.all([
    getTotals(startOfMonth, endOfMonth),
    getTotals(startOfLastMonth, endOfLastMonth),
  ]);

  // Get all units for breakdown
  const units = await prisma.unit.findMany({
    select: { id: true, name: true },
  });

  // Calculate Revenue per Unit (Credit sum of account starting with '4')
  const revenueByUnit = await prisma.journalEntry.groupBy({
    by: ['unitId'],
    _sum: { credit: true },
    where: {
      date: { gte: startOfMonth, lte: endOfMonth },
      account: { code: { startsWith: '4' } },
    },
  });

  // Calculate Expense per Unit (Debit sum of account starting with '5')
  const expenseByUnit = await prisma.journalEntry.groupBy({
    by: ['unitId'],
    _sum: { debit: true },
    where: {
      date: { gte: startOfMonth, lte: endOfMonth },
      account: { code: { startsWith: '5' } },
    },
  });

  // Build by-unit breakdown with real data
  const byUnit = units.map((u) => {
    const rev = revenueByUnit.find((r) => r.unitId === u.id);
    const exp = expenseByUnit.find((e) => e.unitId === u.id);
    const revenue = Number(rev?._sum.credit || 0);
    const expense = Number(exp?._sum.debit || 0);

    return {
      unitId: u.id,
      unitName: u.name,
      revenue,
      expense,
      netIncome: revenue - expense,
    };
  });

  // Get expense composition by account for pie chart
  const expensesByAccount = await prisma.journalEntry.groupBy({
    by: ['accountId'],
    _sum: { debit: true },
    where: {
      date: { gte: startOfMonth, lte: endOfMonth },
      account: { code: { startsWith: '5' } },
    },
    orderBy: { _sum: { debit: 'desc' } },
    take: 6,
  });

  const accountIds = expensesByAccount.map((e) => e.accountId);
  const accounts = await prisma.accountCode.findMany({
    where: { id: { in: accountIds } },
    select: { id: true, name: true },
  });

  const expenseComposition = expensesByAccount.map((e) => {
    const account = accounts.find((a) => a.id === e.accountId);
    return {
      name: account?.name || 'Lainnya',
      value: Number(e._sum.debit || 0),
    };
  });

  return {
    currentMonth: current,
    lastMonth: last,
    byUnit,
    units: byUnit, // Alias for backward compatibility if needed
    expenseComposition,
  };
}

/**
 * Get comparison metrics for all units
 * Includes student/teacher counts and ratios
 */
export async function getUnitComparison(): Promise<FoundationUnitComparison[]> {
  // Get units with student counts
  const units = await prisma.unit.findMany({
    include: {
      _count: {
        select: {
          students: { where: { status: 'ACTIVE' } },
        },
      },
    },
  });

  // Get teacher counts by unit via role assignments
  const teachersByUnit = await prisma.userRoleAssignment.groupBy({
    by: ['unitId'],
    _count: { _all: true },
    where: {
      role: {
        code: { in: ['TKQ_GURU', 'SDIT_GURU', 'SMPIT_GURU', 'SMAQ_GURU', 'MUSYRIF'] },
      },
      isActive: true,
      unitId: { not: null },
    },
  });

  return units.map((u) => {
    const teacherData = teachersByUnit.find((t) => t.unitId === u.id);
    const teacherCount = teacherData?._count?._all || 0;
    const studentCount = u._count.students;

    return {
      unitId: u.id,
      unitName: u.name,
      studentCount,
      teacherCount,
      studentTeacherRatio: teacherCount > 0 ? Number((studentCount / teacherCount).toFixed(1)) : 0,
      averageGrade: 0, // Placeholder - requires complex grade aggregation
    };
  });
}

/**
 * Get asset overview
 * Total value, condition stats, category stats, unit breakdown
 */
export async function getAssetOverview() {
  // Aggregate asset values by unit
  // Note: Assuming 'purchasePrice' is the value to track.
  // In a real scenario, book value (depreciated) might be better, but 'purchasePrice' is simpler.
  const assets = await prisma.asset.findMany({
    select: {
      unitId: true,
      purchasePrice: true,
      condition: true,
      categoryId: true,
      category: { select: { name: true } },
    },
    where: { status: 'ACTIVE' }
  });

  const totalValue = assets.reduce((sum, asset) => sum + Number(asset.purchasePrice || 0), 0);
  const totalCount = assets.length;

  // Condition Stats
  const conditionStats = assets.reduce((acc, asset) => {
    const condition = asset.condition || 'UNKNOWN';
    acc[condition] = (acc[condition] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const conditions = Object.keys(conditionStats).map(key => ({
    name: key,
    value: conditionStats[key]
  }));

  // Category Stats
  const categoryStats = assets.reduce((acc, asset) => {
    const category = asset.category?.name || 'Uncategorized';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categories = Object.keys(categoryStats).map(key => ({
    name: key,
    value: categoryStats[key]
  }));

  // Unit Breakdown
  const units = await prisma.unit.findMany({ select: { id: true, name: true } });
  const byUnit = units.map(u => {
    const unitAssets = assets.filter(a => a.unitId === u.id);
    const value = unitAssets.reduce((sum, a) => sum + Number(a.purchasePrice || 0), 0);
    return {
      unitId: u.id,
      unitName: u.name,
      assetCount: unitAssets.length,
      totalValue: value
    };
  });

  return {
    totalValue,
    totalCount,
    conditions,
    categories,
    byUnit
  };
}

/**
 * Get HR overview
 * Teacher certification stats, Staffing distribution
 */
export async function getHROverview() {
  const units = await prisma.unit.findMany({
    select: { id: true, name: true }
  });

  // Get Teachers
  const teachers = await prisma.teacher.findMany({
    select: {
      unitId: true,
      certificationStatus: true,
      employmentStatus: true,
    },
    where: {
       deletedAt: null
    }
  });

  // Get Staff
  const staff = await prisma.staff.findMany({
    select: { unitId: true },
    where: { deletedAt: null }
  });

  // Aggregate Certification Status
  const certificationStats = teachers.reduce((acc, teacher) => {
    const status = teacher.certificationStatus || 'BELUM_SERTIFIKASI';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const certifications = Object.keys(certificationStats).map(key => ({
    name: key.replace('_', ' '),
    value: certificationStats[key]
  }));

  // Aggregate Employment Status
  const employmentStats = teachers.reduce((acc, teacher) => {
    const status = teacher.employmentStatus || 'UNKNOWN';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const employmentStatus = Object.keys(employmentStats).map(key => ({
    name: key.replace('_', ' '),
    value: employmentStats[key]
  }));

  // Unit Breakdown
  const byUnit = units.map(u => {
    const unitTeachers = teachers.filter(t => t.unitId === u.id);
    const unitStaff = staff.filter(s => s.unitId === u.id);
    const certifiedCount = unitTeachers.filter(t => t.certificationStatus === 'SUDAH_SERTIFIKASI').length;

    return {
      unitId: u.id,
      unitName: u.name,
      teacherCount: unitTeachers.length,
      staffCount: unitStaff.length,
      certifiedTeacherCount: certifiedCount,
      certificationRatio: unitTeachers.length > 0 ? (certifiedCount / unitTeachers.length) * 100 : 0
    };
  });

  return {
    totalTeachers: teachers.length,
    totalStaff: staff.length,
    certifications,
    employmentStatus,
    byUnit
  };
}
