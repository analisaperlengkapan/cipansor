/**
 * Payroll Service
 * Layanan Penggajian untuk Yayasan/Pesantren/Sekolah
 * 
 * Fitur:
 * - Komponen gaji (tunjangan & potongan)
 * - Pengaturan gaji per karyawan
 * - Periode penggajian
 * - Kalkulasi slip gaji
 * - Kalkulasi PPh 21
 */

import { prisma } from '../../lib/prisma';
import { Prisma, SalaryComponentType, PayrollStatus, AccountType } from '@prisma/client';
import {
  CreateSalaryComponentInput,
  UpdateSalaryComponentInput,
  CreateEmployeeSalaryInput,
  UpdateEmployeeSalaryInput,
  CreatePayrollPeriodInput,
  UpdatePayrollPeriodInput,
  GeneratePayrollInput,
  PayrollItemAdjustmentInput,
} from './payroll.schema';

// ============================================
// PPh 21 TAX CALCULATION (Simplified)
// ============================================

// PTKP 2024 (Penghasilan Tidak Kena Pajak)
const PTKP: Record<string, number> = {
  'TK/0': 54000000,   // Tidak Kawin, 0 tanggungan
  'TK/1': 58500000,   // Tidak Kawin, 1 tanggungan
  'TK/2': 63000000,   // Tidak Kawin, 2 tanggungan
  'TK/3': 67500000,   // Tidak Kawin, 3 tanggungan
  'K/0': 58500000,    // Kawin, 0 tanggungan
  'K/1': 63000000,    // Kawin, 1 tanggungan
  'K/2': 67500000,    // Kawin, 2 tanggungan
  'K/3': 72000000,    // Kawin, 3 tanggungan
  'K/I/0': 112500000, // Kawin, istri bekerja, 0 tanggungan
  'K/I/1': 117000000, // Kawin, istri bekerja, 1 tanggungan
  'K/I/2': 121500000, // Kawin, istri bekerja, 2 tanggungan
  'K/I/3': 126000000, // Kawin, istri bekerja, 3 tanggungan
};

// Tarif progresif PPh 21 (2024)
const TAX_BRACKETS = [
  { limit: 60000000, rate: 0.05 },
  { limit: 250000000, rate: 0.15 },
  { limit: 500000000, rate: 0.25 },
  { limit: 5000000000, rate: 0.30 },
  { limit: Infinity, rate: 0.35 },
];

function calculateAnnualTax(annualTaxableIncome: number): number {
  if (annualTaxableIncome <= 0) return 0;

  let tax = 0;
  let remaining = annualTaxableIncome;
  let previousLimit = 0;

  for (const bracket of TAX_BRACKETS) {
    const bracketAmount = Math.min(remaining, bracket.limit - previousLimit);
    if (bracketAmount <= 0) break;

    tax += bracketAmount * bracket.rate;
    remaining -= bracketAmount;
    previousLimit = bracket.limit;
  }

  return tax;
}

function calculateMonthlyPph21(
  monthlyGrossIncome: number,
  taxStatus: string = 'TK/0',
  hasNpwp: boolean = true
): number {
  const ptkp = PTKP[taxStatus] || PTKP['TK/0'];
  
  // Annualized calculation
  const annualGross = monthlyGrossIncome * 12;
  
  // Biaya jabatan (5% max 6jt/tahun)
  const biayaJabatan = Math.min(annualGross * 0.05, 6000000);
  
  // Penghasilan Neto
  const annualNet = annualGross - biayaJabatan;
  
  // PKP (Penghasilan Kena Pajak)
  const pkp = Math.max(0, annualNet - ptkp);
  
  // Hitung pajak tahunan
  let annualTax = calculateAnnualTax(pkp);
  
  // Jika tidak punya NPWP, tambah 20%
  if (!hasNpwp) {
    annualTax *= 1.2;
  }
  
  // PPh 21 bulanan
  return Math.round(annualTax / 12);
}

// ============================================
// SALARY COMPONENT SERVICE
// ============================================

