import { Request, Response, NextFunction } from 'express';
import { RoleCode } from '@prisma/client';
import { businessUnitService } from './service';
import { BusinessUnitType } from '@prisma/client';

/**
 * Resolve the effective unitId for the current request.
 * SUPER_ADMIN users have unitId: null in their JWT (they are global).
 * For such users, we allow unitId to be supplied via query param or body.
 * Non-SUPER_ADMIN users MUST use the unitId from their JWT to prevent
 * cross-unit access via query/body parameter injection.
 */
function resolveUnitId(req: Request): string | undefined {
  // Non-SUPER_ADMIN users: always use JWT unitId (never trust query/body)
  if (req.user?.unitId) {
    return req.user.unitId;
  }
  // Only SUPER_ADMIN (who has unitId: null) may specify unitId via query/body
  if (isSuperAdmin(req)) {
    return (req.query.unitId as string | undefined)
      || req.body?.unitId
      || undefined;
  }
  // Non-SUPER_ADMIN with no unitId in JWT — cannot resolve
  return undefined;
}

function isSuperAdmin(req: Request): boolean {
  return req.user?.roleCode === RoleCode.SUPER_ADMIN;
}

export const businessUnitController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const unitId = resolveUnitId(req);

      // SUPER_ADMIN without a unitId filter can list all business units
      if (!unitId && !isSuperAdmin(req)) {
        return res.status(400).json({ success: false, message: 'Unit ID tidak ditemukan' });
      }

      const result = await businessUnitService.list({
        unitId,
        type: req.query.type as BusinessUnitType | undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const unitId = resolveUnitId(req);

      // SUPER_ADMIN can view any business unit without unitId scoping
      const result = isSuperAdmin(req) && !unitId
        ? await businessUnitService.getById(req.params.id)
        : await businessUnitService.getById(req.params.id, unitId);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const unitId = resolveUnitId(req);
      if (!unitId) {
        return res.status(400).json({ success: false, message: 'Unit ID tidak ditemukan. SUPER_ADMIN harus menyertakan unitId di body.' });
      }

      const result = await businessUnitService.create({ ...req.body, unitId });
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const unitId = resolveUnitId(req);

      if (!unitId && !isSuperAdmin(req)) {
        return res.status(400).json({ success: false, message: 'Unit ID tidak ditemukan' });
      }

      // SUPER_ADMIN can update any business unit without unitId scoping
      const result = isSuperAdmin(req) && !unitId
        ? await businessUnitService.update(req.params.id, undefined, req.body)
        : await businessUnitService.update(req.params.id, unitId!, req.body);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const unitId = resolveUnitId(req);

      // SUPER_ADMIN can delete any business unit without unitId scoping
      if (isSuperAdmin(req) && !unitId) {
        await businessUnitService.delete(req.params.id);
      } else if (unitId) {
        await businessUnitService.delete(req.params.id, unitId);
      } else {
        return res.status(400).json({ success: false, message: 'Unit ID tidak ditemukan' });
      }

      res.json({ success: true, data: null, message: 'Business unit berhasil dihapus' });
    } catch (error) {
      next(error);
    }
  },

  async getPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const unitId = resolveUnitId(req);

      if (!unitId && !isSuperAdmin(req)) {
        return res.status(400).json({ success: false, message: 'Unit ID tidak ditemukan' });
      }

      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'startDate dan endDate diperlukan' });
      }

      // SUPER_ADMIN can view performance without unitId scoping
      const result = isSuperAdmin(req) && !unitId
        ? await businessUnitService.getPerformance(req.params.id, undefined, new Date(startDate as string), new Date(endDate as string))
        : await businessUnitService.getPerformance(req.params.id, unitId!, new Date(startDate as string), new Date(endDate as string));

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
