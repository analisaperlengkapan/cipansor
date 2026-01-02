import { prisma } from "../../lib/prisma";
import { PaymentStatus, Prisma, NotificationType } from "@prisma/client";
import * as notificationService from "../notifications/service";
import {
  CreatePaymentTypeDto,
  UpdatePaymentTypeDto,
  QueryPaymentTypeDto,
  CreateInvoiceDto,
  UpdateInvoiceDto,
  QueryInvoiceDto,
  CreatePaymentDto,
  QueryPaymentDto,
} from "./schema";

// =====================================
// PAYMENT TYPE SERVICE
// =====================================

export async function createPaymentType(data: CreatePaymentTypeDto) {
  const { unitId, ...rest } = data;
  return prisma.paymentType.create({
    data: {
      name: rest.name,
      code: rest.code,
      description: rest.description,
      isRecurring: rest.isRecurring,
      isActive: rest.isActive,
      amount: new Prisma.Decimal(data.amount),
      unit: { connect: { id: unitId } },
    },
    include: { unit: { select: { id: true, name: true } } },
  });
}

export async function getPaymentTypes(query: QueryPaymentTypeDto) {
  const { unitId, isActive, isRecurring, search, page, limit } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(unitId && { unitId }),
    ...(isActive !== undefined && { isActive }),
    ...(isRecurring !== undefined && { isRecurring }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { code: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.paymentType.findMany({
      where,
      include: { unit: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.paymentType.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getPaymentTypeById(id: string) {
  return prisma.paymentType.findUnique({
    where: { id },
    include: { unit: { select: { id: true, name: true } } },
  });
}

export async function updatePaymentType(id: string, data: UpdatePaymentTypeDto) {
  return prisma.paymentType.update({
    where: { id },
    data: {
      ...data,
      ...(data.amount && { amount: new Prisma.Decimal(data.amount) }),
    },
    include: { unit: { select: { id: true, name: true } } },
  });
}

export async function deletePaymentType(id: string) {
  return prisma.paymentType.update({
    where: { id },
    data: { isActive: false },
  });
}

// =====================================
// INVOICE SERVICE
// =====================================

async function generateInvoiceNumber(unitId?: string): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: { startsWith: `INV-${year}${month}` },
    },
    orderBy: { invoiceNumber: "desc" },
  });

  let sequence = 1;
  if (lastInvoice) {
    const lastSeq = parseInt(lastInvoice.invoiceNumber.split("-")[2]);
    sequence = lastSeq + 1;
  }

  return `INV-${year}${month}-${String(sequence).padStart(5, "0")}`;
}

export async function createInvoice(data: CreateInvoiceDto) {
  let invoice;
  let retries = 3;

  while (retries > 0) {
    try {
      const invoiceNumber = await generateInvoiceNumber();

      const { studentId, paymentTypeId, ...invoiceData } = data;
      invoice = await prisma.invoice.create({
        data: {
          ...invoiceData,
          invoiceNumber,
          amount: new Prisma.Decimal(data.amount),
          dueDate: new Date(data.dueDate),
          student: { connect: { id: studentId } },
          paymentType: { connect: { id: paymentTypeId } },
        },
        include: {
          student: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              unit: { select: { id: true, name: true } },
            },
          },
          paymentType: { select: { id: true, name: true, code: true } },
        },
      });
      break;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        retries--;
        if (retries === 0) throw error;
        continue;
      }
      throw error;
    }
  }

  if (invoice) {
    try {
      const formatter = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      });

      await notificationService.createNotification({
        userId: invoice.student.user.id,
        title: "Tagihan Baru",
        message: `Tagihan baru ${invoice.paymentType.name} sebesar ${formatter.format(
          invoice.amount.toNumber()
        )} telah dibuat. Jatuh tempo: ${new Date(invoice.dueDate).toLocaleDateString("id-ID")}`,
        type: NotificationType.PAYMENT,
        link: `/finance/bills/${invoice.id}`,
        priority: 'HIGH',
        channels: ['IN_APP', 'EMAIL'],
        recipientType: 'INDIVIDUAL',
      });
    } catch (error) {
      console.error("Failed to send notification:", error);
      // Don't fail the request if notification fails
    }
  }

  return invoice;
}

