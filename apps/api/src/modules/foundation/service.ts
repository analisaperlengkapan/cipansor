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
import { FoundationDashboardStats } from "@cipansor/shared";

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

export async function getFoundationStats(foundationId: string): Promise<FoundationDashboardStats | null> {
  const foundation = await prisma.foundation.findUnique({
    where: { id: foundationId },
  });

  if (!foundation) return null;

  // 1. Get Unit Stats
  const units = await prisma.unit.findMany({
    where: { foundationId },
    select: {
      id: true,
      name: true,
      type: true,
      _count: {
        select: {
          students: { where: { status: "active" } },
          teachers: { where: { employmentStatus: { in: ["GTY", "GTT"] } } },
          staff: { where: { deletedAt: null } },
        },
      },
    },
  });

  // 2. Aggregate counts
  let totalStudents = 0;
  let totalTeachers = 0;
  let totalStaff = 0;

  const unitsDistribution = units.map(unit => {
    totalStudents += unit._count.students;
    totalTeachers += unit._count.teachers;
    totalStaff += unit._count.staff;
    return {
      id: unit.id,
      name: unit.name,
      type: unit.type,
      studentCount: unit._count.students,
      teacherCount: unit._count.teachers,
      staffCount: unit._count.staff,
    };
  });

  // 3. Financial Stats (Current Month)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Use raw queries with exact table names based on Prisma schema @map
  const revenueResult = await prisma.$queryRaw<{ total: bigint }[]>`
    SELECT SUM(je.credit) as total
    FROM journal_entries je
    JOIN account_codes ac ON je.account_id = ac.id
    WHERE je.date >= ${startOfMonth} AND je.date <= ${endOfMonth}
    AND ac.type = 'REVENUE'
    AND je.unit_id IN (SELECT id FROM units WHERE foundation_id = ${foundationId})
  `;

  const expenseResult = await prisma.$queryRaw<{ total: bigint }[]>`
    SELECT SUM(je.debit) as total
    FROM journal_entries je
    JOIN account_codes ac ON je.account_id = ac.id
    WHERE je.date >= ${startOfMonth} AND je.date <= ${endOfMonth}
    AND ac.type = 'EXPENSE'
    AND je.unit_id IN (SELECT id FROM units WHERE foundation_id = ${foundationId})
  `;

  const totalRevenueMonth = Number(revenueResult[0]?.total || 0);
  const totalExpenseMonth = Number(expenseResult[0]?.total || 0);

  // 4. Total Assets
  // Summing up acquisitionValue of all assets
  const assetResult = await prisma.asset.aggregate({
    where: {
      unit: { foundationId },
      status: "ACTIVE",
    },
    _sum: {
      purchasePrice: true,
    },
  });

  const landResult = await prisma.land.aggregate({
    where: { unit: { foundationId } },
    _sum: { acquisitionValue: true },
  });

  const totalAssets = Number(assetResult._sum.purchasePrice || 0) + Number(landResult._sum.acquisitionValue || 0);

  // 5. Recent Documents
  const recentDocuments = await prisma.foundationDocument.findMany({
    where: { foundationId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const formattedDocuments = recentDocuments.map(doc => {
    let status: 'valid' | 'expiring' | 'expired' = 'valid';
    if (doc.expiryDate) {
      if (doc.expiryDate < now) status = 'expired';
      else if (doc.expiryDate < new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)) status = 'expiring';
    }
    return {
      id: doc.id,
      name: doc.name,
      type: doc.type,
      expiryDate: doc.expiryDate?.toISOString(),
      status,
    };
  });

  // 6. Financial Trend (Real Data using Raw Query)
  // Group by month for the last 6 months
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const trendResult = await prisma.$queryRaw<{ month: Date; revenue: bigint; expense: bigint }[]>`
    SELECT
      DATE_TRUNC('month', je.date) as month,
      SUM(CASE WHEN ac.type = 'REVENUE' THEN je.credit ELSE 0 END) as revenue,
      SUM(CASE WHEN ac.type = 'EXPENSE' THEN je.debit ELSE 0 END) as expense
    FROM journal_entries je
    JOIN account_codes ac ON je.account_id = ac.id
    WHERE je.date >= ${sixMonthsAgo}
    AND je.unit_id IN (SELECT id FROM units WHERE foundation_id = ${foundationId})
    GROUP BY DATE_TRUNC('month', je.date)
    ORDER BY month ASC
  `;

  // Map result to fill gaps if any month is missing (optional but good for charts)
  const financialTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    // Find matching month in result
    const match = trendResult.find(r =>
      new Date(r.month).getMonth() === d.getMonth() &&
      new Date(r.month).getFullYear() === d.getFullYear()
    );

    const monthName = d.toLocaleString('default', { month: 'short' });
    financialTrend.push({
      period: `${monthName} ${d.getFullYear()}`,
      revenue: match ? Number(match.revenue) : 0,
      expense: match ? Number(match.expense) : 0,
    });
  }

  return {
    foundationId,
    foundationName: foundation.name,
    summary: {
      totalUnits: units.length,
      totalStudents,
      totalTeachers,
      totalStaff,
      totalAssets,
      totalRevenueMonth,
      totalExpenseMonth,
    },
    unitsDistribution,
    financialTrend,
    recentDocuments: formattedDocuments,
  };
}