export const salaryComponentService = {
  async list(params: {
    type?: SalaryComponentType;
    isActive?: boolean;
    search?: string;
  }) {
    const where: Prisma.SalaryComponentWhereInput = {};

    if (params.type) where.type = params.type;
    if (params.isActive !== undefined) where.isActive = params.isActive;
    if (params.search) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const components = await prisma.salaryComponent.findMany({
      where,
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });

    return components;
  },

  async getById(id: string) {
    return prisma.salaryComponent.findUnique({ where: { id } });
  },

  async create(data: CreateSalaryComponentInput) {
    return prisma.salaryComponent.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        ...data,
        defaultAmount: data.defaultAmount ? new Prisma.Decimal(data.defaultAmount) : null,
        defaultRate: data.defaultRate ? new Prisma.Decimal(data.defaultRate) : null,
      } as any,
    });
  },

  async update(id: string, data: UpdateSalaryComponentInput) {
    return prisma.salaryComponent.update({
      where: { id },
      data: {
        ...data,
        defaultAmount: data.defaultAmount !== undefined 
          ? (data.defaultAmount ? new Prisma.Decimal(data.defaultAmount) : null)
          : undefined,
        defaultRate: data.defaultRate !== undefined
          ? (data.defaultRate ? new Prisma.Decimal(data.defaultRate) : null)
          : undefined,
      },
    });
  },

  async delete(id: string) {
    // Check if used in any payroll
    const usageCount = await prisma.payrollItem.count({
      where: { componentId: id },
    });

    if (usageCount > 0) {
      throw new Error('Komponen gaji tidak dapat dihapus karena sudah digunakan');
    }

    return prisma.salaryComponent.delete({ where: { id } });
  },

  async seedDefaults() {
    const defaultComponents = [
      // Earnings
      { code: 'GAJI_POKOK', name: 'Gaji Pokok', type: 'EARNING' as SalaryComponentType, isFixed: true, isTaxable: true, sortOrder: 1 },
      { code: 'TUNJ_JABATAN', name: 'Tunjangan Jabatan', type: 'EARNING' as SalaryComponentType, isFixed: true, isTaxable: true, sortOrder: 2 },
      { code: 'TUNJ_MENGAJAR', name: 'Tunjangan Mengajar', type: 'EARNING' as SalaryComponentType, isFixed: true, isTaxable: true, sortOrder: 3 },
      { code: 'TUNJ_SERTIFIKASI', name: 'Tunjangan Sertifikasi', type: 'EARNING' as SalaryComponentType, isFixed: true, isTaxable: true, sortOrder: 4 },
      { code: 'TUNJ_KELUARGA', name: 'Tunjangan Keluarga', type: 'EARNING' as SalaryComponentType, isFixed: true, isTaxable: true, sortOrder: 5 },
      { code: 'TUNJ_TRANSPORT', name: 'Tunjangan Transport', type: 'EARNING' as SalaryComponentType, isFixed: true, isTaxable: false, sortOrder: 6 },
      { code: 'TUNJ_MAKAN', name: 'Tunjangan Makan', type: 'EARNING' as SalaryComponentType, isFixed: true, isTaxable: false, sortOrder: 7 },
      { code: 'HONOR_TAMBAHAN', name: 'Honor Mengajar Tambahan', type: 'EARNING' as SalaryComponentType, isFixed: false, isTaxable: true, sortOrder: 8 },
      { code: 'BONUS', name: 'Bonus', type: 'EARNING' as SalaryComponentType, isFixed: false, isTaxable: true, sortOrder: 9 },
      { code: 'LEMBUR', name: 'Upah Lembur', type: 'EARNING' as SalaryComponentType, isFixed: false, isTaxable: true, sortOrder: 10 },
      // Deductions
      { code: 'PPH21', name: 'PPh 21', type: 'DEDUCTION' as SalaryComponentType, isFixed: false, isTaxable: false, sortOrder: 1 },
      { code: 'BPJS_KES', name: 'BPJS Kesehatan', type: 'DEDUCTION' as SalaryComponentType, isFixed: false, isPercentage: true, percentageOf: 'GAJI_POKOK', defaultRate: 0.01, isTaxable: false, sortOrder: 2 },
      { code: 'BPJS_TK', name: 'BPJS Ketenagakerjaan', type: 'DEDUCTION' as SalaryComponentType, isFixed: false, isPercentage: true, percentageOf: 'GAJI_POKOK', defaultRate: 0.02, isTaxable: false, sortOrder: 3 },
      { code: 'POT_KOPERASI', name: 'Potongan Koperasi', type: 'DEDUCTION' as SalaryComponentType, isFixed: false, isTaxable: false, sortOrder: 4 },
      { code: 'POT_PINJAMAN', name: 'Potongan Pinjaman', type: 'DEDUCTION' as SalaryComponentType, isFixed: false, isTaxable: false, sortOrder: 5 },
      { code: 'POT_LAIN', name: 'Potongan Lain-lain', type: 'DEDUCTION' as SalaryComponentType, isFixed: false, isTaxable: false, sortOrder: 6 },
    ];

    for (const comp of defaultComponents) {
      await prisma.salaryComponent.upsert({
        where: { code: comp.code },
        update: {},
        create: {
          ...comp,
          defaultRate: comp.defaultRate ? new Prisma.Decimal(comp.defaultRate) : null,
        },
      });
    }

    return { created: defaultComponents.length };
  },
};