export async function getInvoices(query: QueryInvoiceDto) {
  const { studentId, paymentTypeId, status, startDate, endDate, overdue, page, limit } = query;
  const skip = (page - 1) * limit;

  const where: any = {
    ...(studentId && { studentId }),
    ...(paymentTypeId && { paymentTypeId }),
    ...(status && { status }),
    ...(startDate || endDate
      ? {
          dueDate: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) }),
          },
        }
      : {}),
  };

  if (overdue === true) {
    where.dueDate = { lt: new Date() };
    where.status = { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL] };
  }

  const [data, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        paymentType: { select: { id: true, name: true, code: true } },
        _count: { select: { payments: true } },
      },
      orderBy: { dueDate: "asc" },
      skip,
      take: limit,
    }),
    prisma.invoice.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getInvoiceById(id: string) {
  return prisma.invoice.findUnique({
    where: { id },
    include: {
      student: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          unit: { select: { id: true, name: true } },
        },
      },
      paymentType: { select: { id: true, name: true, code: true, amount: true } },
      payments: {
        orderBy: { paidAt: "desc" },
      },
    },
  });
}

export async function updateInvoice(id: string, data: UpdateInvoiceDto) {
  return prisma.invoice.update({
    where: { id },
    data: {
      ...data,
      ...(data.amount && { amount: new Prisma.Decimal(data.amount) }),
      ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
    },
    include: {
      student: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
      paymentType: { select: { id: true, name: true, code: true } },
    },
  });
}

export async function deleteInvoice(id: string) {
  return prisma.invoice.update({
    where: { id },
    data: { status: PaymentStatus.CANCELLED },
  });
}

// =====================================
// PAYMENT SERVICE
// =====================================

