import { Request, Response, NextFunction } from 'express';
import { SecretsService } from './secrets.service';
import { createSecretSchema } from './secrets.validation';
import httpStatus from 'http-status';

export const listSecrets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const unitId = req.query.unitId as string | undefined;
    const secrets = await SecretsService.list(unitId);
    res.json({ data: secrets });
  } catch (error) {
    next(error);
  }
};

export const upsertSecret = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = createSecretSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(httpStatus.BAD_REQUEST).json({ errors: validation.error.format() });
      return;
    }

    // Ensure key and value are provided or handle missing value if it was optional in schema but required in service
    // 'value' is often required for create but optional for update if logic allows,
    // but Prisma upsert requires create data.
    // If validation.data.value is undefined, it might fail.
    // Assuming upsert needs value if it doesn't exist.
    // We can default to empty string or error.
    if (!validation.data.key) {
        res.status(httpStatus.BAD_REQUEST).json({ message: 'Key is required' });
        return;
    }

    if (validation.data.value === undefined) {
        res.status(httpStatus.BAD_REQUEST).json({ message: 'Value is required' });
        return;
    }

    const result = await SecretsService.upsert({
        ...validation.data,
        key: validation.data.key, // Force key to be present
        value: validation.data.value // Force value to be present
    });
    res.status(httpStatus.OK).json({ data: { id: result.id, key: result.key } });
  } catch (error) {
    next(error);
  }
};

export const deleteSecret = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await SecretsService.delete(id);
    res.status(httpStatus.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};
