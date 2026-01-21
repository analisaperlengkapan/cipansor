import { prisma } from '../../lib/prisma';
import { CreateFinancialPeriodInput } from '@cipansor/shared';

export async function createFinancialPeriod(data: CreateFinancialPeriodInput) {
  const { unitId, name, startDate, endDate, notes } = data;

  // Check overlap
  const overlap = await prisma.financialPeriod.findFirst({
    where: {
      unitId,
      OR: [{ startDate: { lte: new Date(endDate) }, endDate: { gte: new Date(startDate) } }],
    },
  });

  if (overlap) {
    throw new Error('Financial period overlaps with an existing period');
  }

  return prisma.financialPeriod.create({
    data: {
      unit: { connect: { id: unitId } },
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      notes,
    },
  });
}

export async function closePeriod(id: string, closedById: string) {
  return prisma.financialPeriod.update({
    where: { id },
    data: {
      isClosed: true,
      closedAt: new Date(),
      closedBy: { connect: { id: closedById } },
    },
  });
}

export async function reopenPeriod(id: string) {
  return prisma.financialPeriod.update({
    where: { id },
    data: {
      isClosed: false,
      closedAt: null,
      closedById: null,
    },
  });
}

export async function getFinancialPeriods(query: {
  unitId?: string;
  page?: number;
  limit?: number;
}) {
  const { unitId, page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(unitId && { unitId }),
  };

  const [data, total] = await Promise.all([
    prisma.financialPeriod.findMany({
      where,
      include: { closedBy: { select: { id: true, name: true } } },
      orderBy: { startDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.financialPeriod.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function checkPeriodStatus(unitId: string, date: Date) {
  const period = await prisma.financialPeriod.findFirst({
    where: {
      unitId,
      startDate: { lte: date },
      endDate: { gte: date },
    },
  });

  if (period && period.isClosed) {
    throw new Error(`Financial period for ${date.toISOString()} is closed.`);
  }
}
