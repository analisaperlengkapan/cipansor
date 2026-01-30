import { prisma } from '../../lib/prisma';
import { Prisma, AccountCode, JournalReferenceType } from '@prisma/client';
import { checkPeriodStatus } from '../finance-enhancement/period.service';

// =====================================
// COA (CHART OF ACCOUNTS) SERVICE
// =====================================

export async function createAccount(data: {
  code: string;
  name: string;
  type: string;
  normalBalance: string;
  parentId?: string;
  cashFlowCategory?: string;
  isActive?: boolean;
}) {
  return prisma.accountCode.create({
    data: {
      code: data.code,
      name: data.name,
      type: data.type,
      normalBalance: data.normalBalance,
      parentId: data.parentId,
      cashFlowCategory: data.cashFlowCategory,
      isActive: data.isActive ?? true,
    },
    include: {
      parent: true,
    },
  });
}

export async function updateAccount(
  id: string,
  data: {
    code?: string;
    name?: string;
    type?: string;
    normalBalance?: string;
    parentId?: string;
    cashFlowCategory?: string;
    isActive?: boolean;
  }
) {
  return prisma.accountCode.update({
    where: { id },
    data,
    include: {
      parent: true,
    },
  });
}

export async function getAccounts(query: { search?: string; type?: string; isActive?: boolean }) {
  const where: Prisma.AccountCodeWhereInput = {
    ...(query.isActive !== undefined && { isActive: query.isActive }),
    ...(query.type && { type: query.type }),
    ...(query.search && {
      OR: [
        { code: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ],
    }),
  };

  const accounts = await prisma.accountCode.findMany({
    where,
    orderBy: { code: 'asc' },
    include: {
      parent: { select: { id: true, name: true, code: true } },
    },
  });

  return accounts;
}

export async function getAccountById(id: string) {
  return prisma.accountCode.findUnique({
    where: { id },
    include: {
      parent: true,
      children: true,
    },
  });
}

export async function deleteAccount(id: string) {
  // Check for existing journals
  const journalCount = await prisma.journalEntry.count({
    where: { accountId: id },
  });

  if (journalCount > 0) {
    throw new Error('Cannot delete account with existing journal entries.');
  }

  // Check for children
  const childrenCount = await prisma.accountCode.count({
    where: { parentId: id },
  });

  if (childrenCount > 0) {
    throw new Error('Cannot delete account with child accounts.');
  }

  return prisma.accountCode.delete({
    where: { id },
  });
}

// =====================================
// JOURNAL SERVICE
// =====================================

export async function createManualJournal(data: {
  unitId: string;
  date: Date;
  description: string;
  entries: {
    accountId: string;
    debit: number;
    credit: number;
  }[];
  createdById: string;
}) {
  return prisma.$transaction(async (tx) => {
    // Check if the period is closed inside transaction
    const period = await tx.financialPeriod.findFirst({
      where: {
        unitId: data.unitId,
        startDate: { lte: data.date },
        endDate: { gte: data.date },
      },
    });

    if (period && period.isClosed) {
      throw new Error(`Financial period for ${data.date.toISOString()} is closed.`);
    }

    // Validate balance
    const totalDebit = data.entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = data.entries.reduce((sum, e) => sum + e.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      // Floating point tolerance
      throw new Error(`Journal is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`);
    }

    const referenceId = crypto.randomUUID(); // Group ID for manual entry

    const createdEntries = [];
    for (const entry of data.entries) {
      const je = await tx.journalEntry.create({
        data: {
          unitId: data.unitId,
          accountId: entry.accountId,
          date: data.date,
          description: data.description,
          debit: new Prisma.Decimal(entry.debit),
          credit: new Prisma.Decimal(entry.credit),
          reference: referenceId,
          referenceType: 'MANUAL', // Using string literal as fallback if Enum not exported
          createdById: data.createdById,
        },
      });
      createdEntries.push(je);
    }

    return createdEntries;
  });
}

export async function getJournals(query: {
  unitId?: string;
  accountId?: string;
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
}) {
  const { unitId, accountId, startDate, endDate, page, limit } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.JournalEntryWhereInput = {
    ...(unitId && { unitId }),
    ...(accountId && { accountId }),
    ...(startDate || endDate
      ? {
          date: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          },
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.journalEntry.findMany({
      where,
      include: {
        account: { select: { code: true, name: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.journalEntry.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// =====================================
// REPORTS SERVICE
// =====================================

export async function getTrialBalance(query: {
  unitId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const { unitId, startDate, endDate } = query;

  const where: Prisma.JournalEntryWhereInput = {
    ...(unitId && { unitId }),
    ...(startDate || endDate
      ? {
          date: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          },
        }
      : {}),
  };

  // Group by accountId
  const aggregations = await prisma.journalEntry.groupBy({
    by: ['accountId'],
    where,
    _sum: {
      debit: true,
      credit: true,
    },
  });

  // Fetch account details
  const accounts = await prisma.accountCode.findMany({
    orderBy: { code: 'asc' },
  });

  // Map results
  const result = accounts.map((acc) => {
    const agg = aggregations.find((a) => a.accountId === acc.id);
    const totalDebit = agg?._sum.debit?.toNumber() || 0;
    const totalCredit = agg?._sum.credit?.toNumber() || 0;

    // Calculate net balance based on normal balance
    let balance = 0;
    if (acc.normalBalance === 'DEBIT') {
      balance = totalDebit - totalCredit;
    } else {
      balance = totalCredit - totalDebit;
    }

    return {
      accountId: acc.id,
      code: acc.code,
      name: acc.name,
      type: acc.type,
      normalBalance: acc.normalBalance,
      debit: totalDebit,
      credit: totalCredit,
      balance,
    };
  });

  // Filter out zero balances if needed, or keep for full report
  return result;
}

export async function getBalanceSheet(query: { unitId?: string; endDate: Date }) {
  // Balance sheet is "As of Date", so we need all transactions up to endDate
  const trialBalance = await getTrialBalance({
    unitId: query.unitId,
    endDate: query.endDate,
  });

  // Filter for Asset, Liability, Equity
  const assets = trialBalance.filter((i) => i.type === 'ASSET');
  const liabilities = trialBalance.filter((i) => i.type === 'LIABILITY');
  const equity = trialBalance.filter((i) => i.type === 'EQUITY');

  // Calculate Net Income (Retained Earnings) from Revenue - Expense
  // This is a simplified calculation. Real systems might close periods.
  const revenues = trialBalance.filter((i) => i.type === 'REVENUE');
  const expenses = trialBalance.filter((i) => i.type === 'EXPENSE');

  const totalRevenue = revenues.reduce((sum, i) => sum + i.credit - i.debit, 0); // Rev is Credit normal
  const totalExpense = expenses.reduce((sum, i) => sum + i.debit - i.credit, 0); // Exp is Debit normal
  const netIncome = totalRevenue - totalExpense;

  return {
    assets,
    totalAssets: assets.reduce((sum, i) => sum + i.balance, 0),
    liabilities,
    totalLiabilities: liabilities.reduce((sum, i) => sum + i.balance, 0),
    equity,
    netIncome,
    totalEquity: equity.reduce((sum, i) => sum + i.balance, 0) + netIncome,
  };
}

export async function getIncomeStatement(query: {
  unitId?: string;
  startDate: Date;
  endDate: Date;
}) {
  const trialBalance = await getTrialBalance({
    unitId: query.unitId,
    startDate: query.startDate,
    endDate: query.endDate,
  });

  const revenues = trialBalance.filter((i) => i.type === 'REVENUE');
  const expenses = trialBalance.filter((i) => i.type === 'EXPENSE');

  const totalRevenue = revenues.reduce((sum, i) => sum + i.credit - i.debit, 0);
  const totalExpense = expenses.reduce((sum, i) => sum + i.debit - i.credit, 0);

  return {
    revenues,
    totalRevenue,
    expenses,
    totalExpense,
    netIncome: totalRevenue - totalExpense,
  };
}

// =====================================
// SEEDING SERVICE
// =====================================

export async function seedDefaultAccounts() {
  const defaultAccounts = [
    // 1. ASSETS (ASET)
    { code: '1100', name: 'ASET LANCAR', type: 'ASSET', normalBalance: 'DEBIT' },
    { code: '1101', name: 'Kas Tunai', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '1100' },
    { code: '1102', name: 'Bank Syariah', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '1100' },
    { code: '1103', name: 'Piutang Santri/Siswa', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '1100' },
    { code: '1104', name: 'Perlengkapan (Supplies)', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '1100' },
    { code: '1105', name: 'Uang Muka', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '1100' },

    { code: '1200', name: 'ASET TETAP', type: 'ASSET', normalBalance: 'DEBIT' },
    { code: '1201', name: 'Tanah', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '1200' },
    { code: '1202', name: 'Bangunan', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '1200' },
    { code: '1203', name: 'Akumulasi Penyusutan Bangunan', type: 'ASSET', normalBalance: 'CREDIT', parentCode: '1202' },
    { code: '1204', name: 'Kendaraan', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '1200' },
    { code: '1205', name: 'Akumulasi Penyusutan Kendaraan', type: 'ASSET', normalBalance: 'CREDIT', parentCode: '1204' },
    { code: '1206', name: 'Inventaris & Peralatan', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '1200' },
    { code: '1207', name: 'Akumulasi Penyusutan Inventaris', type: 'ASSET', normalBalance: 'CREDIT', parentCode: '1206' },

    // 2. LIABILITIES (KEWAJIBAN/LIABILITAS)
    { code: '2100', name: 'LIABILITAS JANGKA PENDEK', type: 'LIABILITY', normalBalance: 'CREDIT' },
    { code: '2101', name: 'Hutang Usaha', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '2100' },
    { code: '2102', name: 'Hutang Gaji & Honor', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '2100' },
    { code: '2103', name: 'Pendapatan Diterima Dimuka', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '2100' },
    { code: '2104', name: 'Titipan Dana ZISWAF (Sementara)', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '2100' },

    { code: '2200', name: 'LIABILITAS JANGKA PANJANG', type: 'LIABILITY', normalBalance: 'CREDIT' },
    { code: '2201', name: 'Hutang Bank', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '2200' },
    { code: '2202', name: 'Hutang Pihak Ketiga', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '2200' },

    // 3. NET ASSETS (ASET NETO - ISAK 35)
    // Menggantikan Ekuitas/Modal konvensional
    { code: '3100', name: 'ASET NETO TIDAK TERIKAT', type: 'EQUITY', normalBalance: 'CREDIT' },
    { code: '3101', name: 'Aset Neto Tidak Terikat (Saldo Awal)', type: 'EQUITY', normalBalance: 'CREDIT', parentCode: '3100' },
    { code: '3102', name: 'Surplus/Defisit Tahun Berjalan - Tidak Terikat', type: 'EQUITY', normalBalance: 'CREDIT', parentCode: '3100' },

    { code: '3200', name: 'ASET NETO TERIKAT TEMPORER', type: 'EQUITY', normalBalance: 'CREDIT' },
    { code: '3201', name: 'Aset Neto Terikat Program', type: 'EQUITY', normalBalance: 'CREDIT', parentCode: '3200' },
    { code: '3202', name: 'Surplus/Defisit Tahun Berjalan - Terikat', type: 'EQUITY', normalBalance: 'CREDIT', parentCode: '3200' },

    { code: '3300', name: 'ASET NETO TERIKAT PERMANEN', type: 'EQUITY', normalBalance: 'CREDIT' },
    { code: '3301', name: 'Dana Abadi (Endowment)', type: 'EQUITY', normalBalance: 'CREDIT', parentCode: '3300' },
    { code: '3302', name: 'Wakaf Tunai', type: 'EQUITY', normalBalance: 'CREDIT', parentCode: '3300' },

    // 4. REVENUES (PENDAPATAN)
    { code: '4100', name: 'PENDAPATAN JASA LAYANAN (TIDAK TERIKAT)', type: 'REVENUE', normalBalance: 'CREDIT' },
    { code: '4101', name: 'Pendapatan SPP', type: 'REVENUE', normalBalance: 'CREDIT', parentCode: '4100' },
    { code: '4102', name: 'Pendapatan Uang Pangkal/Gedung', type: 'REVENUE', normalBalance: 'CREDIT', parentCode: '4100' },
    { code: '4103', name: 'Pendapatan Asrama/Boarding', type: 'REVENUE', normalBalance: 'CREDIT', parentCode: '4100' },
    { code: '4104', name: 'Pendapatan Laundry & Kantin', type: 'REVENUE', normalBalance: 'CREDIT', parentCode: '4100' },

    { code: '4200', name: 'PENERIMAAN SUMBANGAN (TERIKAT/TIDAK TERIKAT)', type: 'REVENUE', normalBalance: 'CREDIT' },
    { code: '4201', name: 'Penerimaan Zakat', type: 'REVENUE', normalBalance: 'CREDIT', parentCode: '4200' },
    { code: '4202', name: 'Penerimaan Infaq/Shodaqoh', type: 'REVENUE', normalBalance: 'CREDIT', parentCode: '4200' },
    { code: '4203', name: 'Penerimaan Wakaf', type: 'REVENUE', normalBalance: 'CREDIT', parentCode: '4200' },
    { code: '4204', name: 'Hibah Pemerintah (BOS/BOP)', type: 'REVENUE', normalBalance: 'CREDIT', parentCode: '4200' },

    // 5. EXPENSES (BEBAN)
    { code: '5100', name: 'BEBAN PROGRAM PENDIDIKAN & DAKWAH', type: 'EXPENSE', normalBalance: 'DEBIT' },
    { code: '5101', name: 'Gaji & Honor Guru/Ustadz', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5100' },
    { code: '5102', name: 'Tunjangan & Kesejahteraan Guru', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5100' },
    { code: '5103', name: 'Beban Operasional KBM', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5100' },
    { code: '5104', name: 'Beban Kegiatan Santri', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5100' },
    { code: '5105', name: 'Penyaluran Beasiswa', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5100' },

    { code: '5200', name: 'BEBAN UMUM & ADMINISTRASI', type: 'EXPENSE', normalBalance: 'DEBIT' },
    { code: '5201', name: 'Gaji & Honor Staff Admin', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5200' },
    { code: '5202', name: 'Listrik, Air, Internet', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5200' },
    { code: '5203', name: 'Pemeliharaan Gedung & Aset', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5200' },
    { code: '5204', name: 'ATK & Perlengkapan Kantor', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5200' },
    { code: '5205', name: 'Beban Penyusutan', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5200' },

    { code: '5300', name: 'BEBAN PENGGALANGAN DANA', type: 'EXPENSE', normalBalance: 'DEBIT' },
    { code: '5301', name: 'Biaya Event & Sosialisasi', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5300' },
  ];

  const results = [];

  // First pass: Create parent accounts
  for (const acc of defaultAccounts) {
    if (acc.parentCode) continue;

    const existing = await prisma.accountCode.findUnique({
      where: { code: acc.code },
    });

    if (!existing) {
      const created = await prisma.accountCode.create({
        data: {
          code: acc.code,
          name: acc.name,
          type: acc.type,
          normalBalance: acc.normalBalance,
          isActive: true,
        },
      });
      results.push(created);
    }
  }

  // Second pass: Create child accounts and link to parents
  for (const acc of defaultAccounts) {
    if (!acc.parentCode) continue;

    const existing = await prisma.accountCode.findUnique({
      where: { code: acc.code },
    });

    if (!existing) {
      // Find parent
      const parent = await prisma.accountCode.findUnique({
        where: { code: acc.parentCode },
      });

      if (parent) {
        const created = await prisma.accountCode.create({
          data: {
            code: acc.code,
            name: acc.name,
            type: acc.type,
            normalBalance: acc.normalBalance,
            isActive: true,
            parentId: parent.id,
          },
        });
        results.push(created);
      }
    }
  }

  return results;
}
