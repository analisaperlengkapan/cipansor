import { Request, Response, NextFunction } from 'express';
import { financeEnhancementService } from './finance-enhancement.service';
import {
  CreateAccountCodeInput,
  UpdateAccountCodeInput,
  CreateJournalEntryInput,
  CreateScholarshipInput,
  AssignScholarshipInput,
  CreatePaymentComponentInput,
  CreateBudgetInput,
  UpdateBudgetInput,
  CreateFinancialPeriodInput,
} from '@cipansor/shared';
import { createBudget, updateBudget, getBudgets, deleteBudget, recalculateBudgetUsage } from './budget.service';
import { createFinancialPeriod, closePeriod, getFinancialPeriods } from './period.service';
import {
  getBalanceSheet,
  getIncomeStatement,
  getTrialBalance,
  getGeneralLedger,
  getCashFlowStatement,
  getBudgetRealizationReport,
} from './reporting.service';

// Helper for parsing pagination params
const parsePagination = (req: Request) => ({
  page: Number(req.query.page) || 1,
  limit: Number(req.query.limit) || 20,
});

// Import missing type locally or assume it's same as CreateJournalEntryInput
type CreateManualJournalInput = CreateJournalEntryInput;

export class FinanceEnhancementController {
  // ==================== ACCOUNT CODES ====================

  async getAccountCodes(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, isActive, search } = req.query;
      const { page, limit } = parsePagination(req);

