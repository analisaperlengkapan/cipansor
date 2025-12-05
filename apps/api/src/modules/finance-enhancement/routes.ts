import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@/lib/prisma';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== ACCOUNT CODES ====================

/**
 * @route GET /api/finance-enhancement/account-codes
 * @desc List all account codes
 */
router.get('/account-codes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, isActive, search, page = 1, limit = 50 } = req.query;

    const whereClause: any = {};
    if (type) whereClause.type = type;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';
    if (search) {
      whereClause.OR = [
        { code: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [accountCodes, total] = await Promise.all([
      prisma.accountCode.findMany({
        where: whereClause,
        include: {
          parent: { select: { id: true, code: true, name: true } },
          children: { select: { id: true, code: true, name: true } }
        },
        orderBy: { code: 'asc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      }),
      prisma.accountCode.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: accountCodes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/finance-enhancement/account-codes
 * @desc Create account code
 */
router.post('/account-codes', authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, name, type, parentId, isActive } = req.body;

    // Check code uniqueness
    const existing = await prisma.accountCode.findUnique({ where: { code } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Account code already exists'
      });
    }

    const accountCode = await prisma.accountCode.create({
      data: {
        code,
        name,
        type,
        parentId,
        isActive: isActive ?? true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Account code created',
      data: accountCode
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/finance-enhancement/account-codes/:id
 * @desc Update account code
 */
router.put('/account-codes/:id', authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, type, parentId, isActive } = req.body;

    const accountCode = await prisma.accountCode.update({
      where: { id },
      data: {
        name,
        type,
        parentId,
        isActive
      }
    });

    res.json({
      success: true,
      message: 'Account code updated',
      data: accountCode
    });
  } catch (error) {
    next(error);
  }
});

// ==================== JOURNAL ENTRIES ====================

/**
 * @route GET /api/finance-enhancement/journal-entries
 * @desc List journal entries
 */
router.get('/journal-entries', authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      unitId, 
      accountId,
      startDate, 
      endDate, 
      search,
      page = 1, 
      limit = 20 
    } = req.query;

    const whereClause: any = {};
    if (unitId) whereClause.unitId = unitId;
    if (accountId) whereClause.accountId = accountId;
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate as string);
      if (endDate) whereClause.date.lte = new Date(endDate as string);
    }
    if (search) {
      whereClause.description = { contains: search as string, mode: 'insensitive' };
    }

    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where: whereClause,
        include: {
          unit: { select: { id: true, name: true } },
          account: { select: { id: true, code: true, name: true, type: true } },
          createdBy: { select: { id: true, name: true } }
        },
        orderBy: { date: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      }),
      prisma.journalEntry.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: entries,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/finance-enhancement/journal-entries
 * @desc Create journal entry
 */
router.post('/journal-entries', authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      unitId,
      accountId,
      date,
      description,
      debit,
      credit,
      reference,
      referenceType
    } = req.body;

    const entry = await prisma.journalEntry.create({
      data: {
        unitId,
        accountId,
        date: new Date(date),
        description,
        debit: debit || 0,
        credit: credit || 0,
        reference,
        referenceType,
        createdById: (req as any).user.id
      },
      include: {
        unit: { select: { name: true } },
        account: { select: { code: true, name: true } }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Journal entry created',
      data: entry
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/finance-enhancement/journal-entries/:id
 * @desc Get journal entry by ID
 */
router.get('/journal-entries/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const entry = await prisma.journalEntry.findUnique({
      where: { id },
      include: {
        unit: { select: { id: true, name: true } },
        account: { select: { id: true, code: true, name: true, type: true } },
        createdBy: { select: { id: true, name: true } }
      }
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    next(error);
  }
});

// ==================== SCHOLARSHIPS ====================

/**
 * @route GET /api/finance-enhancement/scholarships
 * @desc List scholarships
 */
router.get('/scholarships', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { unitId, type, source, isActive, page = 1, limit = 20 } = req.query;

    const whereClause: any = {};
    if (unitId) whereClause.unitId = unitId;
    if (type) whereClause.type = type;
    if (source) whereClause.source = source;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';

    const [scholarships, total] = await Promise.all([
      prisma.scholarship.findMany({
        where: whereClause,
        include: {
          unit: { select: { id: true, name: true } },
          _count: { select: { recipients: true, discounts: true } }
        },
        orderBy: { name: 'asc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      }),
      prisma.scholarship.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: scholarships,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/finance-enhancement/scholarships
 * @desc Create scholarship
 */
router.post('/scholarships', authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      description,
      source,
      type,
      quota,
      requirements,
      startDate,
      endDate,
      unitId,
      isActive
    } = req.body;

    const scholarship = await prisma.scholarship.create({
      data: {
        name,
        description,
        source,
        type,
        quota,
        requirements,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        unitId,
        isActive: isActive ?? true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Scholarship created',
      data: scholarship
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/finance-enhancement/scholarships/:id
 * @desc Get scholarship by ID
 */
router.get('/scholarships/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

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

    if (!scholarship) {
      return res.status(404).json({
        success: false,
        message: 'Scholarship not found'
      });
    }

    res.json({
      success: true,
      data: scholarship
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/finance-enhancement/scholarships/:id/recipients
 * @desc Get scholarship recipients
 */
router.get('/scholarships/:id/recipients', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    const whereClause: any = { scholarshipId: id };
    if (status) whereClause.status = status;

    const [recipients, total] = await Promise.all([
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
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      }),
      prisma.scholarshipRecipient.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: recipients.map(r => ({
        id: r.id,
        status: r.status,
        startDate: r.startDate,
        endDate: r.endDate,
        notes: r.notes,
        student: {
          id: r.student.id,
          nis: r.student.nis,
          name: r.student.user.name,
          class: r.student.enrollments[0]?.class?.name || '-'
        },
        academicYear: r.academicYear.name
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/finance-enhancement/scholarship-recipients
 * @desc Assign scholarship to student
 */
router.post('/scholarship-recipients', authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      scholarshipId,
      studentId,
      academicYearId,
      startDate,
      endDate,
      notes
    } = req.body;

    // Check if student already has this scholarship in the academic year
    const existing = await prisma.scholarshipRecipient.findFirst({
      where: {
        scholarshipId,
        studentId,
        academicYearId
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Student already has this scholarship for the academic year'
      });
    }

    const recipient = await prisma.scholarshipRecipient.create({
      data: {
        scholarshipId,
        studentId,
        academicYearId,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        notes,
        status: 'ACTIVE'
      },
      include: {
        scholarship: { select: { name: true } },
        student: {
          include: { user: { select: { name: true } } }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Scholarship assigned to student',
      data: {
        id: recipient.id,
        scholarship: recipient.scholarship.name,
        student: recipient.student.user.name,
        nis: recipient.student.nis
      }
    });
  } catch (error) {
    next(error);
  }
});

// ==================== PAYMENT COMPONENTS ====================

/**
 * @route GET /api/finance-enhancement/payment-components
 * @desc List payment components
 */
router.get('/payment-components', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { unitId, category, isActive, page = 1, limit = 20 } = req.query;

    const whereClause: any = {};
    if (unitId) whereClause.unitId = unitId;
    if (category) whereClause.category = category;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';

    const [components, total] = await Promise.all([
      prisma.paymentComponent.findMany({
        where: whereClause,
        include: {
          unit: { select: { id: true, name: true } }
        },
        orderBy: { name: 'asc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      }),
      prisma.paymentComponent.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: components,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/finance-enhancement/payment-components
 * @desc Create payment component
 */
router.post('/payment-components', authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      code,
      name,
      description,
      category,
      amount,
      unitId,
      isActive
    } = req.body;

    const component = await prisma.paymentComponent.create({
      data: {
        code,
        name,
        description,
        category,
        amount,
        unitId,
        isActive: isActive ?? true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Payment component created',
      data: component
    });
  } catch (error) {
    next(error);
  }
});

// ==================== REPORTS ====================

/**
 * @route GET /api/finance-enhancement/reports/trial-balance
 * @desc Get trial balance report
 */
router.get('/reports/trial-balance', authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { unitId, startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const whereClause: any = {
      date: {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      }
    };
    if (unitId) whereClause.unitId = unitId;

    // Get all journal entries in the period
    const entries = await prisma.journalEntry.findMany({
      where: whereClause,
      include: {
        account: true
      }
    });

    // Calculate balances by account
    const accountBalances: Record<string, { 
      code: string; 
      name: string; 
      type: string;
      debit: number; 
      credit: number; 
    }> = {};

    for (const entry of entries) {
      const key = entry.account.code;
      if (!accountBalances[key]) {
        accountBalances[key] = {
          code: entry.account.code,
          name: entry.account.name,
          type: entry.account.type || '',
          debit: 0,
          credit: 0
        };
      }
      accountBalances[key].debit += Number(entry.debit);
      accountBalances[key].credit += Number(entry.credit);
    }

    // Sort by account code
    const sortedBalances = Object.values(accountBalances).sort((a, b) => 
      a.code.localeCompare(b.code)
    );

    // Calculate totals
    const totals = sortedBalances.reduce(
      (acc, item) => ({
        debit: acc.debit + item.debit,
        credit: acc.credit + item.credit
      }),
      { debit: 0, credit: 0 }
    );

    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        accounts: sortedBalances,
        totals,
        isBalanced: Math.abs(totals.debit - totals.credit) < 0.01
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/finance-enhancement/reports/income-expense
 * @desc Get income vs expense report
 */
router.get('/reports/income-expense', authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { unitId, startDate, endDate, groupBy = 'month' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const whereClause: any = {
      date: {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      }
    };
    if (unitId) whereClause.unitId = unitId;

    const entries = await prisma.journalEntry.findMany({
      where: whereClause,
      include: {
        account: true
      },
      orderBy: { date: 'asc' }
    });

    // Calculate income and expenses
    let totalIncome = 0;
    let totalExpense = 0;
    const breakdown: Record<string, { income: number; expense: number }> = {};

    for (const entry of entries) {
      const isIncome = entry.account.type === 'REVENUE';
      const isExpense = entry.account.type === 'EXPENSE';

      const dateKey = groupBy === 'month' 
        ? `${entry.date.getFullYear()}-${String(entry.date.getMonth() + 1).padStart(2, '0')}`
        : entry.date.toISOString().split('T')[0];

      if (!breakdown[dateKey]) {
        breakdown[dateKey] = { income: 0, expense: 0 };
      }

      if (isIncome) {
        totalIncome += Number(entry.credit);
        breakdown[dateKey].income += Number(entry.credit);
      }
      if (isExpense) {
        totalExpense += Number(entry.debit);
        breakdown[dateKey].expense += Number(entry.debit);
      }
    }

    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        summary: {
          totalIncome,
          totalExpense,
          netIncome: totalIncome - totalExpense
        },
        breakdown: Object.entries(breakdown)
          .map(([period, data]) => ({
            period,
            ...data,
            net: data.income - data.expense
          }))
          .sort((a, b) => a.period.localeCompare(b.period))
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