export async function createPayment(data: CreatePaymentDto) {
  // Create payment and update invoice in a transaction
  const payment = await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id: data.invoiceId },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const { invoiceId, ...paymentData } = data;
    const payment = await tx.payment.create({
      data: {
        method: paymentData.method,
        referenceNo: paymentData.referenceNo,
        notes: paymentData.notes,
        amount: new Prisma.Decimal(data.amount),
        invoice: { connect: { id: invoiceId } },
      },
      include: {
        invoice: {
          include: {
            student: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
            paymentType: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Update invoice paid amount and status
    const newPaidAmount = invoice.paidAmount.add(new Prisma.Decimal(data.amount));
    let newStatus: PaymentStatus;

    if (newPaidAmount.gte(invoice.amount)) {
      newStatus = PaymentStatus.PAID;
    } else if (newPaidAmount.gt(0)) {
      newStatus = PaymentStatus.PARTIAL;
    } else {
      newStatus = PaymentStatus.PENDING;
    }

    await tx.invoice.update({
      where: { id: data.invoiceId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    });

    return payment;
  });

  // Send notification after transaction commits
  try {
    const formatter = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    });

    await notificationService.createNotification({
      userId: payment.invoice.student.user.id,
      title: "Pembayaran Berhasil",
      message: `Pembayaran untuk tagihan ${payment.invoice.paymentType.name} sebesar ${formatter.format(
        payment.amount.toNumber()
      )} telah diterima.`,
      type: NotificationType.PAYMENT,
      link: `/finance/bills/${payment.invoice.id}`,
      priority: 'HIGH',
      channels: ['IN_APP', 'EMAIL'],
      recipientType: 'INDIVIDUAL',
    });
  } catch (error) {
    console.error("Failed to send payment notification:", error);
  }

  return payment;
}

export async function getPayments(query: QueryPaymentDto) {
  const { invoiceId, method, startDate, endDate, page, limit } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(invoiceId && { invoiceId }),
    ...(method && { method }),
    ...(startDate || endDate
      ? {
          paidAt: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) }),
          },
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        invoice: {
          include: {
            student: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
            paymentType: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: { paidAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getPaymentById(id: string) {
  return prisma.payment.findUnique({
    where: { id },
    include: {
      invoice: {
        include: {
          student: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          paymentType: { select: { id: true, name: true, code: true } },
        },
      },
    },
  });
}

// =====================================
// ANALYTICS
// =====================================

export async function getStudentFinanceSummary(studentId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { studentId },
    include: {
      paymentType: { select: { id: true, name: true } },
    },
  });

  const total = invoices.reduce((sum, inv) => sum.add(inv.amount), new Prisma.Decimal(0));
  const paid = invoices.reduce((sum, inv) => sum.add(inv.paidAmount), new Prisma.Decimal(0));
  const pending = total.sub(paid);
  
  const overdue = invoices.filter(
    (inv) =>
      (inv.status === PaymentStatus.PENDING || inv.status === PaymentStatus.PARTIAL) &&
      new Date(inv.dueDate) < new Date()
  );

  return {
    total: total.toNumber(),
    paid: paid.toNumber(),
    pending: pending.toNumber(),
    overdueCount: overdue.length,
    overdueAmount: overdue.reduce((sum, inv) => sum + inv.amount.sub(inv.paidAmount).toNumber(), 0),
  };
}

export async function getUnitFinanceStats(unitId: string, month?: string) {
  const dateFilter = month
    ? {
        dueDate: {
          gte: new Date(`${month}-01`),
          lt: new Date(new Date(`${month}-01`).setMonth(new Date(`${month}-01`).getMonth() + 1)),
        },
      }
    : {};

  const invoices = await prisma.invoice.findMany({
    where: {
      student: { unitId },
      ...dateFilter,
    },
  });

  const total = invoices.reduce((sum, inv) => sum.add(inv.amount), new Prisma.Decimal(0));
  const collected = invoices.reduce((sum, inv) => sum.add(inv.paidAmount), new Prisma.Decimal(0));
  const pending = total.sub(collected);

  const byStatus = await prisma.invoice.groupBy({
    by: ["status"],
    where: { student: { unitId }, ...dateFilter },
    _count: true,
    _sum: { amount: true },
  });

  return {
    total: total.toNumber(),
    collected: collected.toNumber(),
    pending: pending.toNumber(),
    collectionRate: total.gt(0) ? collected.div(total).mul(100).toNumber() : 0,
    byStatus: byStatus.map((s) => ({
      status: s.status,
      count: s._count,
      amount: s._sum.amount?.toNumber() || 0,
    })),
  };
}

// =====================================
// SPP MATRIX - Tampilan bulanan per santri
// =====================================

export interface SppMatrixQuery {
  unitId?: string;
  classId?: string;
  year: number;
  paymentTypeId?: string;
}

export interface StudentSppRow {
  studentId: string;
  studentName: string;
  nis: string;
  className: string;
  months: {
    [month: string]: {
      invoiceId?: string;
      status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE' | 'NOT_BILLED';
      amount: number;
      paidAmount: number;
      dueDate?: string;
    };
  };
  totalAmount: number;
  totalPaid: number;
}

export async function getSppMatrix(query: SppMatrixQuery) {
  const { unitId, classId, year, paymentTypeId } = query;

  // Get students with their class enrollment
  const students = await prisma.student.findMany({
    where: {
      ...(unitId && { unitId }),
      ...(classId && {
        enrollments: {
          some: { classId },
        },
      }),
    },
    include: {
      user: { select: { id: true, name: true } },
      enrollments: {
        include: {
          class: { select: { id: true, name: true } },
        },
        orderBy: { enrolledAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { nis: 'asc' },
  });

  // Get SPP payment type (recurring monthly)
  const sppPaymentType = paymentTypeId 
    ? await prisma.paymentType.findUnique({ where: { id: paymentTypeId } })
    : await prisma.paymentType.findFirst({
        where: {
          code: 'SPP',
          isRecurring: true,
          ...(unitId && { unitId }),
        },
      });

  if (!sppPaymentType) {
    return { students: [], sppRate: 0, year, months: [] };
  }

  // Define months for the year
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  // Get all invoices for these students for the year
  const studentIds = students.map(s => s.id);
  const invoices = await prisma.invoice.findMany({
    where: {
      studentId: { in: studentIds },
      paymentTypeId: sppPaymentType.id,
      dueDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      payments: true,
    },
  });

  // Build matrix data
  const now = new Date();
  const matrixData: StudentSppRow[] = students.map(student => {
    const studentInvoices = invoices.filter(inv => inv.studentId === student.id);
    const monthsData: StudentSppRow['months'] = {};

    let totalAmount = 0;
    let totalPaid = 0;

    months.forEach((monthName, index) => {
      const monthDate = new Date(year, index, 10); // Due date is 10th of each month
      const invoice = studentInvoices.find(inv => {
        const invMonth = new Date(inv.dueDate).getMonth();
        return invMonth === index;
      });

      if (invoice) {
        const isPastDue = new Date(invoice.dueDate) < now;
        let status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE' = invoice.status as any;
        
        if ((status === 'PENDING' || status === 'PARTIAL') && isPastDue) {
          status = 'OVERDUE';
        }

        monthsData[monthName] = {
          invoiceId: invoice.id,
          status,
          amount: invoice.amount.toNumber(),
          paidAmount: invoice.paidAmount.toNumber(),
          dueDate: invoice.dueDate.toISOString(),
        };

        totalAmount += invoice.amount.toNumber();
        totalPaid += invoice.paidAmount.toNumber();
      } else {
        monthsData[monthName] = {
          status: 'NOT_BILLED',
          amount: 0,
          paidAmount: 0,
        };
      }
    });

    return {
      studentId: student.id,
      studentName: student.user.name,
      nis: student.nis || '-',
      className: student.enrollments[0]?.class?.name || '-',
      months: monthsData,
      totalAmount,
      totalPaid,
    };
  });

  // Calculate summary stats
  const summary = {
    totalStudents: students.length,
    totalBilled: matrixData.reduce((sum, s) => sum + s.totalAmount, 0),
    totalPaid: matrixData.reduce((sum, s) => sum + s.totalPaid, 0),
    totalOutstanding: 0,
    paidCount: 0,
    partialCount: 0,
    pendingCount: 0,
    overdueCount: 0,
  };

  summary.totalOutstanding = summary.totalBilled - summary.totalPaid;

  // Count statuses
  matrixData.forEach(student => {
    Object.values(student.months).forEach(month => {
      if (month.status === 'PAID') summary.paidCount++;
      else if (month.status === 'PARTIAL') summary.partialCount++;
      else if (month.status === 'PENDING') summary.pendingCount++;
      else if (month.status === 'OVERDUE') summary.overdueCount++;
    });
  });

  return {
    students: matrixData,
    sppRate: sppPaymentType.amount.toNumber(),
    paymentTypeId: sppPaymentType.id,
    year,
    months,
    summary,
  };
}

// Generate bulk invoices for SPP
export async function generateBulkSppInvoices(data: {
  unitId?: string;
  classId?: string;
  paymentTypeId: string;
  year: number;
  month: number; // 0-11
  dueDay?: number;
}) {
  const { unitId, classId, paymentTypeId, year, month, dueDay = 10 } = data;

  const paymentType = await prisma.paymentType.findUnique({
    where: { id: paymentTypeId },
  });

  if (!paymentType) {
    throw new Error("Payment type not found");
  }

  // Get students
  const students = await prisma.student.findMany({
    where: {
      ...(unitId && { unitId }),
      ...(classId && {
        enrollments: {
          some: { classId },
        },
      }),
    },
  });

  const dueDate = new Date(year, month, dueDay);
  const period = `${['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                     'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][month]} ${year}`;

  const createdInvoices = [];

  for (const student of students) {
    // Check if invoice already exists for this student/month
    const existing = await prisma.invoice.findFirst({
      where: {
        studentId: student.id,
        paymentTypeId,
        dueDate: {
          gte: new Date(year, month, 1),
          lt: new Date(year, month + 1, 1),
        },
      },
    });

    if (!existing) {
      const invoiceNumber = await generateInvoiceNumber();
      const invoice = await prisma.invoice.create({
        data: {
          studentId: student.id,
          paymentTypeId,
          invoiceNumber,
          amount: paymentType.amount,
          dueDate,
          period,
          notes: `Tagihan ${paymentType.name} untuk ${period}`,
        },
      });
      createdInvoices.push(invoice);
    }
  }

  return {
    created: createdInvoices.length,
    skipped: students.length - createdInvoices.length,
    total: students.length,
  };
}
