import { Request, Response, NextFunction } from 'express';
import * as service from './accounting.service';
import * as configService from './accounting-config.service';
import { CreateAccountDto, CreateJournalDto, UpdateAccountDto } from './schema';

// =====================================
// ACCOUNTS
// =====================================

export async function seedAccounts(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.seedDefaultAccounts();
    res.status(201).json({ message: 'Accounts seeded successfully', data: result });
  } catch (error) {
    next(error);
  }
}

export async function createAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const data: CreateAccountDto = req.body;
    const account = await service.createAccount({
      code: data.code,
      name: data.name,
      type: data.type,
      normalBalance: data.normalBalance,
      isActive: data.isActive,
      parentId: data.parentId ?? undefined,
      cashFlowCategory: data.cashFlowCategory ?? undefined,
    });
    res.status(201).json(account);
  } catch (error) {
    next(error);
  }
}

export async function updateAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data: UpdateAccountDto = req.body;
    const account = await service.updateAccount(id, data);
    res.json(account);
  } catch (error) {
    next(error);
  }
}

export async function getAccounts(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as { search?: string; type?: string; isActive?: string };
    const accounts = await service.getAccounts({
      ...query,
      isActive: query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined,
    });
    res.json({ data: accounts });
  } catch (error) {
    next(error);
  }
}

export async function getAccountById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const account = await service.getAccountById(id);
    if (!account) {
      res.status(404).json({ message: 'Account not found' });
      return;
    }
    res.json(account);
  } catch (error) {
    next(error);
  }
}

export async function deleteAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await service.deleteAccount(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

// =====================================
// SETTINGS
// =====================================

export async function getSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId } = req.query;
    if (!unitId) {
      res.status(400).json({ message: 'Unit ID is required' });
      return;
    }

    const keys = Object.values(configService.ACCOUNT_MAPPING_KEYS);
    const settings: Record<string, string | null> = {};

    for (const key of keys) {
      settings[key] = await configService.getAccountMapping(unitId as string, key);
    }

    res.json({ data: settings });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId, settings } = req.body;
    if (!unitId || !settings) {
      res.status(400).json({ message: 'Unit ID and settings are required' });
      return;
    }

    for (const [key, accountId] of Object.entries(settings)) {
      if (accountId) {
        await configService.setAccountMapping(unitId, key, accountId as string);
      }
    }

    res.json({ message: 'Settings updated' });
  } catch (error) {
    next(error);
  }
}

// =====================================
// JOURNALS
// =====================================

export async function createJournal(req: Request, res: Response, next: NextFunction) {
  try {
    const data: CreateJournalDto = req.body;
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const journals = await service.createManualJournal({
      unitId: data.unitId,
      date: new Date(data.date),
      description: data.description,
      entries: data.entries.map((e: any) => ({
        accountId: e.accountId,
        debit: e.debit,
        credit: e.credit,
      })),
      createdById: userId,
    });
    res.status(201).json({ data: journals });
  } catch (error) {
    next(error);
  }
}

export async function getJournals(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as any;
    const result = await service.getJournals({
      ...query,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// =====================================
// REPORTS
// =====================================

export async function getTrialBalance(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as any;
    const result = await service.getTrialBalance({
      unitId: query.unitId,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function getBalanceSheet(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as any;
    // Default to today if not specified
    const endDate = query.endDate ? new Date(query.endDate) : new Date();

    const result = await service.getBalanceSheet({
      unitId: query.unitId,
      endDate,
    });
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function getIncomeStatement(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as any;
    // Default to current month if not specified
    const now = new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = query.endDate
      ? new Date(query.endDate)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const result = await service.getIncomeStatement({
      unitId: query.unitId,
      startDate,
      endDate,
    });
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}
