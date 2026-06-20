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

  // Count registrants still active in the admissions pipeline
  // (i.e. not yet enrolled, rejected, or cancelled).
  const activeAdmissions = await prisma.registrant.count({
    where: {
      status: {
        in: ['REGISTERED', 'DOCUMENT_CHECK', 'TEST_SCHEDULED', 'TEST_COMPLETED', 'ACCEPTED'],
      },
    },
  });

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
    activeAdmissions,
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

  // Build by-unit breakdown with placeholder data
  const byUnit = units.map((u) => ({
    unitId: u.id,
    unitName: u.name,
    revenue: 0, // Placeholder - requires complex join through Invoice chain
    expense: 0, // Placeholder - requires expense tracking per unit
  }));

  // Build units array with net income for PR #3 UI compatibility
  const unitsWithNetIncome = byUnit.map((u) => ({
    ...u,
    netIncome: u.revenue - u.expense,
  }));

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
    units: unitsWithNetIncome,
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
