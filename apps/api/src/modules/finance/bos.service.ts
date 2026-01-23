import { prisma } from '@/lib/prisma';
import { Errors } from '@/middleware/error';
import { UserRole, Prisma, PaymentStatus, PaymentMethod } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// User type from JwtPayload
interface AuthenticatedUser {
  sub: string;
  role: UserRole;
  unitId: string | null;
}

// BOS Component Categories (8 Komponen sesuai Permendikbud)
export const BOS_COMPONENTS = [
  {
    code: 'BOS-01',
    name: 'Pengembangan Perpustakaan',
    description: 'Pembelian buku, e-book, akses jurnal',
    maxPercentage: 15,
  },
  {
    code: 'BOS-02',
    name: 'Penerimaan Peserta Didik Baru',
    description: 'Biaya PPDB, formulir, seleksi',
    maxPercentage: 10,
  },
  {
    code: 'BOS-03',
    name: 'Kegiatan Pembelajaran dan Ekstrakurikuler',
    description: 'Alat pembelajaran, ekskul',
    maxPercentage: 15,
  },
  {
    code: 'BOS-04',
    name: 'Kegiatan Evaluasi Pembelajaran',
    description: 'Ujian, ulangan, penilaian',
    maxPercentage: 10,
  },
  {
    code: 'BOS-05',
    name: 'Pengelolaan Sekolah',
    description: 'ATK, administrasi, manajemen',
    maxPercentage: 15,
  },
  {
    code: 'BOS-06',
    name: 'Pengembangan Profesi Guru',
    description: 'Pelatihan, workshop, sertifikasi',
    maxPercentage: 10,
  },
  {
    code: 'BOS-07',
    name: 'Langganan Daya dan Jasa',
    description: 'Listrik, air, internet, telepon',
    maxPercentage: 15,
  },
  {
    code: 'BOS-08',
    name: 'Pemeliharaan dan Perawatan',
    description: 'Perbaikan gedung, peralatan',
    maxPercentage: 10,
  },
] as const;

export type BosComponentCode = (typeof BOS_COMPONENTS)[number]['code'];

interface BosAllocation {
  id?: string;
  unitId: string;
  year: number;
  quarter: number; // 1-4
  totalAmount: number;
  allocations: {
    componentCode: BosComponentCode;
    amount: number;
    description?: string;
  }[];
}

interface BosExpense {
  id?: string;
  unitId: string;
  componentCode: BosComponentCode;
  date: Date;
  amount: number;
  description: string;
  receiptNumber?: string;
  vendor?: string;
  attachmentUrl?: string;
  verifiedById?: string;
}

interface BosReportQuery {
  unitId: string;
  year: number;
  quarter?: number;
}

export class BosService {
  // ==================
  // ALLOCATION MANAGEMENT
  // ==================

  async createAllocation(input: BosAllocation, currentUser: AuthenticatedUser) {
    // Access control
    if (currentUser.role !== UserRole.SUPER_ADMIN && currentUser.unitId !== input.unitId) {
      throw Errors.forbidden('Access denied');
    }

    // Validate total allocations match total amount
    const totalAllocated = input.allocations.reduce((sum, a) => sum + a.amount, 0);
    if (Math.abs(totalAllocated - input.totalAmount) > 0.01) {
      throw Errors.badRequest('Total allocations must equal total amount');
    }

    // Validate percentage limits
    for (const allocation of input.allocations) {
      const component = BOS_COMPONENTS.find((c) => c.code === allocation.componentCode);
      if (!component) {
        throw Errors.badRequest(`Invalid component code: ${allocation.componentCode}`);
      }
      const percentage = (allocation.amount / input.totalAmount) * 100;
      if (percentage > component.maxPercentage) {
        throw Errors.badRequest(
          `${component.name} exceeds maximum ${component.maxPercentage}% (actual: ${percentage.toFixed(1)}%)`
        );
      }
    }

    // Store as JSON in a generic data table or use existing model
    // For this implementation, we'll use Invoice model with special paymentType

    // First, ensure BOS payment type exists
    let bosPaymentType = await prisma.paymentType.findFirst({
      where: { unitId: input.unitId, code: 'BOS' },
    });

    if (!bosPaymentType) {
      bosPaymentType = await prisma.paymentType.create({
        data: {
          unitId: input.unitId,
          code: 'BOS',
          name: 'Dana BOS',
          amount: new Decimal(0),
          isRecurring: false,
          isActive: true,
        },
      });
    }

    // Create audit log for BOS allocation
    await prisma.auditLog.create({
      data: {
        userId: currentUser.sub,
        action: 'CREATE',
        entity: 'BOS_ALLOCATION',
        entityId: `${input.unitId}-${input.year}-Q${input.quarter}`,
        newValues: input as any,
      },
    });

    return {
      unitId: input.unitId,
      year: input.year,
      quarter: input.quarter,
      totalAmount: input.totalAmount,
      allocations: input.allocations,
      createdAt: new Date(),
    };
  }