// ============================================
// EMPLOYEE SALARY SERVICE
// ============================================

export const employeeSalaryService = {
  async list(params: {
    unitId?: string;
    search?: string;
    page: number;
    limit: number;
  }) {
    const { unitId, search, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.EmployeeSalaryWhereInput = {};
    
    if (unitId) {
      where.staff = { unitId };
    }
    if (search) {
      where.OR = [
        { staff: { user: { name: { contains: search, mode: 'insensitive' } } } },
        { staff: { nip: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.employeeSalary.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          staff: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              unit: { select: { id: true, name: true } },
            },
          },
          items: {
            include: {
              component: { select: { code: true, name: true, type: true } },
            },
          },
        },
      }),
      prisma.employeeSalary.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getByStaffId(staffId: string) {
    return prisma.employeeSalary.findUnique({
      where: { staffId },
      include: {
        staff: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            unit: { select: { id: true, name: true } },
          },
        },
        items: {
          include: {
            component: true,
          },
          orderBy: { component: { sortOrder: 'asc' } },
        },
      },
    });
  },

  async create(data: CreateEmployeeSalaryInput) {
    const { items, ...salaryData } = data;

    return prisma.$transaction(async (tx) => {
      const salary = await tx.employeeSalary.create({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: {
          ...salaryData,
          baseSalary: new Prisma.Decimal(salaryData.baseSalary),
          effectiveAt: new Date(salaryData.effectiveAt),
        } as any,
      });

      if (items && items.length > 0) {
        await tx.employeeSalaryItem.createMany({
          data: items.map((item) => ({
            salaryId: salary.id,
            componentId: item.componentId,
            amount: new Prisma.Decimal(item.amount),
            isPercentage: item.isPercentage,
            rate: item.rate ? new Prisma.Decimal(item.rate) : null,
            notes: item.notes,
          })),
        });
      }

      return salary;
    });
  },

  async update(staffId: string, data: UpdateEmployeeSalaryInput) {
    const { items, ...salaryData } = data;

    const existing = await prisma.employeeSalary.findUnique({
      where: { staffId },
    });

    if (!existing) {
      throw new Error('Pengaturan gaji karyawan tidak ditemukan');
    }

    return prisma.$transaction(async (tx) => {
      const salary = await tx.employeeSalary.update({
        where: { staffId },
        data: {
          baseSalary: salaryData.baseSalary 
            ? new Prisma.Decimal(salaryData.baseSalary) 
            : undefined,
          bankName: salaryData.bankName,
          bankAccount: salaryData.bankAccount,
          bankHolder: salaryData.bankHolder,
          taxStatus: salaryData.taxStatus,
          npwp: salaryData.npwp,
          effectiveAt: salaryData.effectiveAt 
            ? new Date(salaryData.effectiveAt) 
            : undefined,
          notes: salaryData.notes,
        },
      });

      if (items) {
        // Delete existing items
        await tx.employeeSalaryItem.deleteMany({
          where: { salaryId: salary.id },
        });

        // Create new items
        if (items.length > 0) {
          await tx.employeeSalaryItem.createMany({
            data: items.map((item) => ({
              salaryId: salary.id,
              componentId: item.componentId,
              amount: new Prisma.Decimal(item.amount),
              isPercentage: item.isPercentage,
              rate: item.rate ? new Prisma.Decimal(item.rate) : null,
              notes: item.notes,
            })),
          });
        }
      }

      return salary;
    });
  },

  async delete(staffId: string) {
    // Check if used in any payroll
    const usageCount = await prisma.payroll.count({
      where: { staffId },
    });

    if (usageCount > 0) {
      throw new Error('Pengaturan gaji tidak dapat dihapus karena sudah ada slip gaji');
    }

    return prisma.employeeSalary.delete({ where: { staffId } });
  },
};

