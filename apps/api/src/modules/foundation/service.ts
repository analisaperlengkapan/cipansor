import { prisma } from "../../lib/prisma";
import { Prisma } from "@prisma/client";
import {
  CreateFoundationInput,
  UpdateFoundationInput,
  CreateBoardMemberInput,
  UpdateBoardMemberInput,
  CreateDocumentInput,
  UpdateDocumentInput,
} from "./schema";

// =====================================
// FOUNDATION SERVICE
// =====================================

export async function getFoundations(params: {
  page: number;
  limit: number;
  search?: string;
}) {
  const { page, limit, search } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.FoundationWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { legalName: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.foundation.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { units: true, boardMembers: true, documents: true } },
      },
    }),
    prisma.foundation.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getFoundationById(id: string) {
  return prisma.foundation.findUnique({
    where: { id },
    include: {
      units: { select: { id: true, name: true, type: true } },
      boardMembers: { where: { isActive: true }, orderBy: { position: "asc" } },
      documents: { orderBy: { issueDate: "desc" } },
    },
  });
}

export async function createFoundation(data: CreateFoundationInput) {
  return prisma.foundation.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      ...data,
      foundingDate: data.foundingDate ? new Date(data.foundingDate) : undefined,
    } as any,
  });
}

export async function updateFoundation(id: string, data: UpdateFoundationInput) {
  return prisma.foundation.update({
    where: { id },
    data: {
      ...data,
      foundingDate: data.foundingDate ? new Date(data.foundingDate) : undefined,
    },
  });
}

export async function deleteFoundation(id: string) {
  // Check if foundation has units
  const foundation = await prisma.foundation.findUnique({
    where: { id },
    include: { _count: { select: { units: true } } },
  });

  if (foundation?._count.units && foundation._count.units > 0) {
    throw new Error("Cannot delete foundation with associated units");
  }

  return prisma.foundation.delete({ where: { id } });
}

// =====================================
// BOARD MEMBER SERVICE
// =====================================

export async function getBoardMembers(params: {
  page: number;
  limit: number;
  foundationId?: string;
  isActive?: boolean;
  search?: string;
}) {
  const { page, limit, foundationId, isActive, search } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.BoardMemberWhereInput = {};

  if (foundationId) where.foundationId = foundationId;
  if (isActive !== undefined) where.isActive = isActive;

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { position: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.boardMember.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ isActive: "desc" }, { position: "asc" }],
      include: {
        foundation: { select: { id: true, name: true } },
      },
    }),
    prisma.boardMember.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getBoardMemberById(id: string) {
  return prisma.boardMember.findUnique({
    where: { id },
    include: { foundation: { select: { id: true, name: true } } },
  });
}

export async function createBoardMember(data: CreateBoardMemberInput) {
  return prisma.boardMember.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      ...data,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    } as any,
  });
}

export async function updateBoardMember(id: string, data: UpdateBoardMemberInput) {
  return prisma.boardMember.update({
    where: { id },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
  });
}

export async function endBoardMemberTerm(id: string) {
  return prisma.boardMember.update({
    where: { id },
    data: { isActive: false, endDate: new Date() },
  });
}

export async function deleteBoardMember(id: string) {
  return prisma.boardMember.delete({ where: { id } });
}

// =====================================
// FOUNDATION DOCUMENT SERVICE
// =====================================

export async function getDocuments(params: {
  page: number;
  limit: number;
  foundationId?: string;
  type?: string;
  search?: string;
}) {
  const { page, limit, foundationId, type, search } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.FoundationDocumentWhereInput = {};

  if (foundationId) where.foundationId = foundationId;
  if (type) where.type = type;

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { documentNo: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.foundationDocument.findMany({
      where,
      skip,
      take: limit,
      orderBy: { issueDate: "desc" },
      include: {
        foundation: { select: { id: true, name: true } },
      },
    }),
    prisma.foundationDocument.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getDocumentById(id: string) {
  return prisma.foundationDocument.findUnique({
    where: { id },
    include: { foundation: { select: { id: true, name: true } } },
  });
}

export async function createDocument(data: CreateDocumentInput) {
  return prisma.foundationDocument.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      ...data,
      issueDate: new Date(data.issueDate),
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
    } as any,
  });
}

export async function updateDocument(id: string, data: UpdateDocumentInput) {
  return prisma.foundationDocument.update({
    where: { id },
    data: {
      ...data,
      issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
    },
  });
}

export async function deleteDocument(id: string) {
  return prisma.foundationDocument.delete({ where: { id } });
}

// =====================================
// STATISTICS
// =====================================

export async function getFoundationStats(foundationId: string) {
  const foundation = await prisma.foundation.findUnique({
    where: { id: foundationId },
    include: {
      _count: { select: { units: true, boardMembers: true, documents: true } },
      units: {
        select: {
          id: true,
          name: true,
          type: true,
          _count: { select: { students: true, teachers: true, staff: true } },
        },
      },
    },
  });

  if (!foundation) return null;

  const totalStudents = foundation.units.reduce(
    (acc, unit) => acc + unit._count.students,
    0
  );
  const totalTeachers = foundation.units.reduce(
    (acc, unit) => acc + unit._count.teachers,
    0
  );
  const totalStaff = foundation.units.reduce(
    (acc, unit) => acc + unit._count.staff,
    0
  );

  const activeBoardMembers = await prisma.boardMember.count({
    where: { foundationId, isActive: true },
  });

  const expiringDocuments = await prisma.foundationDocument.count({
    where: {
      foundationId,
      expiryDate: {
        gte: new Date(),
        lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      },
    },
  });

  return {
    foundationId,
    foundationName: foundation.name,
    totalUnits: foundation._count.units,
    totalStudents,
    totalTeachers,
    totalStaff,
    totalBoardMembers: foundation._count.boardMembers,
    activeBoardMembers,
    totalDocuments: foundation._count.documents,
    expiringDocuments,
    unitsSummary: foundation.units,
  };
}

