import { Request, Response, NextFunction } from 'express';
import * as financeService from './service';
import {
  createPaymentTypeSchema,
  updatePaymentTypeSchema,
  queryPaymentTypeSchema,
  createInvoiceSchema,
  updateInvoiceSchema,
  queryInvoiceSchema,
  createPaymentSchema,
  queryPaymentSchema,
} from './schema';
import { Errors } from '../../middleware/error';

// =====================================
// PAYMENT TYPE CONTROLLERS
// =====================================

export async function createPaymentType(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createPaymentTypeSchema.parse(req.body);
    const paymentType = await financeService.createPaymentType(data);
    res.status(201).json({
      success: true,
      message: 'Payment type created successfully',
      data: paymentType,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPaymentTypes(req: Request, res: Response, next: NextFunction) {
  try {
    const query = queryPaymentTypeSchema.parse(res.locals.validatedQuery || (req.query as any));
    const result = await financeService.getPaymentTypes(query);
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPaymentTypeById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = (req.params as any);
    const paymentType = await financeService.getPaymentTypeById(id);
    if (!paymentType) {
      throw Errors.notFound('Payment type');
    }
    res.json({
      success: true,
      data: paymentType,
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePaymentType(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = (req.params as any);
    const data = updatePaymentTypeSchema.parse(req.body);
    const paymentType = await financeService.updatePaymentType(id, data);
    res.json({
      success: true,
      message: 'Payment type updated successfully',
      data: paymentType,
    });
  } catch (error) {
    next(error);
  }
}

export async function deletePaymentType(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = (req.params as any);
    await financeService.deletePaymentType(id);
    res.json({
      success: true,
      message: 'Payment type deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
}

// =====================================
// INVOICE CONTROLLERS
// =====================================

export async function createInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createInvoiceSchema.parse(req.body);
    const invoice = await financeService.createInvoice(data);
    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
}

export async function getInvoices(req: Request, res: Response, next: NextFunction) {
  try {
    const query = queryInvoiceSchema.parse(res.locals.validatedQuery || (req.query as any));
    const result = await financeService.getInvoices(query);
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getInvoiceById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = (req.params as any);
    const invoice = await financeService.getInvoiceById(id);
    if (!invoice) {
      throw Errors.notFound('Invoice');
    }
    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = (req.params as any);
    const data = updateInvoiceSchema.parse(req.body);
    const invoice = await financeService.updateInvoice(id, data);
    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = (req.params as any);
    await financeService.deleteInvoice(id);
    res.json({
      success: true,
      message: 'Invoice cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
}

// =====================================
// PAYMENT CONTROLLERS
// =====================================

export async function createPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createPaymentSchema.parse(req.body);
    const userId = req.user?.sub || 'SYSTEM';
    const payment = await financeService.createPayment(data, userId);
    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const query = queryPaymentSchema.parse(res.locals.validatedQuery || (req.query as any));
    const result = await financeService.getPayments(query);
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPaymentById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = (req.params as any);
    const payment = await financeService.getPaymentById(id);
    if (!payment) {
      throw Errors.notFound('Payment');
    }
    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
}

// =====================================
// ANALYTICS CONTROLLERS
// =====================================

export async function getStudentFinanceSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = (req.params as any);
    const summary = await financeService.getStudentFinanceSummary(studentId);
    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUnitFinanceStats(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId } = (req.params as any);
    const month = (req.query as any).month as string | undefined;
    const stats = await financeService.getUnitFinanceStats(unitId, month);
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

export async function getStudentOutstandingBalances(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId } = (req.params as any);
    const data = await financeService.getStudentOutstandingBalances(unitId);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

// =====================================
// SPP MATRIX CONTROLLERS
// =====================================

export async function getSppMatrix(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId, classId, year, paymentTypeId } = (req.query as any);

    const yearNum = year ? parseInt(year as string) : new Date().getFullYear();

    const result = await financeService.getSppMatrix({
      unitId: unitId as string | undefined,
      classId: classId as string | undefined,
      year: yearNum,
      paymentTypeId: paymentTypeId as string | undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function generateBulkSppInvoices(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId, classId, paymentTypeId, year, month, dueDay } = req.body;

    const result = await financeService.generateBulkSppInvoices({
      unitId,
      classId,
      paymentTypeId,
      year: parseInt(year),
      month: parseInt(month),
      dueDay: dueDay ? parseInt(dueDay) : undefined,
    });

    res.status(201).json({
      success: true,
      message: `Berhasil membuat ${result.created} tagihan, ${result.skipped} sudah ada`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
