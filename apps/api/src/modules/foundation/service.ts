import { prisma } from "../../lib/prisma";
import { Prisma, AccountType } from "@prisma/client";
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
  // Get all units linked to foundation
  const units = await prisma.unit.findMany({
    where: { foundationId },
    select: { id: true, name: true, type: true }
  });

  const unitIds = units.map(u => u.id);

  // Aggregate Journal Entries
  // We want to group by Unit and AccountType (Revenue vs Expense)
  // For simplicity, we filter for Revenue and Expense account types directly
  const financialData = await prisma.journalEntry.groupBy({
    by: ['unitId', 'accountId'],
    where: {
      unitId: { in: unitIds },
      account: {
        type: { in: [AccountType.REVENUE, AccountType.EXPENSE] }
      }
    },
    _sum: {
      debit: true,
      credit: true
    }
  });

  // Need to get account types to classify the grouped data
  const accountIds = financialData.map(d => d.accountId);
  const accounts = await prisma.accountCode.findMany({
    where: { id: { in: accountIds } },
    select: { id: true, type: true }
  });
  const accountTypeMap = new Map(accounts.map(a => [a.id, a.type]));

  // Process data
  const unitStats = units.map(unit => {
    let revenue = 0;
    let expense = 0;

    const unitEntries = financialData.filter(d => d.unitId === unit.id);

    for (const entry of unitEntries) {
      const type = accountTypeMap.get(entry.accountId);
      const debit = Number(entry._sum.debit) || 0;
      const credit = Number(entry._sum.credit) || 0;
      // Balance = Credit - Debit (Normal Balance for Revenue is Credit, Expense is Debit)
      // Actually:
      // Revenue (Credit Balance) = Credit - Debit
      // Expense (Debit Balance) = Debit - Credit

      if (type === AccountType.REVENUE) {
        revenue += (credit - debit);
      } else if (type === AccountType.EXPENSE) {
        expense += (debit - credit);
      }
    }

    return {
      unitId: unit.id,
      unitName: unit.name,
      revenue,
      expense,
      netIncome: revenue - expense
    };
  });

  const totalRevenue = unitStats.reduce((sum, u) => sum + u.revenue, 0);
  const totalExpense = unitStats.reduce((sum, u) => sum + u.expense, 0);
  const totalNetIncome = totalRevenue - totalExpense;

  return {
    totalRevenue,
    totalExpense,
    totalNetIncome,
    breakdown: unitStats
  };
}
