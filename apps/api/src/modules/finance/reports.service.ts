import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';
import {
  getTrialBalance,
  getBalanceSheet,
  getIncomeStatement
} from './accounting.service';

/**
 * ISAK 35 - Laporan Aktivitas (Statement of Activities)
 * Menampilkan rincian penghasilan, beban, dan perubahan aset neto
 * Terbagi menjadi: Tanpa Pembatasan dan Dengan Pembatasan
 */
export async function getStatementOfActivities(query: {
  unitId?: string;
  startDate: Date;
  endDate: Date;
}) {
  const trialBalance = await getTrialBalance(query);

  const revenues = trialBalance.filter((i) => i.type === 'REVENUE');
  const expenses = trialBalance.filter((i) => i.type === 'EXPENSE');

  // Grouping by Restriction (ISAK 35)
  // We assume accountCode has netAssetCategory: 'UNRESTRICTED', 'TEMPORARILY_RESTRICTED', 'PERMANENTLY_RESTRICTED'
  const accounts = await prisma.accountCode.findMany({
    where: { id: { in: trialBalance.map(i => i.accountId) } }
  });

  const getCategory = (accountId: string) => {
    const acc = accounts.find(a => a.id === accountId);
    return acc?.netAssetCategory || 'UNRESTRICTED';
  };

  const mapByCategory = (items: typeof trialBalance) => {
    const unrestricted = items.filter(i => getCategory(i.accountId) === 'UNRESTRICTED');
    const restricted = items.filter(i => getCategory(i.accountId) !== 'UNRESTRICTED');

    const sumBalance = (list: typeof trialBalance) =>
      list.reduce((sum, i) => sum + (i.normalBalance === 'CREDIT' ? i.credit - i.debit : i.debit - i.credit), 0);

    return {
      unrestricted: {
        items: unrestricted,
        total: sumBalance(unrestricted)
      },
      restricted: {
        items: restricted,
        total: sumBalance(restricted)
      },
      total: sumBalance(items)
    };
  };

  const activities = {
    unrestricted: mapByCategory(revenues).unrestricted.total - mapByCategory(expenses).unrestricted.total,
    restricted: mapByCategory(revenues).restricted.total - mapByCategory(expenses).restricted.total,
    total: (mapByCategory(revenues).total - mapByCategory(expenses).total)
  };

  // For Statement of Changes in Net Assets, we need beginning balances
  const beginningBalances = await prisma.journalEntry.aggregate({
    where: {
      ...(query.unitId && { unitId: query.unitId }),
      date: { lt: query.startDate },
      account: { type: { in: ['REVENUE', 'EXPENSE'] } }
    },
    _sum: { debit: true, credit: true }
  });

  // Simplified: Net Assets beginning balance is cumulative surplus/deficit
  const startBalance = (beginningBalances._sum.credit?.toNumber() || 0) - (beginningBalances._sum.debit?.toNumber() || 0);

  return {
    revenues: mapByCategory(revenues),
    expenses: mapByCategory(expenses),
    changeInNetAssets: activities,
    netAssets: {
        beginning: startBalance,
        ending: startBalance + activities.total
    }
  };
}

/**
 * Laporan Arus Kas (Cash Flow Statement) - Metode Langsung/Tidak Langsung
 */
export async function getCashFlowStatement(query: {
  unitId?: string;
  startDate: Date;
  endDate: Date;
}) {
  const { unitId, startDate, endDate } = query;

  const entries = await prisma.journalEntry.findMany({
    where: {
      ...(unitId && { unitId }),
      date: { gte: startDate, lte: endDate },
      account: {
        cashFlowCategory: { not: null }
      }
    },
    include: { account: true }
  });

  const categories = {
    OPERATING: 0,
    INVESTING: 0,
    FINANCING: 0
  };

  entries.forEach(entry => {
    const amount = entry.debit.toNumber() - entry.credit.toNumber();
    const cat = entry.account.cashFlowCategory as keyof typeof categories;
    if (categories[cat] !== undefined) {
      categories[cat] += amount;
    }
  });

  // Simplified: Beginning balance from previous period
  const beginningCash = await prisma.journalEntry.aggregate({
    where: {
      ...(unitId && { unitId }),
      date: { lt: startDate },
      account: {
        OR: [
            { code: { startsWith: '11' } }, // Assuming 11 is Liquid Assets
            { name: { contains: 'Kas', mode: 'insensitive' } },
            { name: { contains: 'Bank', mode: 'insensitive' } }
        ]
      }
    },
    _sum: { debit: true, credit: true }
  });

  const startBalance = (beginningCash._sum.debit?.toNumber() || 0) - (beginningCash._sum.credit?.toNumber() || 0);

  return {
    operating: categories.OPERATING,
    investing: categories.INVESTING,
    financing: categories.FINANCING,
    netChange: categories.OPERATING + categories.INVESTING + categories.FINANCING,
    beginningBalance: startBalance,
    endingBalance: startBalance + categories.OPERATING + categories.INVESTING + categories.FINANCING
  };
}

/**
 * PSAK 109 - Laporan Sumber dan Penyaluran Dana ZISWAF
 */