  // ==================
  // EXPENSE TRACKING
  // ==================

  async recordExpense(input: BosExpense, currentUser: AuthenticatedUser) {
    // Access control
    if (currentUser.role !== UserRole.SUPER_ADMIN && currentUser.unitId !== input.unitId) {
      throw Errors.forbidden('Access denied');
    }

    // Validate component code
    const component = BOS_COMPONENTS.find((c) => c.code === input.componentCode);
    if (!component) {
      throw Errors.badRequest(`Invalid component code: ${input.componentCode}`);
    }

    // Create audit log for expense
    const auditLog = await prisma.auditLog.create({
      data: {
        userId: currentUser.sub,
        action: 'CREATE',
        entity: 'BOS_EXPENSE',
        newValues: {
          ...input,
          componentName: component.name,
        } as any,
      },
    });

    return {
      id: auditLog.id,
      ...input,
      componentName: component.name,
      createdAt: new Date(),
      createdBy: currentUser.sub,
    };
  }

  // ==================
  // REPORTING
  // ==================

  async getBosSummary(query: BosReportQuery, currentUser: AuthenticatedUser) {
    const { unitId, year, quarter } = query;

    // Access control
    if (currentUser.role !== UserRole.SUPER_ADMIN && currentUser.unitId !== unitId) {
      throw Errors.forbidden('Access denied');
    }

    // Get unit info
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        students: { where: { status: 'active', deletedAt: null } },
      },
    });

    if (!unit) {
      throw Errors.notFound('Unit not found');
    }

    // Calculate BOS amount based on student count (simplified)
    // Note: Actual BOS amount varies by year and school type
    const bosPerStudent = this.getBosPerStudent(unit.type, year);
    const totalStudents = unit.students.length;
    const estimatedBosAmount = totalStudents * bosPerStudent;

    // Get audit logs for BOS allocations and expenses
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entity: { in: ['BOS_ALLOCATION', 'BOS_EXPENSE'] },
        entityId: quarter
          ? { startsWith: `${unitId}-${year}-Q${quarter}` }
          : { startsWith: `${unitId}-${year}` },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate expenses by component (from audit logs)
    const expensesByComponent: Record<string, number> = {};
    BOS_COMPONENTS.forEach((c) => {
      expensesByComponent[c.code] = 0;
    });

    const expenses = auditLogs
      .filter((log) => log.entity === 'BOS_EXPENSE')
      .map((log) => log.newValues as any);

    expenses.forEach((expense: any) => {
      if (expense.componentCode) {
        expensesByComponent[expense.componentCode] =
          (expensesByComponent[expense.componentCode] || 0) + (expense.amount || 0);
      }
    });

    // Calculate totals
    const totalExpenses = Object.values(expensesByComponent).reduce((sum, v) => sum + v, 0);
    const remainingBudget = estimatedBosAmount - totalExpenses;

    // Build component breakdown
    const componentBreakdown = BOS_COMPONENTS.map((component) => {
      const spent = expensesByComponent[component.code] || 0;
      const maxAllocation = (estimatedBosAmount * component.maxPercentage) / 100;
      const usagePercentage = maxAllocation > 0 ? (spent / maxAllocation) * 100 : 0;

      return {
        code: component.code,
        name: component.name,
        description: component.description,
        maxPercentage: component.maxPercentage,
        maxAllocation,
        spent,
        remaining: maxAllocation - spent,
        usagePercentage: Math.round(usagePercentage * 10) / 10,
        status: usagePercentage > 100 ? 'OVER_BUDGET' : usagePercentage > 80 ? 'WARNING' : 'OK',
      };
    });

    return {
      unit: {
        id: unit.id,
        name: unit.name,
        type: unit.type,
      },
      period: {
        year,
        quarter: quarter || 'ALL',
      },
      students: {
        total: totalStudents,
        bosPerStudent,
      },
      budget: {
        estimatedBosAmount,
        totalExpenses,
        remainingBudget,
        usagePercentage:
          estimatedBosAmount > 0
            ? Math.round((totalExpenses / estimatedBosAmount) * 100 * 10) / 10
            : 0,
      },
      componentBreakdown,
      recentExpenses: expenses.slice(0, 10),
    };
  }

  async getBosTransparencyReport(unitId: string, year: number, currentUser: AuthenticatedUser) {
    // Access control - transparency reports are publicly viewable
    // but we still need authentication

    const summary = await this.getBosSummary({ unitId, year }, currentUser);

    // Format for transparency report
    return {
      ...summary,
      generatedAt: new Date(),
      reportTitle: `Laporan Penggunaan Dana BOS ${summary.unit.name} Tahun ${year}`,
      disclaimer:
        'Laporan ini dibuat untuk transparansi penggunaan Dana Bantuan Operasional Sekolah (BOS) sesuai dengan Permendikbud tentang Penggunaan Dana BOS.',
      components: summary.componentBreakdown.map((c) => ({
        ...c,
        transactions: [], // Would include actual transactions
      })),
    };
  }

  async getQuarterlyReport(
    unitId: string,
    year: number,
    quarter: number,
    currentUser: AuthenticatedUser
  ) {
    // Access control
    if (currentUser.role !== UserRole.SUPER_ADMIN && currentUser.unitId !== unitId) {
      throw Errors.forbidden('Access denied');
    }

    const summary = await this.getBosSummary({ unitId, year, quarter }, currentUser);

    // Quarter-specific calculations
    const quarterMonths = this.getQuarterMonths(quarter);
    const quarterBudget = summary.budget.estimatedBosAmount / 4;

    return {
      ...summary,
      quarter,
      quarterName: `Triwulan ${quarter}`,
      quarterPeriod: quarterMonths,
      quarterBudget,
      quarterUsage: summary.budget.totalExpenses,
      quarterRemaining: quarterBudget - summary.budget.totalExpenses,
    };
  }

  // ==================
  // VALIDATION & COMPLIANCE
  // ==================

  async validateBosUsage(unitId: string, year: number, currentUser: AuthenticatedUser) {
    const summary = await this.getBosSummary({ unitId, year }, currentUser);
    const issues: Array<{ code: string; severity: 'error' | 'warning'; message: string }> = [];

    // Check each component against limits
    summary.componentBreakdown.forEach((component) => {
      if (component.status === 'OVER_BUDGET') {
        issues.push({
          code: component.code,
          severity: 'error',
          message: `${component.name} melebihi batas maksimum ${component.maxPercentage}%`,
        });
      } else if (component.status === 'WARNING') {
        issues.push({
          code: component.code,
          severity: 'warning',
          message: `${component.name} sudah mencapai ${component.usagePercentage}% dari batas`,
        });
      }
    });

    // Check overall usage
    if (summary.budget.usagePercentage > 100) {
      issues.push({
        code: 'TOTAL_BUDGET',
        severity: 'error',
        message: 'Total penggunaan melebihi estimasi dana BOS',
      });
    }

    // Check for unused categories
    summary.componentBreakdown
      .filter((c) => c.usagePercentage === 0)
      .forEach((c) => {
        issues.push({
          code: c.code,
          severity: 'warning',
          message: `${c.name} belum ada pengeluaran tercatat`,
        });
      });

    return {
      isCompliant: issues.filter((i) => i.severity === 'error').length === 0,
      totalIssues: issues.length,
      errorCount: issues.filter((i) => i.severity === 'error').length,
      warningCount: issues.filter((i) => i.severity === 'warning').length,
      issues,
    };
  }

  // ==================
  // HELPERS
  // ==================

  private getBosPerStudent(unitType: string, year: number): number {
    // BOS amounts per student per year (simplified - actual amounts vary)
    // Source: Permendikbud annual decree
    const bosRates: Record<string, number> = {
      PAUD: 2400000,
      TK: 2400000,
      SD_IT: 900000,
      SMP_IT: 1100000,
      SMA_QURAN: 1500000,
      PESANTREN: 1500000,
      OTHER: 1000000,
    };
    return bosRates[unitType] || bosRates.OTHER;
  }

  private getQuarterMonths(quarter: number): string {
    const quarters: Record<number, string> = {
      1: 'Januari - Maret',
      2: 'April - Juni',
      3: 'Juli - September',
      4: 'Oktober - Desember',
    };
    return quarters[quarter] || '';
  }
}

export const bosService = new BosService();
