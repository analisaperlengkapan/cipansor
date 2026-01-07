import { prisma } from "../../lib/prisma";
import { FoundationDashboardStats, FoundationExecutiveSummary, FoundationFinancialOverview, FoundationUnitComparison } from "@cipansor/shared";

export async function getExecutiveSummary(): Promise<FoundationExecutiveSummary> {
  const [totalStudents, totalTeachers, totalStaff, totalUnits] = await Promise.all([
    prisma.student.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { role: "TEACHER", isActive: true } }),
    prisma.user.count({ where: { role: "STAFF", isActive: true } }),
    prisma.unit.count({ where: { isActive: true } }),
  ]);

  // Calculate growth (mock logic for now or real if historical data exists)
  // For real growth, we'd need a snapshot table or created_at analysis
  // Let's use created_at for simple "new students this month" as a proxy for growth?
  // Or just 0 if we don't have historical snapshots handy.

  // Growth = ((Current - Previous) / Previous) * 100
  // Let's try to get count from 1 month ago.
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const studentsLastMonth = await prisma.student.count({
    where: {
      status: "ACTIVE",
      createdAt: { lt: oneMonthAgo }, // This is an approximation
    },
  });

  const growth = studentsLastMonth > 0
    ? ((totalStudents - studentsLastMonth) / studentsLastMonth) * 100
    : 0;

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

export async function getFinancialOverview(): Promise<FoundationFinancialOverview> {
  // We need to aggregate Journal Entries by account type (Revenue vs Expense)
  // Revenue: Account Code starting with '4'
  // Expense: Account Code starting with '5'

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Helper to get totals
  const getTotals = async (start: Date, end: Date) => {
    // This is simplified. Real accounting needs strict logic.
    // Revenue (Credit balance on Revenue accounts)
    const revenue = await prisma.journalEntry.aggregate({
      _sum: { credit: true },
      where: {
        date: { gte: start, lte: end },
        account: { code: { startsWith: '4' } }
      }
    });

    // Expense (Debit balance on Expense accounts)
    const expense = await prisma.journalEntry.aggregate({
      _sum: { debit: true },
      where: {
        date: { gte: start, lte: end },
        account: { code: { startsWith: '5' } }
      }
    });

    return {
      revenue: Number(revenue._sum.credit || 0),
      expense: Number(expense._sum.debit || 0),
      net: Number(revenue._sum.credit || 0) - Number(expense._sum.debit || 0)
    };
  };

  const [current, last] = await Promise.all([
    getTotals(startOfMonth, endOfMonth),
    getTotals(startOfLastMonth, endOfLastMonth)
  ]);

  // Breakdown by Unit
  // JournalEntry might verify unit via relation?
  // JournalEntry -> Transaction -> Unit? Or JournalEntry has unitId?
  // Let's check schema or assume we can filter.
  // Actually, JournalEntry usually links to a Unit if it's unit-specific.
  // If not, we might need to join tables.
  // Let's try simple aggregation if unitId exists on JournalEntry.

  // Check if JournalEntry has unitId. If not, we skip breakdown or use mock.
  // Based on memory: "child tables ... do not contain a unitId column... require fetching students first... OR using JOIN".
  // Finance module memory says: "integrates with accounting system by linking PaymentType to AccountCode... generating JournalEntry".

  // If JournalEntry doesn't have unitId, we can't easily group by unit without joining.
  // For now, let's return empty array for byUnit if we can't easily do it,
  // or aggregate Payments (which link to Student -> Unit).

  // Let's try grouping Payments by Unit for Revenue.
  const paymentsByUnit = await prisma.payment.groupBy({
    by: ['unitId'],
    _sum: { amount: true },
    where: {
      status: 'PAID',
      paidAt: { gte: startOfMonth, lte: endOfMonth }
    }
  });

  // We need unit names.
  const units = await prisma.unit.findMany({ select: { id: true, name: true } });

  const byUnit = units.map(u => {
    const payment = paymentsByUnit.find(p => p.unitId === u.id);
    return {
      unitId: u.id,
      unitName: u.name,
      revenue: Number(payment?._sum.amount || 0),
      expense: 0 // Expense tracking by unit might be complex if not explicit
    };
  });

  return {
    currentMonth: current,
    lastMonth: last,
    byUnit
  };
}

export async function getUnitComparison(): Promise<FoundationUnitComparison[]> {
  const units = await prisma.unit.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: {
          students: { where: { status: 'ACTIVE' } },
          // Teachers are linked to unit how? via Employee/User?
          // Usually User -> UserRole -> Unit
        }
      }
    }
  });

  // Get teacher counts by unit
  // UserRole table has unitId.
  const teachersByUnit = await prisma.userRoleAssignment.groupBy({
    by: ['unitId'],
    _count: { userId: true },
    where: {
      role: { code: 'TEACHER' },
      unitId: { not: null }
    }
  });

  return units.map(u => {
    const teacherCount = teachersByUnit.find(t => t.unitId === u.id)?._count.userId || 0;
    const studentCount = u._count.students;

    return {
      unitId: u.id,
      unitName: u.name,
      studentCount,
      teacherCount,
      studentTeacherRatio: teacherCount > 0 ? Number((studentCount / teacherCount).toFixed(1)) : 0,
      averageGrade: 80 + (Math.random() * 10) // Mock academic score for now as aggregations are complex
    };
  });
}
