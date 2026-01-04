import { prisma } from '@/lib/prisma';
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
  Pagination
} from '@cipansor/shared';
import { AccountType } from '@cipansor/shared';
import { Prisma } from '@prisma/client';

export class FinanceEnhancementService {

  // ==================== ACCOUNT CODES ====================

  async getAccountCodes(params: {
    type?: string;
    isActive?: boolean;
    search?: string;
    page: number;
    limit: number;
  }): Promise<SharedPaginatedResponse<AccountCode>> {
    const { type, isActive, search, page, limit } = params;

    const whereClause: Prisma.AccountCodeWhereInput = {};
    if (type) whereClause.type = type;
    if (isActive !== undefined) whereClause.isActive = isActive;
    if (search) {
      whereClause.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [data, total] = await Promise.all([
      prisma.accountCode.findMany({
        where: whereClause,
        include: {
          parent: { select: { id: true, code: true, name: true } },
          children: { select: { id: true, code: true, name: true } }
        },
        orderBy: { code: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.accountCode.count({ where: whereClause })
    ]);

    return {
      success: true,
      data: data as unknown as AccountCode[],
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
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
        type: input.type as unknown as string, // Cast to unknown first to handle potential undefined type inference
        parentId: input.parentId,
        isActive: input.isActive ?? true
      }
    });

    return accountCode as unknown as AccountCode;
  }

  async updateAccountCode(id: string, input: UpdateAccountCodeInput): Promise<AccountCode> {
    const accountCode = await prisma.accountCode.update({
      where: { id },
      data: {
        ...input,
        type: input.type ? (input.type as unknown as string) : undefined // Handle optional update
      }
    });
    return accountCode as unknown as AccountCode;
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

    const whereClause: Prisma.JournalEntryWhereInput = {};
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
          createdBy: { select: { id: true, name: true } }
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.journalEntry.count({ where: whereClause })
    ]);

    // Prisma returns Decimal, shared type expects number. Explicit cast needed or JSON serialization handles it.
    // For safer typing, we map it.
    const mappedData = data.map(entry => ({
      ...entry,
      debit: Number(entry.debit),
      credit: Number(entry.credit)
    }));

    return {
      success: true,
      data: mappedData as unknown as JournalEntry[],
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  }

  async createJournalEntry(input: CreateJournalEntryInput & { createdById: string }): Promise<JournalEntry> {
    const entry = await prisma.journalEntry.create({
      data: {
        unitId: input.unitId,
        accountId: input.accountId,
        date: new Date(input.date),
        description: input.description || '',
        debit: input.debit || 0,
        credit: input.credit || 0,
        reference: input.reference,
        referenceType: input.referenceType ?? null, // Fixed null vs undefined issue
        createdById: input.createdById
      },
      include: {
        unit: { select: { name: true } },
        account: { select: { code: true, name: true } }
      }
    });

    return {
      ...entry,
      debit: Number(entry.debit),
      credit: Number(entry.credit)
    } as unknown as JournalEntry;
  }

  async getJournalEntryById(id: string): Promise<JournalEntry | null> {
    const entry = await prisma.journalEntry.findUnique({
      where: { id },
      include: {
        unit: { select: { id: true, name: true } },
        account: { select: { id: true, code: true, name: true, type: true } },
        createdBy: { select: { id: true, name: true } }
      }
    });

    if (!entry) return null;

    return {
      ...entry,
      debit: Number(entry.debit),
      credit: Number(entry.credit)
    } as unknown as JournalEntry;
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

    const whereClause: Prisma.ScholarshipWhereInput = {};
    if (unitId) whereClause.unitId = unitId;
    if (type) whereClause.type = type;
    if (source) whereClause.source = source;
    if (isActive !== undefined) whereClause.isActive = isActive;

    const [data, total] = await Promise.all([
      prisma.scholarship.findMany({
        where: whereClause,
        include: {
          unit: { select: { id: true, name: true } },
          _count: { select: { recipients: true, discounts: true } }
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.scholarship.count({ where: whereClause })
    ]);

    return {
      success: true,
      data: data as unknown as Scholarship[],
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
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
        isActive: input.isActive ?? true
      }
    });

    return scholarship as unknown as Scholarship;
  }

  async getScholarshipById(id: string): Promise<Scholarship | null> {
    const scholarship = await prisma.scholarship.findUnique({
      where: { id },
      include: {
        unit: { select: { id: true, name: true } },
        discounts: {
          include: {
            component: { select: { code: true, name: true, amount: true } }
          }
        },
        _count: { select: { recipients: true } }
      }
    });
    return scholarship as unknown as Scholarship;
  }

  async getScholarshipRecipients(id: string, params: {
    status?: string;
    page: number;
    limit: number;
  }): Promise<SharedPaginatedResponse<ScholarshipRecipient>> {
    const { status, page, limit } = params;

    const whereClause: Prisma.ScholarshipRecipientWhereInput = { scholarshipId: id };
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
                take: 1
              }
            }
          },
          academicYear: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.scholarshipRecipient.count({ where: whereClause })
    ]);

    const mappedData = data.map(r => ({
      id: r.id,
      scholarshipId: r.scholarshipId,
      studentId: r.studentId,
      academicYearId: r.academicYearId,
      startDate: r.startDate,
      endDate: r.endDate,
      notes: r.notes,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      student: {
        id: r.student.id,
        nis: r.student.nis,
        name: r.student.user.name,
        class: r.student.enrollments[0]?.class?.name || '-'
      },
      academicYear: { id: r.academicYearId, name: r.academicYear.name }
    }));

    return {
      success: true,
      data: mappedData as unknown as ScholarshipRecipient[],
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  }

  async assignScholarship(input: AssignScholarshipInput): Promise<ScholarshipRecipient> {
    const existing = await prisma.scholarshipRecipient.findFirst({
      where: {
        scholarshipId: input.scholarshipId,
        studentId: input.studentId,
        academicYearId: input.academicYearId
      }
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
        status: 'ACTIVE'
      },
      include: {
        scholarship: { select: { name: true } },
        student: {
          include: { user: { select: { name: true } } }
        }
      }
    });

    return recipient as unknown as ScholarshipRecipient;
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

    const whereClause: Prisma.PaymentComponentWhereInput = {};
    if (unitId) whereClause.unitId = unitId;
    if (category) whereClause.category = category;
    if (isActive !== undefined) whereClause.isActive = isActive;

    const [data, total] = await Promise.all([
      prisma.paymentComponent.findMany({
        where: whereClause,
        include: {
          unit: { select: { id: true, name: true } }
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.paymentComponent.count({ where: whereClause })
    ]);

    const mappedData = data.map(item => ({
      ...item,
      amount: Number(item.amount)
    }));

    return {
      success: true,
      data: mappedData as unknown as PaymentComponent[],
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
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
        isActive: input.isActive ?? true
      }
    });

    return {
      ...component,
      amount: Number(component.amount)
    } as unknown as PaymentComponent;
  }

  // ==================== REPORTS ====================

  async getTrialBalance(params: {
    unitId?: string;
    startDate: Date;
    endDate: Date;
  }): Promise<TrialBalanceReport> {
    const { unitId, startDate, endDate } = params;

    // Use aggregate where possible or query raw for efficiency if needed
    // But since we need grouped by account, we can fetch all relevant entries
    // and group by accountId, summing debits and credits.

    // Optimization: Use groupBy to let DB do the heavy lifting
    const grouped = await prisma.journalEntry.groupBy({
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

    // Fetch account details for the grouped IDs
    const accountIds = grouped.map(g => g.accountId);
    const accounts = await prisma.accountCode.findMany({
      where: { id: { in: accountIds } }
    });

    const accountMap = new Map(accounts.map(a => [a.id, a]));

    const resultAccounts = grouped.map(group => {
      const account = accountMap.get(group.accountId);
      return {
        code: account?.code || 'UNKNOWN',
        name: account?.name || 'Unknown Account',
        type: account?.type || 'OTHER',
        debit: Number(group._sum.debit || 0),
        credit: Number(group._sum.credit || 0)
      };
    }).sort((a, b) => a.code.localeCompare(b.code));

    const totals = resultAccounts.reduce(
      (acc, item) => ({
        debit: acc.debit + item.debit,
        credit: acc.credit + item.credit
      }),
      { debit: 0, credit: 0 }
    );

    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      accounts: resultAccounts,
      totals,
      isBalanced: Math.abs(totals.debit - totals.credit) < 0.01
    };
  }

  async getIncomeExpenseReport(params: {
    unitId?: string;
    startDate: Date;
    endDate: Date;
    groupBy?: 'day' | 'month';
  }): Promise<IncomeExpenseReport> {
    const { unitId, startDate, endDate, groupBy = 'month' } = params;

    // Optimization: Use prisma.$queryRaw for efficient database-level aggregation
    // This avoids fetching thousands of records into memory

    const dateFormat = groupBy === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD';

    // Note: We use raw table names "journal_entries" and "account_codes" and snake_case columns
    // We also handle the filtering for 'REVENUE' and 'EXPENSE' account types

    const results = await prisma.$queryRaw<Array<{ period: string, type: string, total: bigint }>>`
      SELECT
        TO_CHAR(je.date, ${dateFormat}) as period,
        ac.type,
        SUM(COALESCE(je.credit, 0) - COALESCE(je.debit, 0)) as total
      FROM "journal_entries" je
      JOIN "account_codes" ac ON je.account_id = ac.id
      WHERE je.unit_id = ${unitId}
        AND je.date >= ${startDate}
        AND je.date <= ${endDate}
        AND ac.type IN ('REVENUE', 'EXPENSE')
      GROUP BY 1, 2
      ORDER BY 1 ASC
    `;

    // Process results into the desired format
    const breakdownMap: Record<string, { income: number; expense: number }> = {};
    let totalIncome = 0;
    let totalExpense = 0;

    results.forEach((row) => {
      const period = row.period;
      // Note: total is BigInt, cast to Number (safe for finance reports usually, or use string)
      // Revenue is usually positive in this calculation (Credit - Debit),
      // Expense is usually negative if we did Credit - Debit, but let's handle signs carefully.

      // Actually, for Account Type:
      // Revenue: Credit increases it.
      // Expense: Debit increases it.
      // The query did SUM(Credit - Debit).
      // So Revenue items will be positive.
      // Expense items will be negative (since they are mostly Debit).

      const val = Number(row.total);

      if (!breakdownMap[period]) {
        breakdownMap[period] = { income: 0, expense: 0 };
      }

      if (row.type === 'REVENUE') {
        // Revenue is Credit balance
        const amount = val; // Positive
        breakdownMap[period].income += amount;
        totalIncome += amount;
      } else if (row.type === 'EXPENSE') {
        // Expense is Debit balance.
        // Query did Credit - Debit. So Expense entries (Debit) resulted in negative val.
        // We want positive magnitude for the report.
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
        net: data.income - data.expense
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      summary: {
        totalIncome,
        totalExpense,
        netIncome: totalIncome - totalExpense
      },
      breakdown
    };
  }
}

export const financeEnhancementService = new FinanceEnhancementService();
