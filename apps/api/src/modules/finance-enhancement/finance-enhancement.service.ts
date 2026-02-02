import { prisma } from '@/lib/prisma';
import { CreateJournalEntryInput } from './schema';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Prisma } from '@prisma/client';

export class FinanceEnhancementService {
  // Period Management
  async checkPeriodStatus(unitId: string, date: Date) {
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

  // Journal Entry
  async createManualJournal(input: CreateJournalEntryInput & { createdById: string }): Promise<void> {
    const entryDate = new Date(input.date);
    await this.checkPeriodStatus(input.unitId, entryDate);

    // Validate balance
    const totalDebit = input.entries.reduce((sum, e) => sum + (e.debit || 0), 0);
    const totalCredit = input.entries.reduce((sum, e) => sum + (e.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Journal is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`);
    }

    const referenceId = crypto.randomUUID();

    await prisma.$transaction(async (tx) => {
      for (const entry of input.entries) {
        await tx.journalEntry.create({
          data: {
            unitId: input.unitId,
            accountId: entry.accountId,
            date: entryDate,
            description: input.description || '',
            debit: entry.debit || 0,
            credit: entry.credit || 0,
            reference: referenceId, // Use generated UUID for manual entries group
            referenceType: 'MANUAL',
            createdById: input.createdById,
          },
        });
        // Budget check/update could be added here
      }
    });
  }

  // Reporting
  async getTrialBalance(params: { unitId: string; startDate?: Date; endDate?: Date }) {
    const { unitId, startDate, endDate } = params;

    // Default to current month if dates not provided
    const start = startDate || startOfMonth(new Date());
    const end = endDate || endOfDay(new Date());

    const accounts = await prisma.accountCode.findMany({
      where: { isActive: true }, // Assuming filtered by unit? AccountCode seems global or unit specific? Schema says global but used by unit.
      // Actually AccountCode doesn't have unitId in schema provided in previous context,
      // but JournalEntry does. Let's assume AccountCodes are shared or we filter used ones.
      // Better to aggregate from JournalEntries first.
    });

    const entries = await prisma.journalEntry.groupBy({
      by: ['accountId'],
      where: {
        unitId,
        date: {
          lte: end,
        },
      },
      _sum: {
        debit: true,
        credit: true,
      },
    });

    // Calculate balances
    const trialBalance = accounts.map(account => {
      const entry = entries.find(e => e.accountId === account.id);
      const totalDebit = Number(entry?._sum.debit || 0);
      const totalCredit = Number(entry?._sum.credit || 0);

      // Determine balance based on normal balance type
      let balance = 0;
      if (account.normalBalance === 'DEBIT') {
        balance = totalDebit - totalCredit;
      } else {
        balance = totalCredit - totalDebit;
      }

      return {
        accountId: account.id,
        accountName: account.name,
        code: account.code,
        debit: totalDebit,
        credit: totalCredit,
        balance, // Net balance
        // To strictly match TrialBalanceItem from shared/types, we might need startBalance, debit, credit, endBalance
        // If the interface expects period movement:
        // We need previous balance (before start date) and movement (start to end)
      };
    });

    // If strictly adhering to standard trial balance report structure (Opening, Movement, Closing)
    // We need two aggregations.
    const openingEntries = await prisma.journalEntry.groupBy({
      by: ['accountId'],
      where: {
        unitId,
        date: { lt: start },
      },
      _sum: { debit: true, credit: true },
    });

    const periodEntries = await prisma.journalEntry.groupBy({
      by: ['accountId'],
      where: {
        unitId,
        date: { gte: start, lte: end },
      },
      _sum: { debit: true, credit: true },
    });

    return accounts.map(account => {
        const open = openingEntries.find(e => e.accountId === account.id);
        const period = periodEntries.find(e => e.accountId === account.id);

        const openDebit = Number(open?._sum.debit || 0);
        const openCredit = Number(open?._sum.credit || 0);
        const periodDebit = Number(period?._sum.debit || 0);
        const periodCredit = Number(period?._sum.credit || 0);

        let startBalance = 0;
        if (account.normalBalance === 'DEBIT') startBalance = openDebit - openCredit;
        else startBalance = openCredit - openDebit;

        let endBalance = 0;
        if (account.normalBalance === 'DEBIT') endBalance = (openDebit + periodDebit) - (openCredit + periodCredit);
        else endBalance = (openCredit + periodCredit) - (openDebit + periodDebit);

        return {
            accountId: account.id,
            accountCode: account.code,
            accountName: account.name,
            startBalance,
            debit: periodDebit,
            credit: periodCredit,
            endBalance
        };
    });
  }
}

export const financeEnhancementService = new FinanceEnhancementService();