// ============================================
// PAYROLL PERIOD SERVICE
// ============================================

export const payrollPeriodService = {
  async list(params: {
    unitId?: string;
    year?: number;
    status?: PayrollStatus;
    page: number;
    limit: number;
  }) {
    const { unitId, year, status, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.PayrollPeriodWhereInput = {};
    
    if (unitId) where.unitId = unitId;
    if (year) where.year = year;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.payrollPeriod.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        include: {
          unit: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          approvedBy: { select: { id: true, name: true } },
          _count: { select: { payrolls: true } },
        },
      }),
      prisma.payrollPeriod.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getById(id: string) {
    return prisma.payrollPeriod.findUnique({
      where: { id },
      include: {
        unit: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        payrolls: {
          orderBy: { employeeName: 'asc' },
          include: {
            staff: {
              include: {
                user: { select: { name: true } },
              },
            },
          },
        },
      },
    });
  },

  async create(data: CreatePayrollPeriodInput, createdById: string) {
    return prisma.payrollPeriod.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        payDate: data.payDate ? new Date(data.payDate) : null,
        createdById,
      } as any,
    });
  },

  async update(id: string, data: UpdatePayrollPeriodInput) {
    const period = await prisma.payrollPeriod.findUnique({ where: { id } });
    
    if (!period) {
      throw new Error('Periode penggajian tidak ditemukan');
    }

    if (period.status !== 'DRAFT') {
      throw new Error('Hanya periode DRAFT yang dapat diubah');
    }

    return prisma.payrollPeriod.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        payDate: data.payDate ? new Date(data.payDate) : undefined,
      },
    });
  },

  async approve(id: string, approverId: string, notes?: string) {
    const period = await prisma.payrollPeriod.findUnique({
      where: { id },
      include: { _count: { select: { payrolls: true } } },
    });

    if (!period) {
      throw new Error('Periode penggajian tidak ditemukan');
    }

    if (period.status !== 'DRAFT') {
      throw new Error('Hanya periode DRAFT yang dapat disetujui');
    }

    if (period._count.payrolls === 0) {
      throw new Error('Tidak ada slip gaji untuk disetujui');
    }

    return prisma.$transaction(async (tx) => {
      // Update all payrolls to APPROVED
      await tx.payroll.updateMany({
        where: { periodId: id, status: 'DRAFT' },
        data: { status: 'APPROVED' },
      });

      // Update period
      return tx.payrollPeriod.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById: approverId,
          approvedAt: new Date(),
          notes: notes || period.notes,
        },
      });
    });
  },

  async markAsPaid(id: string, payDate: Date, notes?: string) {
    const period = await prisma.payrollPeriod.findUnique({
      where: { id },
      include: { unit: true }
    });

    if (!period) {
      throw new Error('Periode penggajian tidak ditemukan');
    }

    if (period.status !== 'APPROVED') {
      throw new Error('Hanya periode APPROVED yang dapat dibayar');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Update all payrolls to PAID
      await tx.payroll.updateMany({
        where: { periodId: id, status: 'APPROVED' },
        data: { status: 'PAID' },
      });

      // 2. Create Journal Entry in Finance
      // Find account codes (Default fallback if not found)
      // Beban Gaji (Expense) - usually 5-1-xx
      // Kas (Asset) - usually 1-1-xx

      const salaryExpenseAccount = await tx.accountCode.findFirst({
        where: {
          name: { contains: 'Gaji', mode: 'insensitive' },
          type: AccountType.EXPENSE
        }
      });

      const cashAccount = await tx.accountCode.findFirst({
        where: {
          type: AccountType.ASSET,
          code: { startsWith: '1-1' } // Assuming 1-1 is Cash/Bank
        }
      });

      // If accounts exist, create journal entry
      if (salaryExpenseAccount && cashAccount) {
        // Calculate total amount from period record (it stores totalAmount)
        // Ensure we use the latest amount
        const currentTotal = await tx.payroll.aggregate({
          where: { periodId: id },
          _sum: { netSalary: true }
        });

        const totalAmount = Number(currentTotal._sum.netSalary) || 0;

        if (totalAmount > 0) {
          await tx.journalEntry.create({
            data: {
              unitId: period.unitId,
              accountId: salaryExpenseAccount.id, // Debit Expense
              date: payDate,
              description: `Pembayaran Gaji Periode ${period.name}`,
              debit: totalAmount,
              credit: 0,
              reference: period.id,
              referenceType: 'PAYROLL',
              createdById: 'SYSTEM' // System generated
            }
          });

          await tx.journalEntry.create({
            data: {
              unitId: period.unitId,
              accountId: cashAccount.id, // Credit Asset (Cash)
              date: payDate,
              description: `Pembayaran Gaji Periode ${period.name}`,
              debit: 0,
              credit: totalAmount,
              reference: period.id,
              referenceType: 'PAYROLL',
              createdById: 'SYSTEM'
            }
          });
        }
      } else {
        // Hardening: If accounts are missing, throw error to prevent data drift
        const missing = [];
        if (!salaryExpenseAccount) missing.push('Beban Gaji (Expense)');
        if (!cashAccount) missing.push('Kas/Bank (Asset)');
        throw new Error(`Gagal membuat jurnal keuangan: Akun ${missing.join(' dan ')} tidak ditemukan.`);
      }

      // 3. Update period status
      return tx.payrollPeriod.update({
        where: { id },
        data: {
          status: 'PAID',
          payDate,
          paidAt: new Date(),
          notes: notes || period.notes,
        },
      });
    });
  },

  async cancel(id: string, notes?: string) {
    const period = await prisma.payrollPeriod.findUnique({ where: { id } });

    if (!period) {
      throw new Error('Periode penggajian tidak ditemukan');
    }

    if (period.status === 'PAID') {
      throw new Error('Periode yang sudah dibayar tidak dapat dibatalkan');
    }

    return prisma.$transaction(async (tx) => {
      // Update all payrolls to CANCELLED
      await tx.payroll.updateMany({
        where: { periodId: id },
        data: { status: 'CANCELLED' },
      });

      // Update period
      return tx.payrollPeriod.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          notes: notes || period.notes,
        },
      });
    });
  },

  async delete(id: string) {
    const period = await prisma.payrollPeriod.findUnique({ where: { id } });

    if (!period) {
      throw new Error('Periode penggajian tidak ditemukan');
    }

    if (period.status !== 'DRAFT' && period.status !== 'CANCELLED') {
      throw new Error('Hanya periode DRAFT atau CANCELLED yang dapat dihapus');
    }

    return prisma.$transaction(async (tx) => {
      // Delete all payroll items
      await tx.payrollItem.deleteMany({
        where: { payroll: { periodId: id } },
      });

      // Delete all payrolls
      await tx.payroll.deleteMany({
        where: { periodId: id },
      });

      // Delete period
      return tx.payrollPeriod.delete({ where: { id } });
    });
  },
};