export async function getZiswafReport(query: {
  unitId?: string;
  startDate: Date;
  endDate: Date;
}) {
    const { unitId, startDate, endDate } = query;

    const trialBalance = await getTrialBalance(query);
    const accounts = await prisma.accountCode.findMany({
        where: { id: { in: trialBalance.map(i => i.accountId) }, ziswafFundType: { not: null } }
    });

    const fundTypes = ['ZAKAT', 'INFAK_SEDEKAH', 'WAKAF', 'AMIL', 'NON_HALAL'];

    const report = fundTypes.map(type => {
        const fundAccounts = accounts.filter(a => a.ziswafFundType === type);
        const fundEntries = trialBalance.filter(i => fundAccounts.some(fa => fa.id === i.accountId));

        const receipts = fundEntries.filter(i => i.type === 'REVENUE');
        const distributions = fundEntries.filter(i => i.type === 'EXPENSE');

        const totalReceipts = receipts.reduce((sum, i) => sum + (i.credit - i.debit), 0);
        const totalDistributions = distributions.reduce((sum, i) => sum + (i.debit - i.credit), 0);

        return {
            type,
            receipts: totalReceipts,
            distributions: totalDistributions,
            netChange: totalReceipts - totalDistributions
        };
    });

    return report;
}

/**
 * Laporan Arus Dana per Unit Usaha
 */
export async function getBusinessUnitReport(query: {
    unitId: string;
    startDate: Date;
    endDate: Date;
}) {
    const businessUnits = await prisma.businessUnit.findMany({
        where: { unitId: query.unitId }
    });

    const results = await Promise.all(businessUnits.map(async (bu) => {
        // Aggregate Canteen Transactions
        const canteenStats = await prisma.canteenTransaction.aggregate({
            where: {
                businessUnitId: bu.id,
                createdAt: { gte: query.startDate, lte: query.endDate },
                status: 'COMPLETED'
            },
            _sum: { total: true }
        });

        // Aggregate Laundry Transactions
        const laundryStats = await prisma.laundryTransaction.aggregate({
            where: {
                businessUnitId: bu.id,
                createdAt: { gte: query.startDate, lte: query.endDate },
                paymentStatus: 'PAID'
            },
            _sum: { total: true }
        });

        const totalRevenue = (canteenStats._sum.total?.toNumber() || 0) + (laundryStats._sum.total?.toNumber() || 0);

        // Note: Expenses are typically recorded in JournalEntry and currently don't have a direct BusinessUnitId link.
        // A more advanced implementation would use Cost Centers or specific AccountCode branches for each BU.

        return {
            businessUnitId: bu.id,
            name: bu.name,
            revenue: totalRevenue,
            expense: 0,
            netProfit: totalRevenue
        };
    }));

    return results;
}

/**
 * Laporan Perbandingan Anggaran (Budget vs Actual)
 */
export async function getBudgetVsActualReport(query: {
    unitId: string;
    academicYearId: string;
}) {
    const budgets = await prisma.budget.findMany({
        where: {
            unitId: query.unitId,
            academicYearId: query.academicYearId
        },
        include: { account: true }
    });

    const trialBalance = await getTrialBalance({ unitId: query.unitId });

    const report = budgets.map(b => {
        const actual = trialBalance.find(i => i.accountId === b.accountId);
        const actualAmount = actual ? (actual.normalBalance === 'DEBIT' ? actual.debit - actual.credit : actual.credit - actual.debit) : 0;

        return {
            accountCode: b.account.code,
            accountName: b.account.name,
            budget: b.amount.toNumber(),
            actual: actualAmount,
            variance: b.amount.toNumber() - actualAmount,
            percentage: b.amount.toNumber() > 0 ? (actualAmount / b.amount.toNumber()) * 100 : 0
        };
    });

    return report;
}

/**
 * Catatan Atas Laporan Keuangan (CALK) - Data Aggregator
 */
export async function getCalkData(query: {
    unitId: string;
    periodId?: string;
}) {
    const [notes, template] = await Promise.all([
        prisma.reportNote.findMany({
            where: { unitId: query.unitId, periodId: query.periodId, reportType: 'CALK' }
        }),
        prisma.reportTemplate.findFirst({
            where: { OR: [{ unitId: query.unitId }, { isDefault: true }], type: 'CALK' },
            orderBy: { unitId: 'desc' } // Unit specific template takes precedence over default
        })
    ]);

    return {
        template: template?.content || '',
        manualNotes: notes,
        // Auto-generated highlights could be added here
        summary: {
            // e.g. Top 5 Expenses, Cash Balance, etc.
        }
    };
}

/**
 * Save/Update Report Note (CALK)
 */
export async function saveReportNote(data: {
    unitId: string;
    periodId?: string;
    reportType: string;
    sectionKey: string;
    content: string;
}) {
    // Note: Upsert with nullable unique fields is problematic in Postgres (NULL != NULL).
    // Using findFirst + update/create instead.
    const existing = await prisma.reportNote.findFirst({
        where: {
            unitId: data.unitId,
            periodId: data.periodId || null,
            reportType: data.reportType,
            sectionKey: data.sectionKey
        }
    });

    if (existing) {
        return prisma.reportNote.update({
            where: { id: existing.id },
            data: { content: data.content }
        });
    }

    return prisma.reportNote.create({
        data: {
            ...data,
            periodId: data.periodId || null
        }
    });
}
