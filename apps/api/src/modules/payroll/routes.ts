import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { UserRole } from '@prisma/client';
import { validate } from '../../middleware/validate';
import {
  salaryComponentService,
  employeeSalaryService,
  payrollPeriodService,
  payrollService,
} from './service';
import {
  createSalaryComponentSchema,
  updateSalaryComponentSchema,
  createEmployeeSalarySchema,
  updateEmployeeSalarySchema,
  createPayrollPeriodSchema,
  updatePayrollPeriodSchema,
  generatePayrollSchema,
  approvePayrollPeriodSchema,
  payPayrollPeriodSchema,
  listSalaryComponentsQuerySchema,
  listEmployeeSalariesQuerySchema,
  listPayrollPeriodsQuerySchema,
  listPayrollsQuerySchema,
  payrollItemAdjustmentSchema,
} from './payroll.schema';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// ============================================
// SALARY COMPONENTS
// ============================================

/**
 * @route GET /api/payroll/components
 * @desc List salary components
 */
router.get('/components', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = listSalaryComponentsQuerySchema.parse(req.query);
    const components = await salaryComponentService.list({
      type: query.type as any,
      isActive: query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined,
      search: query.search,
    });

    res.json({
      success: true,
      data: components,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/payroll/components/:id
 * @desc Get salary component by ID
 */
router.get('/components/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const component = await salaryComponentService.getById(req.params.id);

    if (!component) {
      return res.status(404).json({
        success: false,
        message: 'Komponen gaji tidak ditemukan',
      });
    }

    res.json({
      success: true,
      data: component,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/payroll/components
 * @desc Create salary component
 */
router.post(
  '/components',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(createSalaryComponentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const component = await salaryComponentService.create(req.body);

      res.status(201).json({
        success: true,
        message: 'Komponen gaji berhasil dibuat',
        data: component,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/payroll/components/:id
 * @desc Update salary component
 */
router.put(
  '/components/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(updateSalaryComponentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const component = await salaryComponentService.update(req.params.id, req.body);

      res.json({
        success: true,
        message: 'Komponen gaji berhasil diperbarui',
        data: component,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/payroll/components/:id
 * @desc Delete salary component
 */
router.delete(
  '/components/:id',
  authorize(UserRole.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await salaryComponentService.delete(req.params.id);

      res.json({
        success: true,
        message: 'Komponen gaji berhasil dihapus',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/payroll/components/seed
 * @desc Seed default salary components
 */
router.post(
  '/components/seed',
  authorize(UserRole.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await salaryComponentService.seedDefaults();

      res.json({
        success: true,
        message: 'Komponen gaji default berhasil dibuat',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// EMPLOYEE SALARIES
// ============================================

/**
 * @route GET /api/payroll/salaries
 * @desc List employee salaries
 */
router.get('/salaries', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = listEmployeeSalariesQuerySchema.parse(req.query);
    const result = await employeeSalaryService.list({
      unitId: query.unitId,
      search: query.search,
      page: parseInt(query.page),
      limit: parseInt(query.limit),
    });

    res.json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/payroll/salaries/:staffId
 * @desc Get employee salary by staff ID
 */
router.get('/salaries/:staffId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const salary = await employeeSalaryService.getByStaffId(req.params.staffId);

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: 'Pengaturan gaji karyawan tidak ditemukan',
      });
    }

    res.json({
      success: true,
      data: salary,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/payroll/salaries
 * @desc Create employee salary configuration
 */
router.post(
  '/salaries',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(createEmployeeSalarySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const salary = await employeeSalaryService.create(req.body);

      res.status(201).json({
        success: true,
        message: 'Pengaturan gaji karyawan berhasil dibuat',
        data: salary,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/payroll/salaries/:staffId
 * @desc Update employee salary configuration
 */
router.put(
  '/salaries/:staffId',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(updateEmployeeSalarySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const salary = await employeeSalaryService.update(req.params.staffId, req.body);

      res.json({
        success: true,
        message: 'Pengaturan gaji karyawan berhasil diperbarui',
        data: salary,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/payroll/salaries/:staffId
 * @desc Delete employee salary configuration
 */
router.delete(
  '/salaries/:staffId',
  authorize(UserRole.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await employeeSalaryService.delete(req.params.staffId);

      res.json({
        success: true,
        message: 'Pengaturan gaji karyawan berhasil dihapus',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// PAYROLL PERIODS
// ============================================

/**
 * @route GET /api/payroll/periods
 * @desc List payroll periods
 */
router.get('/periods', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = listPayrollPeriodsQuerySchema.parse(req.query);
    const result = await payrollPeriodService.list({
      unitId: query.unitId,
      year: query.year ? parseInt(query.year) : undefined,
      status: query.status as any,
      page: parseInt(query.page),
      limit: parseInt(query.limit),
    });

    res.json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/payroll/periods/:id
 * @desc Get payroll period by ID
 */
router.get('/periods/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = await payrollPeriodService.getById(req.params.id);

    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Periode penggajian tidak ditemukan',
      });
    }

    res.json({
      success: true,
      data: period,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/payroll/periods
 * @desc Create payroll period
 */
router.post(
  '/periods',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(createPayrollPeriodSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const period = await payrollPeriodService.create(req.body, userId);

      res.status(201).json({
        success: true,
        message: 'Periode penggajian berhasil dibuat',
        data: period,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/payroll/periods/:id
 * @desc Update payroll period
 */
router.put(
  '/periods/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(updatePayrollPeriodSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const period = await payrollPeriodService.update(req.params.id, req.body);

      res.json({
        success: true,
        message: 'Periode penggajian berhasil diperbarui',
        data: period,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/payroll/periods/:id/approve
 * @desc Approve payroll period
 */
router.post(
  '/periods/:id/approve',
  authorize(UserRole.SUPER_ADMIN),
  validate(approvePayrollPeriodSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const period = await payrollPeriodService.approve(req.params.id, userId, req.body.notes);

      res.json({
        success: true,
        message: 'Periode penggajian berhasil disetujui',
        data: period,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/payroll/periods/:id/pay
 * @desc Mark payroll period as paid
 */
router.post(
  '/periods/:id/pay',
  authorize(UserRole.SUPER_ADMIN),
  validate(payPayrollPeriodSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const period = await payrollPeriodService.markAsPaid(
        req.params.id,
        new Date(req.body.payDate),
        req.body.notes,
        userId
      );

      res.json({
        success: true,
        message: 'Periode penggajian berhasil ditandai sebagai dibayar',
        data: period,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/payroll/periods/:id/cancel
 * @desc Cancel payroll period
 */
router.post(
  '/periods/:id/cancel',
  authorize(UserRole.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const period = await payrollPeriodService.cancel(req.params.id, req.body.notes);

      res.json({
        success: true,
        message: 'Periode penggajian berhasil dibatalkan',
        data: period,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/payroll/periods/:id
 * @desc Delete payroll period
 */
router.delete(
  '/periods/:id',
  authorize(UserRole.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await payrollPeriodService.delete(req.params.id);

      res.json({
        success: true,
        message: 'Periode penggajian berhasil dihapus',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// PAYROLLS (SLIP GAJI)
// ============================================

/**
 * @route GET /api/payroll/slips
 * @desc List payroll slips
 */
router.get('/slips', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = listPayrollsQuerySchema.parse(req.query);
    const result = await payrollService.list({
      periodId: query.periodId,
      staffId: query.staffId,
      search: query.search,
      page: parseInt(query.page),
      limit: parseInt(query.limit),
    });

    res.json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/payroll/slips/:id
 * @desc Get payroll slip by ID
 */
router.get('/slips/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payroll = await payrollService.getById(req.params.id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Slip gaji tidak ditemukan',
      });
    }

    res.json({
      success: true,
      data: payroll,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/payroll/generate
 * @desc Generate payrolls for a period
 */
router.post(
  '/generate',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(generatePayrollSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await payrollService.generate(req.body);

      res.json({
        success: true,
        message: `${result.created} slip gaji dibuat, ${result.updated} diperbarui`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/payroll/slips/:id/adjust
 * @desc Adjust payroll item
 */
router.put(
  '/slips/:id/adjust',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  validate(payrollItemAdjustmentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payroll = await payrollService.adjustItem(req.params.id, req.body);

      res.json({
        success: true,
        message: 'Slip gaji berhasil disesuaikan',
        data: payroll,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/payroll/periods/:id/summary
 * @desc Get payroll period summary
 */
router.get('/periods/:id/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await payrollService.getSummary(req.params.id);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