// ============================================
// PAYROLL SERVICE
// ============================================

export const payrollService = {
  async list(params: {
    periodId?: string;
    staffId?: string;
    search?: string;
    page: number;
    limit: number;
  }) {
    const { periodId, staffId, search, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.PayrollWhereInput = {};
    
    if (periodId) where.periodId = periodId;
    if (staffId) where.staffId = staffId;
    if (search) {
      where.OR = [
        { employeeName: { contains: search, mode: 'insensitive' } },
        { employeeNo: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.payroll.findMany({
        where,
        skip,
        take: limit,
        orderBy: { employeeName: 'asc' },
        include: {
          period: { select: { id: true, name: true, month: true, year: true } },
          staff: {
            include: {
              user: { select: { name: true, email: true } },
              unit: { select: { name: true } },
            },
          },
        },
      }),
      prisma.payroll.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getById(id: string) {
    return prisma.payroll.findUnique({
      where: { id },
      include: {
        period: true,
        staff: {
          include: {
            user: { select: { name: true, email: true } },
            unit: { select: { name: true } },
          },
        },
        items: {
          orderBy: [{ type: 'asc' }, { component: { sortOrder: 'asc' } }],
          include: {
            component: true,
          },
        },
      },
    });
  },

  async generate(data: GeneratePayrollInput) {
    const period = await prisma.payrollPeriod.findUnique({
      where: { id: data.periodId },
      include: { unit: true },
    });

    if (!period) {
      throw new Error('Periode penggajian tidak ditemukan');
    }

    if (period.status !== 'DRAFT') {
      throw new Error('Hanya periode DRAFT yang dapat digenerate');
    }

    // Get staff with salary configuration
    const staffWhere: Prisma.StaffWhereInput = {
      unitId: period.unitId,
      deletedAt: null,
      employeeSalary: { isNot: null },
    };

    if (data.staffIds && data.staffIds.length > 0) {
      staffWhere.id = { in: data.staffIds };
    }

    const staffList = await prisma.staff.findMany({
      where: staffWhere,
      include: {
        user: { select: { name: true } },
        employeeSalary: {
          include: {
            items: { include: { component: true } },
          },
        },
      },
    });

    if (staffList.length === 0) {
      throw new Error('Tidak ada karyawan dengan pengaturan gaji');
    }

    // Get salary components
    const components = await prisma.salaryComponent.findMany({
      where: { isActive: true },
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }],
    });

    const results: { created: number; updated: number; errors: string[] } = {
      created: 0,
      updated: 0,
      errors: [],
    };

    // Get attendance summary for the period
    const attendanceSummary = await prisma.staffAttendance.groupBy({
      by: ['staffId', 'status'],
      where: {
        staffId: { in: staffList.map(s => s.id) },
        date: {
          gte: period.startDate,
          lte: period.endDate,
        },
      },
      _count: true,
    });

    const attendanceMap = new Map<string, Record<string, number>>();
    for (const att of attendanceSummary) {
      const current = attendanceMap.get(att.staffId) || {};
      current[att.status] = att._count;
      attendanceMap.set(att.staffId, current);
    }

    // Calculate work days in period
    const workDays = calculateWorkDays(period.startDate, period.endDate);

    await prisma.$transaction(async (tx) => {
      for (const staff of staffList) {
        try {
          const empSalary = staff.employeeSalary;
          if (!empSalary) continue;

          // Check existing payroll
          const existing = await tx.payroll.findUnique({
            where: {
              periodId_staffId: {
                periodId: period.id,
                staffId: staff.id,
              },
            },
          });

          if (existing && !data.overwrite) {
            results.errors.push(`${staff.user.name}: Slip gaji sudah ada`);
            continue;
          }

          // Get attendance data
          const attendance = attendanceMap.get(staff.id) || {};
          const presentDays = attendance['PRESENT'] || 0;
          const absentDays = attendance['ABSENT'] || 0;
          const lateDays = attendance['LATE'] || 0;

          // Calculate earnings and deductions
          let totalEarnings = Number(empSalary.baseSalary);
          let totalDeductions = 0;
          let taxableIncome = 0;

          const payrollItems: Prisma.PayrollItemCreateManyInput[] = [];

          // Add base salary as first item
          const baseSalaryComponent = components.find(c => c.code === 'GAJI_POKOK');
          if (baseSalaryComponent) {
            payrollItems.push({
              payrollId: '', // Will be set after payroll creation
              componentId: baseSalaryComponent.id,
              componentCode: baseSalaryComponent.code,
              componentName: baseSalaryComponent.name,
              type: 'EARNING',
              amount: empSalary.baseSalary,
            });
            if (baseSalaryComponent.isTaxable) {
              taxableIncome += Number(empSalary.baseSalary);
            }
          }

          // Add employee-specific salary items
          for (const item of empSalary.items) {
            const comp = item.component;
            let amount = Number(item.amount);

            if (item.isPercentage && item.rate) {
              amount = Number(empSalary.baseSalary) * Number(item.rate);
            }

            if (comp.type === 'EARNING') {
              totalEarnings += amount;
              if (comp.isTaxable) {
                taxableIncome += amount;
              }
            } else {
              totalDeductions += amount;
            }

            payrollItems.push({
              payrollId: '',
              componentId: comp.id,
              componentCode: comp.code,
              componentName: comp.name,
              type: comp.type,
              amount: new Prisma.Decimal(amount),
              isPercentage: item.isPercentage,
              rate: item.rate,
              baseAmount: item.isPercentage ? empSalary.baseSalary : null,
            });
          }

          // Calculate PPh 21
          const hasNpwp = !!empSalary.npwp;
          const taxAmount = calculateMonthlyPph21(taxableIncome, empSalary.taxStatus, hasNpwp);
          
          const pph21Component = components.find(c => c.code === 'PPH21');
          if (pph21Component && taxAmount > 0) {
            totalDeductions += taxAmount;
            payrollItems.push({
              payrollId: '',
              componentId: pph21Component.id,
              componentCode: pph21Component.code,
              componentName: pph21Component.name,
              type: 'DEDUCTION',
              amount: new Prisma.Decimal(taxAmount),
            });
          }

          const netSalary = totalEarnings - totalDeductions;

          // Create or update payroll
          if (existing && data.overwrite) {
            // Delete existing items
            await tx.payrollItem.deleteMany({
              where: { payrollId: existing.id },
            });

            // Update payroll
            await tx.payroll.update({
              where: { id: existing.id },
              data: {
                employeeNo: staff.nip || '',
                employeeName: staff.user.name,
                department: staff.department,
                position: staff.position,
                baseSalary: empSalary.baseSalary,
                totalEarnings: new Prisma.Decimal(totalEarnings),
                totalDeductions: new Prisma.Decimal(totalDeductions),
                netSalary: new Prisma.Decimal(netSalary),
                taxableIncome: new Prisma.Decimal(taxableIncome),
                taxAmount: new Prisma.Decimal(taxAmount),
                taxStatus: empSalary.taxStatus,
                bankName: empSalary.bankName,
                bankAccount: empSalary.bankAccount,
                bankHolder: empSalary.bankHolder,
                workDays,
                presentDays,
                absentDays,
                lateDays,
                status: 'DRAFT',
              },
            });

            // Create items
            await tx.payrollItem.createMany({
              data: payrollItems.map(item => ({
                ...item,
                payrollId: existing.id,
              })),
            });

            results.updated++;
          } else {
            // Create new payroll
            const payroll = await tx.payroll.create({
              data: {
                periodId: period.id,
                staffId: staff.id,
                employeeNo: staff.nip || '',
                employeeName: staff.user.name,
                department: staff.department,
                position: staff.position,
                baseSalary: empSalary.baseSalary,
                totalEarnings: new Prisma.Decimal(totalEarnings),
                totalDeductions: new Prisma.Decimal(totalDeductions),
                netSalary: new Prisma.Decimal(netSalary),
                taxableIncome: new Prisma.Decimal(taxableIncome),
                taxAmount: new Prisma.Decimal(taxAmount),
                taxStatus: empSalary.taxStatus,
                bankName: empSalary.bankName,
                bankAccount: empSalary.bankAccount,
                bankHolder: empSalary.bankHolder,
                workDays,
                presentDays,
                absentDays,
                lateDays,
                status: 'DRAFT',
              },
            });

            // Create items
            await tx.payrollItem.createMany({
              data: payrollItems.map(item => ({
                ...item,
                payrollId: payroll.id,
              })),
            });

            results.created++;
          }
        } catch (error: any) {
          results.errors.push(`${staff.user.name}: ${error.message}`);
        }
      }

      // Update period totals
      const totals = await tx.payroll.aggregate({
        where: { periodId: period.id },
        _sum: { netSalary: true },
        _count: true,
      });

      await tx.payrollPeriod.update({
        where: { id: period.id },
        data: {
          totalAmount: totals._sum.netSalary || 0,
          employeeCount: totals._count,
        },
      });
    });

    return results;
  },

  async adjustItem(payrollId: string, adjustment: PayrollItemAdjustmentInput) {
    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
      include: { period: true },
    });

    if (!payroll) {
      throw new Error('Slip gaji tidak ditemukan');
    }

    if (payroll.period.status !== 'DRAFT') {
      throw new Error('Hanya slip gaji DRAFT yang dapat disesuaikan');
    }

    const component = await prisma.salaryComponent.findUnique({
      where: { id: adjustment.componentId },
    });

    if (!component) {
      throw new Error('Komponen gaji tidak ditemukan');
    }

    // Find or create the item
    const existingItem = await prisma.payrollItem.findFirst({
      where: {
        payrollId,
        componentId: adjustment.componentId,
      },
    });

    if (existingItem) {
      await prisma.payrollItem.update({
        where: { id: existingItem.id },
        data: {
          amount: new Prisma.Decimal(adjustment.amount),
          notes: adjustment.notes,
        },
      });
    } else {
      await prisma.payrollItem.create({
        data: {
          payrollId,
          componentId: adjustment.componentId,
          componentCode: component.code,
          componentName: component.name,
          type: component.type,
          amount: new Prisma.Decimal(adjustment.amount),
          notes: adjustment.notes,
        },
      });
    }

    // Recalculate totals
    const items = await prisma.payrollItem.findMany({
      where: { payrollId },
    });

    let totalEarnings = 0;
    let totalDeductions = 0;

    for (const item of items) {
      if (item.type === 'EARNING') {
        totalEarnings += Number(item.amount);
      } else {
        totalDeductions += Number(item.amount);
      }
    }

    const netSalary = totalEarnings - totalDeductions;

    await prisma.payroll.update({
      where: { id: payrollId },
      data: {
        totalEarnings: new Prisma.Decimal(totalEarnings),
        totalDeductions: new Prisma.Decimal(totalDeductions),
        netSalary: new Prisma.Decimal(netSalary),
      },
    });

    return prisma.payroll.findUnique({
      where: { id: payrollId },
      include: { items: { include: { component: true } } },
    });
  },

  async getSummary(periodId: string) {
    const period = await prisma.payrollPeriod.findUnique({
      where: { id: periodId },
      include: { unit: true },
    });

    if (!period) {
      throw new Error('Periode penggajian tidak ditemukan');
    }

    const payrolls = await prisma.payroll.findMany({
      where: { periodId },
      include: {
        items: true,
      },
    });

    // Aggregate by component
    const byComponent: Record<string, { name: string; type: string; total: number; count: number }> = {};
    
    for (const payroll of payrolls) {
      for (const item of payroll.items) {
        const key = item.componentCode;
        if (!byComponent[key]) {
          byComponent[key] = {
            name: item.componentName,
            type: item.type,
            total: 0,
            count: 0,
          };
        }
        byComponent[key].total += Number(item.amount);
        byComponent[key].count++;
      }
    }

    const totals = await prisma.payroll.aggregate({
      where: { periodId },
      _sum: {
        baseSalary: true,
        totalEarnings: true,
        totalDeductions: true,
        netSalary: true,
        taxAmount: true,
      },
      _count: true,
    });

    return {
      period: {
        id: period.id,
        name: period.name,
        month: period.month,
        year: period.year,
        status: period.status,
        unit: period.unit.name,
      },
      summary: {
        employeeCount: totals._count,
        totalBaseSalary: Number(totals._sum.baseSalary) || 0,
        totalEarnings: Number(totals._sum.totalEarnings) || 0,
        totalDeductions: Number(totals._sum.totalDeductions) || 0,
        totalNetSalary: Number(totals._sum.netSalary) || 0,
        totalTax: Number(totals._sum.taxAmount) || 0,
      },
      byComponent: Object.entries(byComponent).map(([code, data]) => ({
        code,
        ...data,
      })),
    };
  },
};

// Helper: Calculate work days (excluding weekends)
function calculateWorkDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) { // Not Sunday or Saturday
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}