export async function getFinancialSummary(foundationId: string) {
  // Get all units for this foundation
  const units = await prisma.unit.findMany({
    where: { foundationId },
    select: { id: true, name: true },
  });

  if (units.length === 0) return { totalRevenue: 0, totalExpense: 0, netIncome: 0, units: [], trends: [], expenseComposition: [], operatingMargin: 0 };

  const unitIds = units.map((u) => u.id);

  // 1. Overall Summary by Unit (Existing Logic)
  const result = await prisma.journalEntry.groupBy({
    by: ['unitId', 'accountId'],
    where: {
      unitId: { in: unitIds },
      account: {
        type: { in: ['REVENUE', 'EXPENSE'] },
      },
    },
    _sum: {
      debit: true,
      credit: true,
    },
  });

  const accountIds = [...new Set(result.map((r) => r.accountId))];
  const accounts = await prisma.accountCode.findMany({
    where: { id: { in: accountIds } },
    select: { id: true, type: true, name: true },
  });

  const accountTypeMap = new Map(accounts.map((a) => [a.id, a.type]));

  const financialData = units.map((unit) => {
    let revenue = 0;
    let expense = 0;

    const unitEntries = result.filter((r) => r.unitId === unit.id);

    unitEntries.forEach((entry) => {
      const type = accountTypeMap.get(entry.accountId);
      const debit = Number(entry._sum.debit || 0);
      const credit = Number(entry._sum.credit || 0);

      // Normal balance: Revenue = Credit, Expense = Debit
      if (type === 'REVENUE') {
        revenue += credit - debit;
      } else if (type === 'EXPENSE') {
        expense += debit - credit;
      }
    });

    return {
      unitId: unit.id,
      unitName: unit.name,
      revenue,
      expense,
      netIncome: revenue - expense,
    };
  });

  const totalRevenue = financialData.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalExpense = financialData.reduce((acc, curr) => acc + curr.expense, 0);
  const operatingMargin = totalRevenue > 0 ? ((totalRevenue - totalExpense) / totalRevenue) * 100 : 0;

  // 2. Monthly Trends (Last 12 Months)
  // Using queryRaw for efficient date truncation and aggregation across units
  // Note: We need to filter by unitIds, but since there's no easy 'IN' clause with variable array in raw query safely without extensive mapping,
  // we will filter by unit table join if needed, or if foundation has many units, we rely on the application logic.
  // However, simpler is to filter JournalEntry by unit_id IN (...).
  // Given potential large unit lists, let's use Prisma.sql for the IN clause if possible, or build string.
  // Actually, for simplicity and safety, let's grab the last 12 months data for these units via groupBy + date manipulation in JS if dataset is small,
  // OR use queryRaw with a join to Unit which has foundation_id.

  const trendsRaw = await prisma.$queryRaw<Array<{ month: string; type: string; debit: bigint; credit: bigint }>>`
    SELECT
      TO_CHAR(je.date, 'YYYY-MM') as month,
      ac.type as type,
      SUM(je.debit) as debit,
      SUM(je.credit) as credit
    FROM journal_entries je
    JOIN account_codes ac ON je.account_id = ac.id
    JOIN units u ON je.unit_id = u.id
    WHERE u.foundation_id = ${foundationId}
      AND ac.type IN ('REVENUE', 'EXPENSE')
      AND je.date >= NOW() - INTERVAL '12 months'
    GROUP BY TO_CHAR(je.date, 'YYYY-MM'), ac.type
    ORDER BY month ASC
  `;

  // Process raw trends into { month, revenue, expense }
  const trendsMap = new Map<string, { revenue: number; expense: number }>();

  trendsRaw.forEach(row => {
    const month = row.month;
    const type = row.type;
    const debit = Number(row.debit);
    const credit = Number(row.credit);

    if (!trendsMap.has(month)) {
      trendsMap.set(month, { revenue: 0, expense: 0 });
    }

    const entry = trendsMap.get(month)!;

    if (type === 'REVENUE') {
      entry.revenue += credit - debit;
    } else if (type === 'EXPENSE') {
      entry.expense += debit - credit;
    }
  });

  const trends = Array.from(trendsMap.entries()).map(([month, data]) => ({
    month,
    revenue: data.revenue,
    expense: data.expense,
  })).sort((a, b) => a.month.localeCompare(b.month));

  // 3. Expense Composition (Top Spending Categories)
  // Aggregate expenses by Account Name
  const expenseCompositionRaw = await prisma.journalEntry.groupBy({
    by: ['accountId'],
    where: {
      unitId: { in: unitIds },
      account: { type: 'EXPENSE' },
      date: { gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) } // Last 12 months for relevance
    },
    _sum: { debit: true, credit: true },
    orderBy: { _sum: { debit: 'desc' } },
    take: 6 // Top 5 + others maybe, or just top 6
  });

  const expenseComposition = expenseCompositionRaw.map(item => {
    const account = accounts.find(a => a.id === item.accountId);
    const amount = Number(item._sum.debit || 0) - Number(item._sum.credit || 0);
    return {
      category: account?.name || 'Unknown',
      amount: amount > 0 ? amount : 0,
    };
  }).filter(c => c.amount > 0);

  return {
    foundationId,
    totalRevenue,
    totalExpense,
    netIncome: totalRevenue - totalExpense,
    operatingMargin,
    units: financialData,
    trends,
    expenseComposition,
  };
}
