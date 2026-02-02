
import { PrismaClient } from '@prisma/client';
import {
  TrialBalanceItem,
  CashFlowItem,
} from '@cipansor/shared';
import { prisma } from '@/lib/prisma';
import { checkPeriodStatus } from './period.service';
import {
  AccountCode,
  CreateAccountCodeInput,
  UpdateAccountCodeInput,
  JournalEntry,
  CreateJournalEntryInput,
  Scholarship,
  CreateScholarshipInput,
  ScholarshipRecipient,
  AssignScholarshipInput,
  PaymentComponent,
  CreatePaymentComponentInput,
  TrialBalanceReport,
  IncomeExpenseReport,
  SharedPaginatedResponse,
  AccountType,
  FinanceReportPeriod,
} from '@cipansor/shared';

// Define locally if missing in shared
export interface GeneralLedgerItem {
  id: string;
  date: Date;
  transactionNo?: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface CreateManualJournalInput {
  unitId?: string;
  date: Date | string;
  description: string;
  entries: {
    accountId: string;
    debit: number;
    credit: number;
  }[];
}

export class FinanceEnhancementService {
  // Use global prisma, no constructor needed or implicit public prisma property
  // Removing constructor to avoid "Expected 0 arguments, but got 1" error if controller instantiates with 1 arg.
  // Actually, if controller calls `new FinanceEnhancementService()`, it expects 0.
  // The error `Expected 0 arguments, but got 1` suggests we are calling `new FinanceEnhancementService(prisma)`.
  // So we SHOULD have a constructor if we want to support that, OR update export.
  // Since I want to use global prisma, I will remove constructor AND update export to `new FinanceEnhancementService()`.

  // ==================== ACCOUNT CODES ====================

