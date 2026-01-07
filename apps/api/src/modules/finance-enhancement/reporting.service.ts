import { prisma } from "../../lib/prisma";
import { Prisma } from "@prisma/client";
import { AccountType, BalanceSheetReport, IncomeExpenseReport } from "@cipansor/shared";

// Helper to format Date for SQL
const formatDate = (date: Date) => date.toISOString().split('T')[0];

export async function getBalanceSheet(unitId: string, date: Date): Promise<BalanceSheetReport> {
  // Get all accounts
  const accounts = await prisma.accountCode.findMany({
    where: { isActive: true },
    orderBy: { code: 'asc' }
  });

  // Calculate balances up to date
  // This is a simplified version. In production, we should use pre-calculated balances or optimized queries
  const balances = await prisma.journalEntry.groupBy({
    by: ['accountId'],
    where: {
      unitId,
      date: { lte: date }
    },
    _sum: {
      debit: true,
      credit: true
    }
  });

  const balanceMap = new Map<string, number>();
  balances.forEach(b => {
    // Determine normal balance based on account type is tricky without joining account type
    // But we iterate accounts below, so we can calculate net there
    const netDebit = (b._sum.debit?.toNumber() || 0) - (b._sum.credit?.toNumber() || 0);
    balanceMap.set(b.accountId, netDebit);
  });

  const buildTree = (type: AccountType) => {
    const typeAccounts = accounts.filter(a => a.type === type);
    const roots = typeAccounts.filter(a => !a.parentId);

    const buildNode = (account: typeof accounts[0]) => {
      const children = typeAccounts.filter(a => a.parentId === account.id).map(buildNode);
      const directBalance = balanceMap.get(account.id) || 0;

      // Flip sign for Credit normal accounts (Liability, Equity, Revenue)
      // Actually BS is Asset = Liability + Equity
      // Asset (Debit +), Liability (Credit +), Equity (Credit +)
      let amount = directBalance;
      if (type === AccountType.LIABILITY || type === AccountType.EQUITY) {
        amount = -amount;
      }

      // Add children totals
      const childrenTotal = children.reduce((sum, c) => sum + c.amount, 0);

      return {
        code: account.code,
        name: account.name,
        amount: amount + childrenTotal,
        level: account.code.split('-').length, // heuristic
        children: children.length > 0 ? children : undefined
      };
    };

    return roots.map(buildNode);
  };

  const assets = buildTree(AccountType.ASSET);
  const liabilities = buildTree(AccountType.LIABILITY);
  const equity = buildTree(AccountType.EQUITY);

  // Calculate Net Income for Current Period (Retained Earnings logic often needed here)
  // For simplicity, we just return the BS sections

  return {
    assets: { title: "Assets", total: assets.reduce((s, i) => s + i.amount, 0), items: assets },
    liabilities: { title: "Liabilities", total: liabilities.reduce((s, i) => s + i.amount, 0), items: liabilities },
    equity: { title: "Equity", total: equity.reduce((s, i) => s + i.amount, 0), items: equity },
    periodDate: formatDate(date)
  };
}

export async function getIncomeStatement(unitId: string, startDate: Date, endDate: Date): Promise<IncomeExpenseReport> {
  const accounts = await prisma.accountCode.findMany({
    where: {
      type: { in: [AccountType.REVENUE, AccountType.EXPENSE] },
      isActive: true
    },
    orderBy: { code: 'asc' }
  });

  const balances = await prisma.journalEntry.groupBy({
    by: ['accountId'],
    where: {
      unitId,
      date: { gte: startDate, lte: endDate }
    },
    _sum: {
      debit: true,
      credit: true
    }
  });

  const balanceMap = new Map<string, number>();
  balances.forEach(b => {
    const netDebit = (b._sum.debit?.toNumber() || 0) - (b._sum.credit?.toNumber() || 0);
    balanceMap.set(b.accountId, netDebit);
  });

  // Calculate totals
  let totalIncome = 0;
  let totalExpense = 0;

  const breakdown = accounts.map(acc => {
    let amount = balanceMap.get(acc.id) || 0;

    // Revenue is Credit normal (-Debit), Expense is Debit normal (+Debit)
    if (acc.type === AccountType.REVENUE) {
      amount = -amount; // Flip to make Revenue positive
      totalIncome += amount;
    } else {
      totalExpense += amount;
    }

    // Only return leaf nodes with non-zero or top level?
    // For now simple flat list of active accounts with movement
    return {
      period: 'Current', // placeholder
      income: acc.type === AccountType.REVENUE ? amount : 0,
      expense: acc.type === AccountType.EXPENSE ? amount : 0,
      net: 0,
      accountName: acc.name, // Augment type locally if needed or rely on shared
      accountCode: acc.code
    };
  }).filter(item => item.income !== 0 || item.expense !== 0);

  return {
    period: { startDate: formatDate(startDate), endDate: formatDate(endDate) },
    summary: {
      totalIncome,
      totalExpense,
      netIncome: totalIncome - totalExpense
    },
    breakdown: breakdown as any // Casting to bypass strict shape match if shared type differs slightly
  };
}
