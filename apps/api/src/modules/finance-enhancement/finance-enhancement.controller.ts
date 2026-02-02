import { Request, Response, NextFunction } from 'express';
import { financeEnhancementService } from './finance-enhancement.service';
import { sendResponse } from '@/utils/response';
import { CreateJournalEntryInput } from './schema';

export const financeEnhancementController = {
  // ... other methods ...

  createJournalEntry: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { unitId } = req.user!;
      const input = req.body;

      // Manually construct the input to match the expected type
      // The controller receives a raw body which might not strictly match the type yet
      // The service expects { unitId, date, description, entries, createdById }
      const serviceInput = {
        unitId: input.unitId || unitId,
        date: input.date,
        description: input.description,
        entries: input.entries, // Assuming validation happens elsewhere or implicitly
        createdById: req.user!.id,
      };

      await financeEnhancementService.createManualJournal(serviceInput);

      sendResponse(res, { success: true }, 'Journal entry created successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  getTrialBalance: async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { unitId } = req.user!;
        const { startDate, endDate } = req.query;

        const result = await financeEnhancementService.getTrialBalance({
            unitId,
            startDate: startDate ? new Date(startDate as string) : undefined,
            endDate: endDate ? new Date(endDate as string) : undefined,
        });

        sendResponse(res, result);
    } catch (error) {
        next(error);
    }
  },
};
