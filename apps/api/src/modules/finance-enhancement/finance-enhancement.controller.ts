import { Request, Response, NextFunction } from 'express';
import * as configService from '../finance/accounting-config.service';
import { FinanceEnhancementService, financeEnhancementService } from './finance-enhancement.service';
import { CreateJournalEntryInput } from '@cipansor/shared';

// =====================================
// ACCOUNTS
// =====================================

export async function getAccountCodes(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const { type, isActive, search } = req.query as any;

    const result = await financeEnhancementService.getAccountCodes({
      type,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search,
      page,
      limit,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function createAccountCode(req: Request, res: Response, next: NextFunction) {
  try {
    const account = await financeEnhancementService.createAccountCode(req.body);
    res.status(201).json(account);
  } catch (error) {
    next(error);
  }
}

export async function updateAccountCode(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const account = await financeEnhancementService.updateAccountCode(id, req.body);
    res.json(account);
  } catch (error) {
    next(error);
  }
}

// =====================================
// JOURNAL ENTRIES
// =====================================

export async function getJournalEntries(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const { unitId, accountId, startDate, endDate, search } = req.query as any;

    const result = await financeEnhancementService.getJournalEntries({
      unitId,
      accountId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      search,
      page,
      limit,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getJournalEntryById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await financeEnhancementService.getJournalEntryById(id);
    if (!result) {
      res.status(404).json({ message: 'Journal entry not found' });
      return;
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function createJournalEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const input: CreateJournalEntryInput = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const entry = await financeEnhancementService.createJournalEntry({
      ...input,
      createdById: userId,
    });

    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
}

// Alias for compatibility
export const createManualJournal = createJournalEntry;

// =====================================
// SCHOLARSHIPS
// =====================================

export async function getScholarships(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const { unitId, type, source, isActive } = req.query as any;

    const result = await financeEnhancementService.getScholarships({
      unitId,
      type,
      source,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      page,
      limit,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getScholarshipById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await financeEnhancementService.getScholarshipById(id);
    if (!result) {
      res.status(404).json({ message: 'Scholarship not found' });
      return;
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function createScholarship(req: Request, res: Response, next: NextFunction) {
  try {
    const scholarship = await financeEnhancementService.createScholarship(req.body);
    res.status(201).json(scholarship);
  } catch (error) {
    next(error);
  }
}

export async function getScholarshipRecipients(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const { status } = req.query as any;

    const result = await financeEnhancementService.getScholarshipRecipients(id, {
      status,
      page,
      limit,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function assignScholarship(req: Request, res: Response, next: NextFunction) {
  try {
    const recipient = await financeEnhancementService.assignScholarship(req.body);
    res.status(201).json(recipient);
  } catch (error) {
    next(error);
  }
}

// =====================================
// PAYMENT COMPONENTS
// =====================================

export async function getPaymentComponents(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const { unitId, category, isActive } = req.query as any;

    const result = await financeEnhancementService.getPaymentComponents({
      unitId,
      category,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      page,
      limit,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function createPaymentComponent(req: Request, res: Response, next: NextFunction) {
  try {
    const component = await financeEnhancementService.createPaymentComponent(req.body);
    res.status(201).json(component);
  } catch (error) {
    next(error);
  }
}

// =====================================
// REPORTS
// =====================================

export async function getTrialBalanceReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId, startDate, endDate } = req.query as any;

    const result = await financeEnhancementService.getTrialBalance({
      unitId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getIncomeExpenseReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId, startDate, endDate, groupBy } = req.query as any;

    const result = await financeEnhancementService.getIncomeExpenseReport({
      unitId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      groupBy,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

// =====================================
// BUDGETS (Placeholders to fix route errors)
// =====================================

export async function getBudgets(req: Request, res: Response, next: NextFunction) {
  res.status(501).json({ message: 'Not implemented' });
}

export async function createBudget(req: Request, res: Response, next: NextFunction) {
  res.status(501).json({ message: 'Not implemented' });
}

export async function updateBudget(req: Request, res: Response, next: NextFunction) {
  res.status(501).json({ message: 'Not implemented' });
}

export async function deleteBudget(req: Request, res: Response, next: NextFunction) {
  res.status(501).json({ message: 'Not implemented' });
}

export async function recalculateBudgetUsage(req: Request, res: Response, next: NextFunction) {
  res.status(501).json({ message: 'Not implemented' });
}

// =====================================
// FINANCIAL PERIODS (Placeholders)
// =====================================

export async function getFinancialPeriods(req: Request, res: Response, next: NextFunction) {
  res.status(501).json({ message: 'Not implemented' });
}

export async function createFinancialPeriod(req: Request, res: Response, next: NextFunction) {
  res.status(501).json({ message: 'Not implemented' });
}

export async function closeFinancialPeriod(req: Request, res: Response, next: NextFunction) {
  res.status(501).json({ message: 'Not implemented' });
}

export async function getBalanceSheet(req: Request, res: Response, next: NextFunction) {
  res.status(501).json({ message: 'Not implemented' });
}

// =====================================
// GENERAL LEDGER & CASH FLOW (Placeholders)
// =====================================

export async function getGeneralLedger(req: Request, res: Response, next: NextFunction) {
  res.status(501).json({ message: 'Not implemented' });
}

export async function getCashFlowStatement(req: Request, res: Response, next: NextFunction) {
  res.status(501).json({ message: 'Not implemented' });
}

export async function getBudgetRealizationReport(req: Request, res: Response, next: NextFunction) {
  res.status(501).json({ message: 'Not implemented' });
}

// Export specific functions for named imports
export const getTrialBalance = getTrialBalanceReport; // Alias match

// Export as default object for routes that import it as a namespace or default
export const financeEnhancementController = {
  getAccountCodes,
  createAccountCode,
  updateAccountCode,
  getJournalEntries,
  getJournalEntryById,
  createJournalEntry,
  createManualJournal,
  getScholarships,
  getScholarshipById,
  createScholarship,
  getScholarshipRecipients,
  assignScholarship,
  getPaymentComponents,
  createPaymentComponent,
  getTrialBalance: getTrialBalanceReport, // For route expecting this name
  getTrialBalanceReport, // Also export under original name just in case
  getIncomeExpenseReport,
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  recalculateBudgetUsage,
  getFinancialPeriods,
  createFinancialPeriod,
  closeFinancialPeriod,
  getBalanceSheet,
  getGeneralLedger,
  getCashFlowStatement,
  getBudgetRealizationReport,
};
