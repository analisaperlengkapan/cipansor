import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class CashFlowService {
  async getCashFlowStatement(unitId: string, startDate: Date, endDate: Date) {
    const journalEntries = await prisma.journalEntry.findMany({
      where: {
        unitId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        account: {
          cashFlowCategory: { not: null },
        },
      },
      include: {
        account: {
          select: {
            name: true,
            cashFlowCategory: true,
            normalBalance: true,
          },
        },
      },
    });

    const summary = {
      OPERATING: 0,
      INVESTING: 0,
      FINANCING: 0,
    };

    journalEntries.forEach((entry) => {
      const category = entry.account.cashFlowCategory as keyof typeof summary;
      const amount = Number(entry.debit) - Number(entry.credit);

      // For cash flow, we care about movement.
      // If it's a cash account, it's the target.
      // Here we look at the 'other side' of the transaction or categorize by account.
      // Standard indirect method logic or direct categorization:
      summary[category] += amount;
    });

    return {
      period: { startDate, endDate },
      summary,
      totalNetCashFlow: summary.OPERATING + summary.INVESTING + summary.FINANCING,
    };
  }
}

export const cashFlowService = new CashFlowService();