  async getAccountCodes(params: {
    type?: string;
    isActive?: boolean;
    search?: string;
    page: number;
    limit: number;
  }): Promise<SharedPaginatedResponse<AccountCode>> {
    const { type, isActive, search, page, limit } = params;

    const whereClause: any = {};
    if (type) whereClause.type = type;
    if (isActive !== undefined) whereClause.isActive = isActive;
    if (search) {
      whereClause.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.accountCode.findMany({
        where: whereClause,
        include: {
          parent: { select: { id: true, code: true, name: true, type: true } },
          children: { select: { id: true, code: true, name: true, type: true } },
        },
        orderBy: { code: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.accountCode.count({ where: whereClause }),
    ]);

    return {
      success: true,
      data: data.map(this.mapToAccountCode),
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async createAccountCode(input: CreateAccountCodeInput): Promise<AccountCode> {
    const existing = await prisma.accountCode.findUnique({ where: { code: input.code } });
    if (existing) {
      throw new Error('Account code already exists');
    }

    const accountCode = await prisma.accountCode.create({
      data: {
        code: input.code,
        name: input.name,
        type: input.type,
        parentId: input.parentId,
        isActive: input.isActive ?? true,
        cashFlowCategory: input.cashFlowCategory,
      },
    });

    return this.mapToAccountCode(accountCode);
  }

  async updateAccountCode(id: string, input: UpdateAccountCodeInput): Promise<AccountCode> {
    const accountCode = await prisma.accountCode.update({
      where: { id },
      data: {
        ...input,
        type: input.type ? input.type : undefined,
        cashFlowCategory: input.cashFlowCategory,
      },
    });
    return this.mapToAccountCode(accountCode);
  }

  // ==================== JOURNAL ENTRIES ====================

  async getJournalEntries(params: {
    unitId?: string;
    accountId?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
    page: number;
    limit: number;
  }): Promise<SharedPaginatedResponse<JournalEntry>> {
    const { unitId, accountId, startDate, endDate, search, page, limit } = params;

    const whereClause: any = {};
    if (unitId) whereClause.unitId = unitId;
    if (accountId) whereClause.accountId = accountId;
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = startDate;
      if (endDate) whereClause.date.lte = endDate;
    }
    if (search) {
      whereClause.description = { contains: search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where: whereClause,
        include: {
          unit: { select: { id: true, name: true } },
          account: { select: { id: true, code: true, name: true, type: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.journalEntry.count({ where: whereClause }),
    ]);

    return {
      success: true,
      data: data.map(this.mapToJournalEntry),
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async createJournalEntry(
    input: CreateJournalEntryInput & { createdById: string }
  ): Promise<JournalEntry> {
    const entryDate = new Date(input.date);
    await checkPeriodStatus(input.unitId, entryDate);

    const result = await prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.create({
        data: {
          unitId: input.unitId,
          accountId: input.accountId,
          date: entryDate,
          description: input.description || '',
          debit: input.debit || 0,
          credit: input.credit || 0,
          reference: input.reference,
          referenceType: input.referenceType ?? null,
          createdById: input.createdById,
        },
        include: {
          unit: { select: { name: true } },
          account: { select: { code: true, name: true, normalBalance: true } },
        },
      });

      return entry;
    });

    return this.mapToJournalEntry(result);
  }

  async getJournalEntryById(id: string): Promise<JournalEntry | null> {
    const entry = await prisma.journalEntry.findUnique({
      where: { id },
      include: {
        unit: { select: { id: true, name: true } },
        account: { select: { id: true, code: true, name: true, type: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!entry) return null;

    return this.mapToJournalEntry(entry);
  }

  // ==================== SCHOLARSHIPS ====================

  async getScholarships(params: {
    unitId?: string;
    type?: string;
    source?: string;
    isActive?: boolean;
    page: number;
    limit: number;
  }): Promise<SharedPaginatedResponse<Scholarship>> {
    const { unitId, type, source, isActive, page, limit } = params;

    const whereClause: any = {};
    if (unitId) whereClause.unitId = unitId;
    if (type) whereClause.type = type;
    if (source) whereClause.source = source;
    if (isActive !== undefined) whereClause.isActive = isActive;

    const [data, total] = await Promise.all([
      prisma.scholarship.findMany({
        where: whereClause,
        include: {
          unit: { select: { id: true, name: true } },
          _count: { select: { recipients: true, discounts: true } },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.scholarship.count({ where: whereClause }),
    ]);

    return {
      success: true,
      data: data.map(this.mapToScholarship),
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async createScholarship(input: CreateScholarshipInput): Promise<Scholarship> {
    const scholarship = await prisma.scholarship.create({
      data: {
        name: input.name,
        description: input.description,
        source: input.source as string,
        type: input.type as string,
        quota: input.quota,
        requirements: input.requirements,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
        unitId: input.unitId,
        isActive: input.isActive ?? true,
      },
    });

    return this.mapToScholarship(scholarship);
  }

  async getScholarshipById(id: string): Promise<Scholarship | null> {
    const scholarship = await prisma.scholarship.findUnique({
      where: { id },
      include: {
        unit: { select: { id: true, name: true } },
        discounts: {
          include: {
            component: { select: { code: true, name: true, amount: true } },
          },
        },
        _count: { select: { recipients: true } },
      },
    });

    if (!scholarship) return null;
    return this.mapToScholarship(scholarship);
  }

  async getScholarshipRecipients(
    id: string,
    params: {
      status?: string;
      page: number;
      limit: number;
    }
  ): Promise<SharedPaginatedResponse<ScholarshipRecipient>> {
    const { status, page, limit } = params;

    const whereClause: any = { scholarshipId: id };
    if (status) whereClause.status = status;

    const [data, total] = await Promise.all([
      prisma.scholarshipRecipient.findMany({
        where: whereClause,
        include: {
          student: {
            include: {
              user: { select: { name: true } },
              enrollments: {
                where: { status: 'ACTIVE' },
                include: { class: { select: { name: true } } },
                take: 1,
              },
            },
          },
          academicYear: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.scholarshipRecipient.count({ where: whereClause }),
    ]);

    return {
      success: true,
      data: data.map(this.mapToScholarshipRecipient),
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async assignScholarship(input: AssignScholarshipInput): Promise<ScholarshipRecipient> {
    const existing = await prisma.scholarshipRecipient.findFirst({
      where: {
        scholarshipId: input.scholarshipId,
        studentId: input.studentId,
        academicYearId: input.academicYearId,
      },
    });

    if (existing) {
      throw new Error('Student already has this scholarship for the academic year');
    }

    const recipient = await prisma.scholarshipRecipient.create({
      data: {
        scholarshipId: input.scholarshipId,
        studentId: input.studentId,
        academicYearId: input.academicYearId,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
        notes: input.notes,
        status: 'ACTIVE',
      },
      include: {
        scholarship: { select: { name: true } },
        student: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    return this.mapToScholarshipRecipient(recipient);
  }

  // ==================== PAYMENT COMPONENTS ====================

  async getPaymentComponents(params: {
    unitId?: string;
    category?: string;
    isActive?: boolean;
    page: number;
    limit: number;
  }): Promise<SharedPaginatedResponse<PaymentComponent>> {
    const { unitId, category, isActive, page, limit } = params;

    const whereClause: any = {};
    if (unitId) whereClause.unitId = unitId;
    if (category) whereClause.category = category;
    if (isActive !== undefined) whereClause.isActive = isActive;

    const [data, total] = await Promise.all([
      prisma.paymentComponent.findMany({
        where: whereClause,
        include: {
          unit: { select: { id: true, name: true } },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.paymentComponent.count({ where: whereClause }),
    ]);

    const mappedData = data.map((item) => ({
      ...item,
      amount: Number(item.amount),
    }));

    return {
      success: true,
      data: mappedData as unknown as PaymentComponent[],
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async createPaymentComponent(input: CreatePaymentComponentInput): Promise<PaymentComponent> {
    const component = await prisma.paymentComponent.create({
      data: {
        code: input.code,
        name: input.name,
        description: input.description,
        category: input.category as string,
        amount: input.amount,
        unitId: input.unitId,
        isActive: input.isActive ?? true,
      },
    });

    return {
      ...component,
      amount: Number(component.amount),
    } as unknown as PaymentComponent;
  }

  // ==================== REPORTS ====================

  async getTrialBalance(params: {
    unitId: string;
    startDate: Date;
    endDate: Date;
  }): Promise<TrialBalanceItem[]> {
    const { unitId, startDate, endDate } = params;

    const accounts = await prisma.accountCode.findMany({
      orderBy: { code: 'asc' },
    });

    const entries = await prisma.journalEntry.findMany({
      where: {
        unitId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const balances: Record<string, { debit: number; credit: number }> = {};

    entries.forEach((entry) => {
      if (!balances[entry.accountId]) {
        balances[entry.accountId] = { debit: 0, credit: 0 };
      }
      balances[entry.accountId].debit += entry.debit.toNumber();
      balances[entry.accountId].credit += entry.credit.toNumber();
    });

    // @ts-ignore
    const trialBalanceItems: TrialBalanceItem[] = accounts.map((account) => {
      const balance = balances[account.id] || { debit: 0, credit: 0 };
      return {
        accountId: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        startBalance: 0,
        endBalance: balance.debit - balance.credit,
        debit: balance.debit,
        credit: balance.credit,
      };
    });

    return trialBalanceItems;
  }

  async getGeneralLedger(params: {
    unitId: string;
    accountId: string;
    startDate: Date;
    endDate: Date;
  }): Promise<GeneralLedgerItem[]> {
    const { unitId, accountId, startDate, endDate } = params;

    const entries = await prisma.journalEntry.findMany({
      where: {
        accountId,
        unitId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    let runningBalance = 0;

    return entries.map((entry) => {
      const debit = entry.debit.toNumber();
      const credit = entry.credit.toNumber();
      runningBalance += debit - credit;

      return {
        id: entry.id,
        date: entry.date,
        transactionNo: entry.reference || '',
        description: entry.description,
        debit,
        credit,
        balance: runningBalance,
      };
    });
  }

  async getCashFlow(params: {
    unitId: string;
    startDate: Date;
    endDate: Date;
  }): Promise<CashFlowItem[]> {
    return [];
  }

  async createManualJournal(data: CreateManualJournalInput & { createdById: string; unitId: string }) {
    const { date, description, entries, createdById, unitId } = data;

    const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error('Journal entries must balance (Debit must equal Credit)');
    }

    return prisma.$transaction(
      entries.map((entry) =>
        prisma.journalEntry.create({
          data: {
            unitId,
            accountId: entry.accountId,
            date: new Date(date),
            description,
            debit: entry.debit,
            credit: entry.credit,
            createdById,
            reference: 'MANUAL',
            referenceType: 'MANUAL',
          },
        })
      )
    );
  }

  async getIncomeExpenseReport(params: {
    unitId?: string;
    startDate: Date;
    endDate: Date;
    groupBy?: FinanceReportPeriod | 'day' | 'month';
  }): Promise<IncomeExpenseReport> {
    const { unitId, startDate, endDate, groupBy = FinanceReportPeriod.MONTH } = params;

    const dateFormat = groupBy === FinanceReportPeriod.MONTH ? 'YYYY-MM' : 'YYYY-MM-DD';

    const results = await prisma.$queryRaw<Array<{ period: string; type: string; total: bigint }>>`
      SELECT
        TO_CHAR(je.date, ${dateFormat}) as period,
        ac.type,
        SUM(COALESCE(je.credit, 0) - COALESCE(je.debit, 0)) as total
      FROM "journal_entries" je
      JOIN "account_codes" ac ON je.account_id = ac.id
      WHERE je.unit_id = ${unitId}
        AND je.date >= ${startDate}
        AND je.date <= ${endDate}
        AND ac.type IN (${AccountType.REVENUE}, ${AccountType.EXPENSE})
      GROUP BY 1, 2
      ORDER BY 1 ASC
    `;

    const breakdownMap: Record<string, { income: number; expense: number }> = {};
    let totalIncome = 0;
    let totalExpense = 0;

    results.forEach((row) => {
      const period = row.period;
      const val = Number(row.total);

      if (!breakdownMap[period]) {
        breakdownMap[period] = { income: 0, expense: 0 };
      }

      if (row.type === AccountType.REVENUE) {
        const amount = val;
        breakdownMap[period].income += amount;
        totalIncome += amount;
      } else if (row.type === AccountType.EXPENSE) {
        const amount = -val;
        breakdownMap[period].expense += amount;
        totalExpense += amount;
      }
    });

    const breakdown = Object.entries(breakdownMap)
      .map(([period, data]) => ({
        period,
        income: data.income,
        expense: data.expense,
        net: data.income - data.expense,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      summary: {
        totalIncome,
        totalExpense,
        netIncome: totalIncome - totalExpense,
      },
      breakdown,
    };
  }

  // ==================== HELPERS ====================

  private mapToAccountCode(prismaAccount: any): AccountCode {
    return {
      id: prismaAccount.id,
      code: prismaAccount.code,
      name: prismaAccount.name,
      type: prismaAccount.type as AccountType,
      parentId: prismaAccount.parentId,
      isActive: prismaAccount.isActive,
      createdAt: prismaAccount.createdAt,
      updatedAt: prismaAccount.updatedAt,
      parent: prismaAccount.parent
        ? {
            id: prismaAccount.parent.id,
            code: prismaAccount.parent.code,
            name: prismaAccount.parent.name,
            type: prismaAccount.parent.type as AccountType,
            isActive: true,
          }
        : undefined,
      children: prismaAccount.children
        ? prismaAccount.children.map((c: any) => ({
            id: c.id,
            code: c.code,
            name: c.name,
            type: c.type as AccountType,
            isActive: true,
          }))
        : undefined,
    };
  }

  private mapToJournalEntry(prismaEntry: any): JournalEntry {
    return {
      id: prismaEntry.id,
      unitId: prismaEntry.unitId,
      accountId: prismaEntry.accountId,
      date: prismaEntry.date,
      description: prismaEntry.description,
      debit: Number(prismaEntry.debit),
      credit: Number(prismaEntry.credit),
      reference: prismaEntry.reference,
      referenceType: prismaEntry.referenceType,
      createdById: prismaEntry.createdById,
      createdAt: prismaEntry.createdAt,
      updatedAt: prismaEntry.updatedAt,

      unit: prismaEntry.unit,
      account: prismaEntry.account
        ? {
            id: prismaEntry.account.id,
            code: prismaEntry.account.code,
            name: prismaEntry.account.name,
            type: prismaEntry.account.type as AccountType,
            isActive: true,
          }
        : undefined,
      createdBy: prismaEntry.createdBy,
    };
  }

  private mapToScholarship(prismaScholarship: any): Scholarship {
    return {
      id: prismaScholarship.id,
      name: prismaScholarship.name,
      description: prismaScholarship.description,
      source: prismaScholarship.source,
      type: prismaScholarship.type,
      quota: prismaScholarship.quota,
      requirements: prismaScholarship.requirements,
      startDate: prismaScholarship.startDate,
      endDate: prismaScholarship.endDate,
      unitId: prismaScholarship.unitId,
      isActive: prismaScholarship.isActive,
      createdAt: prismaScholarship.createdAt,
      updatedAt: prismaScholarship.updatedAt,
      unit: prismaScholarship.unit,
      _count: prismaScholarship._count,
    };
  }

  private mapToScholarshipRecipient(prismaRecipient: any): ScholarshipRecipient {
    return {
      id: prismaRecipient.id,
      scholarshipId: prismaRecipient.scholarshipId,
      studentId: prismaRecipient.studentId,
      academicYearId: prismaRecipient.academicYearId,
      startDate: prismaRecipient.startDate,
      endDate: prismaRecipient.endDate,
      notes: prismaRecipient.notes,
      status: prismaRecipient.status,
      createdAt: prismaRecipient.createdAt,
      updatedAt: prismaRecipient.updatedAt,
      student: prismaRecipient.student
        ? {
            id: prismaRecipient.student.id,
            nis: prismaRecipient.student.nis,
            name: prismaRecipient.student.user?.name || '',
            class: prismaRecipient.student.enrollments?.[0]?.class?.name || '-',
          }
        : undefined,
      academicYear: prismaRecipient.academicYear,
      scholarship: prismaRecipient.scholarship,
    };
  }
}

// Export singleton without constructor arg (since we removed it)
export const financeEnhancementService = new FinanceEnhancementService();
