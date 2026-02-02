// ... (imports)

// ...

export async function createJournal(req: Request, res: Response, next: NextFunction) {
  try {
    const data: CreateJournalDto = req.body;
    const userId = req.user?.sub;
    const unitId = req.user?.unitId; // Get unitId from token/user context

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!unitId && !data.unitId) {
       res.status(400).json({ message: 'Unit ID is required' });
       return;
    }

    const journals = await service.createManualJournal({
      ...data,
      unitId: data.unitId || unitId!, // Use provided or context unitId
      date: new Date(data.date),
      createdById: userId,
    });
    res.status(201).json({ data: journals });
  } catch (error) {
    next(error);
  }
}

// ...
