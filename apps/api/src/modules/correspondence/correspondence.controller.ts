import { Request, Response, NextFunction } from 'express';
import { CorrespondenceService } from './correspondence.service';
import { Errors } from '@/middleware/error';
import {
  choosesUnit,
  handlesUnitCorrespondence,
  type LetterActor,
} from '@/utils/letter-access';

/**
 * The caller, in the shape the access rules expect.
 *
 * Scoping decisions here must be made on `roleCode`. The previous version
 * branched on the legacy `role`, and since deriveLegacyRole() maps every
 * YAYASAN_* code onto 'UNIT_ADMIN', the yayasan board fell through to the
 * "no unit assigned" branch and was answered with 403 — the sekretaris and
 * ketua yayasan could not open the letter list their own workflow depends on.
 */
function actorOf(req: Request): LetterActor {
  return {
    id: req.user!.id,
    role: req.user?.role,
    roleCode: req.user?.roleCode,
    unitId: req.user?.unitId,
  };
}

export const CorrespondenceController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CorrespondenceService.createLetter(req.body, req.user!.id);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = actorOf(req);
      // `?unitId=` narrows, it never widens: it is honoured only for callers
      // who already see every unit, and the scope clause inside the service
      // applies regardless of what the query string says.
      const unitId = choosesUnit(actor) ? (req.query.unitId as string | undefined) : undefined;

      const result = await CorrespondenceService.getLetters(unitId, {
        actor,
        page: Number(req.query.page),
        limit: Number(req.query.limit),
        direction: req.query.direction as any,
        status: req.query.status as any,
        search: req.query.search as string,
        scope: req.query.scope as any,
        userId: req.user!.id,
      });
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async findOne(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CorrespondenceService.getLetterById(req.params.id, actorOf(req));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async review(req: Request, res: Response, next: NextFunction) {
    try {
      const { action, notes, nextReviewerId, isFinalSigner } = req.body;
      const result = await CorrespondenceService.processReview(
        req.params.id,
        req.user!.id,
        action,
        notes,
        nextReviewerId,
        isFinalSigner
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async resubmit(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CorrespondenceService.resubmitLetter(
        req.params.id,
        actorOf(req),
        req.body?.note
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async archive(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CorrespondenceService.archiveLetter(
        req.params.id,
        actorOf(req),
        req.body?.note
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async createDisposition(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CorrespondenceService.createDisposition(
        { ...req.body, senderId: req.user!.id },
        actorOf(req)
      );
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async updateDispositionStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, notes } = req.body;
      const result = await CorrespondenceService.updateDispositionStatus(
        req.params.id,
        status,
        notes,
        req.user!.id
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = actorOf(req);

      // The dashboard is an office tool: it reports on a unit's letter book as
      // a whole, which is exactly what someone outside the correspondence
      // function has no business seeing. Gated here rather than scoped,
      // because per-person counts would be a different feature.
      if (!choosesUnit(actor) && !handlesUnitCorrespondence(actor)) {
        throw Errors.forbidden('Anda tidak memiliki akses ke statistik persuratan');
      }

      const unitId = choosesUnit(actor)
        ? (req.query.unitId as string | undefined)
        : (actor.unitId ?? undefined);

      const result = await CorrespondenceService.getDashboardStats(unitId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async verifyPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const token = (req.query.token as string) || (req.params.token as string);
      if (!token) {
        throw Errors.badRequest('Token verifikasi wajib diisi');
      }
      const result = await CorrespondenceService.verifyPublicLetter(token);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
