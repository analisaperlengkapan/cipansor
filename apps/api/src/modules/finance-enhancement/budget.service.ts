import { prisma } from '../../lib/prisma';
import { Prisma, BudgetStatus } from '@prisma/client';
import { CreateBudgetInput, UpdateBudgetInput } from '@cipansor/shared';

export async function createBudget(data: CreateBudgetInput & { createdById: string }) {
  const { unitId, academicYearId, accountId, amount, periodType, notes, createdById } = data;

  // Check if budget already exists
  const existing = await prisma.budget.findUnique({
    where: {
      unitId_academicYearId_accountId: {
        unitId,
        academicYearId,
        accountId,
      },
    },
  });

  if (existing) {
    throw new Error('Budget for this account and academic year already exists');
  }

  return prisma.budget.create({
    data: {
      unit: { connect: { id: unitId } },
      academicYear: { connect: { id: academicYearId } },
      account: { connect: { id: accountId } },
      amount: new Prisma.Decimal(amount),
      periodType: periodType || 'YEARLY',
      notes,
      status: BudgetStatus.DRAFT,
      createdBy: { connect: { id: createdById } },
    },
    include: {
      account: true,
      academicYear: { select: { id: true, name: true } },
    },
  });
}

export async function updateBudgetStatus(
  id: string,
  status: BudgetStatus,
  userId: string,
  note?: string
) {
  const budget = await prisma.budget.findUnique({ where: { id } });
  if (!budget) throw new Error('Budget not found');

  const updateData: Prisma.BudgetUpdateInput = { status };

  if (status === BudgetStatus.APPROVED) {
    updateData.approvedBy = { connect: { id: userId } };
    updateData.approvedAt = new Date();
  } else if (status === BudgetStatus.REJECTED && note) {
    updateData.rejectionNote = note;
  }

  return prisma.budget.update({
    where: { id },
    data: updateData,
    include: {
      account: true,
      approvedBy: { select: { id: true, name: true } },
    },
  });
}

export async function updateBudget(id: string, data: UpdateBudgetInput) {
  const { amount, periodType, notes } = data;

  // Check current status
  const currentBudget = await prisma.budget.findUnique({ where: { id } });
  if (!currentBudget) throw new Error('Budget not found');

  let statusUpdate = {};
  // If modifying a REJECTED or APPROVED budget, reset to DRAFT to force re-approval
  if (currentBudget.status === BudgetStatus.REJECTED || currentBudget.status === BudgetStatus.APPROVED) {
    statusUpdate = { status: BudgetStatus.DRAFT };
  }

  return prisma.budget.update({
    where: { id },
    data: {
      ...(amount !== undefined && { amount: new Prisma.Decimal(amount) }),
      ...(periodType && { periodType }),
      ...(notes !== undefined && { notes }),
      ...statusUpdate,
    },
    include: {
      account: true,
      academicYear: { select: { id: true, name: true } },
    },
  });
}

export async function getBudgets(query: {
  unitId?: string;
  academicYearId?: string;
  page?: number;
  limit?: number;
}) {
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

  const result = data.map((budget) => ({
    ...budget,
    amount: budget.amount.toNumber(),
    usedAmount: budget.usedAmount.toNumber(),
  }));

  return {
    data: result,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function deleteBudget(id: string) {
  // Check for Purchase Request dependencies first
  const purchaseRequestCount = await prisma.purchaseRequestItem.count({
    where: { budgetId: id },
  });

  if (purchaseRequestCount > 0) {
    throw new Error('Cannot delete budget referenced by Purchase Requests');
  }

  // Use atomic delete with condition to prevent race condition
  const result = await prisma.budget.deleteMany({
    where: {
      id,
      usedAmount: { equals: 0 },
    },
  });

  if (result.count === 0) {
    // Determine why it failed
    const budget = await prisma.budget.findUnique({ where: { id } });
    if (!budget) {
      throw new Error('Budget not found');
    }
    throw new Error('Cannot delete budget with existing usage');
  }

  return { success: true };
}

export async function recalculateBudgetUsage(unitId: string, academicYearId: string) {
  // 1. Get Academic Year dates
  const academicYear = await prisma.academicYear.findUnique({
    where: { id: academicYearId },
  });
  if (!academicYear) throw new Error('Academic Year not found');

  // 2. Get all budgets
  const budgets = await prisma.budget.findMany({
    where: { unitId, academicYearId },
    include: { account: true },
  });

  if (budgets.length === 0) return { count: 0 };

  // 3. Aggregate Journal Entries efficiently
  const aggregates = await prisma.journalEntry.groupBy({
    by: ['accountId'],
    where: {
      unitId,
      date: {
        gte: academicYear.startDate,
        lte: academicYear.endDate,
      },
      accountId: { in: budgets.map((b) => b.accountId) },
    },
    _sum: {
      debit: true,
      credit: true,
    },
  });

  // 4. Map aggregates for lookup
  const usageMap = new Map();
  aggregates.forEach((agg) => {
    usageMap.set(agg.accountId, {
      debit: agg._sum.debit?.toNumber() || 0,
      credit: agg._sum.credit?.toNumber() || 0,
    });
  });

  // 5. Create Update Operations
  const updates = budgets.map((budget) => {
    const usage = usageMap.get(budget.accountId) || { debit: 0, credit: 0 };
    let usedAmount = 0;

    // Check normal balance to decide direction
    if (budget.account.normalBalance === 'CREDIT') {
      usedAmount = usage.credit - usage.debit;
    } else {
      usedAmount = usage.debit - usage.credit;
    }

    usedAmount = Math.max(0, usedAmount);

    return prisma.budget.update({
      where: { id: budget.id },
      data: { usedAmount: new Prisma.Decimal(usedAmount) },
    });
  });

  if (updates.length > 0) {
    await prisma.$transaction(updates);
  }

  return { count: updates.length };
}
