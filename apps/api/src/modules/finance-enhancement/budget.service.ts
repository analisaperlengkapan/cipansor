import { prisma } from "../../lib/prisma";
import { Prisma } from "@prisma/client";
import { CreateBudgetInput, UpdateBudgetInput } from "@cipansor/shared";

export async function createBudget(data: CreateBudgetInput & { createdById: string }) {
  const { unitId, academicYearId, accountId, amount, periodType, notes, createdById } = data;

  // Check if budget already exists
  const existing = await prisma.budget.findUnique({
    where: {
      unitId_academicYearId_accountId: {
        unitId,
        academicYearId,
        accountId
      }
    }
  });

  if (existing) {
    throw new Error("Budget for this account and academic year already exists");
  }

  return prisma.budget.create({
    data: {
      unit: { connect: { id: unitId } },
      academicYear: { connect: { id: academicYearId } },
      account: { connect: { id: accountId } },
      amount: new Prisma.Decimal(amount),
      periodType: periodType || "YEARLY",
      notes,
      createdBy: { connect: { id: createdById } },
    },
    include: {
      account: true,
      academicYear: { select: { id: true, name: true } },
    },
  });
}

export async function updateBudget(id: string, data: UpdateBudgetInput) {
  const { amount, periodType, notes } = data;

  return prisma.budget.update({
    where: { id },
    data: {
      ...(amount !== undefined && { amount: new Prisma.Decimal(amount) }),
      ...(periodType && { periodType }),
      ...(notes !== undefined && { notes }),
    },
    include: {
      account: true,
      academicYear: { select: { id: true, name: true } },
    },
  });
}

export async function getBudgets(query: { unitId?: string; academicYearId?: string; page?: number; limit?: number }) {
  const { unitId, academicYearId, page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.BudgetWhereInput = {
    ...(unitId && { unitId }),
    ...(academicYearId && { academicYearId }),
  };

  const [data, total] = await Promise.all([
    prisma.budget.findMany({
      where,
      include: {
        account: true,
        academicYear: { select: { id: true, name: true, startDate: true, endDate: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { account: { code: 'asc' } },
      skip,
      take: limit,
    }),
    prisma.budget.count({ where }),
  ]);

  // Calculate used amount dynamically
  const result = await Promise.all(data.map(async (budget) => {
    // Determine date range for usage calculation
    // Ideally this comes from academic year, or we use current fiscal year
    const startDate = budget.academicYear.startDate;
    const endDate = budget.academicYear.endDate;

    const usage = await prisma.journalEntry.aggregate({
      where: {
        unitId: budget.unitId,
        accountId: budget.accountId,
        date: { gte: startDate, lte: endDate },
        // Normally we filter for debits on Expense accounts, but Journal Entry structure handles this.
        // Expenses are typically debited.
        // However, we should sum (debit - credit) to account for corrections.
      },
      _sum: {
        debit: true,
        credit: true
      }
    });

    const usedAmount = (usage._sum.debit?.toNumber() || 0) - (usage._sum.credit?.toNumber() || 0);

    return {
      ...budget,
      amount: budget.amount.toNumber(),
      usedAmount: Math.max(0, usedAmount), // Ensure non-negative just in case
    };
  }));

  return {
    data: result,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