      const result = await financeEnhancementService.getAccountCodes({
        type: type as string,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        search: search as string,
        page,
        limit,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getBudgetRealizationReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, academicYearId } = req.query;

      if (!unitId || !academicYearId) {
        return res
          .status(400)
          .json({ success: false, message: 'Unit ID and Academic Year ID are required' });
      }

      const result = await getBudgetRealizationReport(unitId as string, academicYearId as string);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async createAccountCode(req: Request, res: Response, next: NextFunction) {
    try {
      const input: CreateAccountCodeInput = req.body;
      const result = await financeEnhancementService.createAccountCode(input);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async updateAccountCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input: UpdateAccountCodeInput = req.body;
      const result = await financeEnhancementService.updateAccountCode(id, input);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // ==================== JOURNAL ENTRIES ====================

  async getJournalEntries(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, accountId, startDate, endDate, search } = req.query;
      const { page, limit } = parsePagination(req);

      const result = await financeEnhancementService.getJournalEntries({
        unitId: unitId as string,
        accountId: accountId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        search: search as string,
        page,
        limit,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async createJournalEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const input: CreateJournalEntryInput = req.body;
      const userId = (req as any).user.id;

      const result = await financeEnhancementService.createJournalEntry({
        ...input,
        createdById: userId,
      });

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async createManualJournal(req: Request, res: Response, next: NextFunction) {
    try {
      const input: CreateManualJournalInput = req.body;
      const userId = (req as any).user.id;

      // Use createJournalEntry as createManualJournal doesn't exist on service
      await financeEnhancementService.createJournalEntry({
        ...input,
        createdById: userId,
      });

      res.status(201).json({ success: true, message: 'Manual journal created successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getJournalEntryById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await financeEnhancementService.getJournalEntryById(id);

      if (!result) {
        return res.status(404).json({ success: false, message: 'Journal entry not found' });
      }

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // ==================== SCHOLARSHIPS ====================

  async getScholarships(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, type, source, isActive } = req.query;
      const { page, limit } = parsePagination(req);

      const result = await financeEnhancementService.getScholarships({
        unitId: unitId as string,
        type: type as string,
        source: source as string,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        page,
        limit,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async createScholarship(req: Request, res: Response, next: NextFunction) {
    try {
      const input: CreateScholarshipInput = req.body;
      const result = await financeEnhancementService.createScholarship(input);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getScholarshipById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await financeEnhancementService.getScholarshipById(id);

      if (!result) {
        return res.status(404).json({ success: false, message: 'Scholarship not found' });
      }

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getScholarshipRecipients(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.query;
      const { page, limit } = parsePagination(req);

      const result = await financeEnhancementService.getScholarshipRecipients(id, {
        status: status as string,
        page,
        limit,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async assignScholarship(req: Request, res: Response, next: NextFunction) {
    try {
      const input: AssignScholarshipInput = req.body;
      const result = await financeEnhancementService.assignScholarship(input);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // ==================== PAYMENT COMPONENTS ====================

  async getPaymentComponents(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, category, isActive } = req.query;
      const { page, limit } = parsePagination(req);

      const result = await financeEnhancementService.getPaymentComponents({
        unitId: unitId as string,
        category: category as string,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        page,
        limit,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async createPaymentComponent(req: Request, res: Response, next: NextFunction) {
    try {
      const input: CreatePaymentComponentInput = req.body;
      const result = await financeEnhancementService.createPaymentComponent(input);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // ==================== REPORTS ====================

  async getTrialBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, startDate, endDate } = req.query;

      if (!unitId || !startDate || !endDate) {
        return res
          .status(400)
          .json({ success: false, message: 'Unit ID, Start date, and End date are required' });
      }

      // Use Reporting Service Logic
      const result = await getTrialBalance(
        unitId as string,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getGeneralLedger(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, accountId, startDate, endDate } = req.query;

      if (!unitId || !startDate || !endDate || !accountId) {
        return res
          .status(400)
          .json({ success: false, message: 'Unit ID, Start date, End date, and Account ID are required' });
      }

      const result = await getGeneralLedger(
        unitId as string,
        accountId as string,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getCashFlowStatement(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, startDate, endDate } = req.query;

      if (!unitId || !startDate || !endDate) {
        return res
          .status(400)
          .json({ success: false, message: 'Unit ID, Start date, and End date are required' });
      }

      const result = await getCashFlowStatement(
        unitId as string,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getIncomeExpenseReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, startDate, endDate } = req.query;

      if (!unitId || !startDate || !endDate) {
        return res
          .status(400)
          .json({ success: false, message: 'Unit ID, Start date, and End date are required' });
      }

      const result = await getIncomeStatement(
        unitId as string,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getBalanceSheet(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, date } = req.query;

      if (!unitId || !date) {
        return res.status(400).json({ success: false, message: 'Unit ID and Date are required' });
      }

      const result = await getBalanceSheet(unitId as string, new Date(date as string));

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // ==================== BUDGETS ====================

  async getBudgets(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, academicYearId } = req.query;
      const { page, limit } = parsePagination(req);

      const result = await getBudgets({
        unitId: unitId as string,
        academicYearId: academicYearId as string,
        page,
        limit,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async createBudget(req: Request, res: Response, next: NextFunction) {
    try {
      const input: CreateBudgetInput = req.body;
      const userId = (req as any).user.id;

      const result = await createBudget({
        ...input,
        createdById: userId,
      });

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async updateBudget(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input: UpdateBudgetInput = req.body;
      const result = await updateBudget(id, input);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async deleteBudget(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await deleteBudget(id);
      res.json({ success: true, message: 'Budget deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async recalculateBudgetUsage(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId, academicYearId } = req.body;
      if (!unitId || !academicYearId) {
        return res.status(400).json({ success: false, message: 'Unit ID and Academic Year ID are required' });
      }

      const result = await recalculateBudgetUsage(unitId, academicYearId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // ==================== FINANCIAL PERIODS ====================

  async getFinancialPeriods(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId } = req.query;
      const { page, limit } = parsePagination(req);

      const result = await getFinancialPeriods({
        unitId: unitId as string,
        page,
        limit,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async createFinancialPeriod(req: Request, res: Response, next: NextFunction) {
    try {
      const input: CreateFinancialPeriodInput = req.body;
      const result = await createFinancialPeriod(input);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async closeFinancialPeriod(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const result = await closePeriod(id, userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const financeEnhancementController = new FinanceEnhancementController();
