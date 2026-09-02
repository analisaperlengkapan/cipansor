import { Request, Response } from 'express';
import { CorrespondenceService } from './correspondence.service';
import { asyncHandler, Errors } from '@/middleware/error';
import { ApiResponse } from '@/utils/response';
import { generateLetterPdfBuffer } from '@/utils/generate-letter-pdf';
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
  create: asyncHandler(async (req: Request, res: Response) => {
    const result = await CorrespondenceService.createLetter(
      req.body,
      req.user!.id,
      actorOf(req)
    );
    res.status(201).json(ApiResponse.success(result));
  }),

  findAll: asyncHandler(async (req: Request, res: Response) => {
    const actor = actorOf(req);
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
    res.json(ApiResponse.success(result.data, undefined, result.meta));
  }),

  findOne: asyncHandler(async (req: Request, res: Response) => {
    const result = await CorrespondenceService.getLetterById(req.params.id, actorOf(req));
    res.json(ApiResponse.success(result));
  }),

  getPdf: asyncHandler(async (req: Request, res: Response) => {
    const letter = await CorrespondenceService.getLetterById(req.params.id, actorOf(req));
    if (!letter) {
      throw Errors.notFound('Surat tidak ditemukan');
    }
    const pdfBuffer = await generateLetterPdfBuffer(letter);
    const fileName = `Surat-${letter.letterNumber || letter.agendaNumber || 'Draft'}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.send(pdfBuffer);
  }),

  review: asyncHandler(async (req: Request, res: Response) => {
    const { action, notes, nextReviewerId, isFinalSigner } = req.body;
    const result = await CorrespondenceService.processReview(
      req.params.id,
      req.user!.id,
      action,
      notes,
      nextReviewerId,
      isFinalSigner,
      actorOf(req)
    );
    res.json(ApiResponse.success(result));
  }),

  submitForReview: asyncHandler(async (req: Request, res: Response) => {
    const result = await CorrespondenceService.submitForReview(
      req.params.id,
      actorOf(req),
      req.body?.note,
      req.body?.reviewerIds
    );
    res.json(ApiResponse.success(result));
  }),

  resubmit: asyncHandler(async (req: Request, res: Response) => {
    const result = await CorrespondenceService.resubmitLetter(
      req.params.id,
      actorOf(req),
      req.body?.note
    );
    res.json(ApiResponse.success(result));
  }),

  archive: asyncHandler(async (req: Request, res: Response) => {
    const result = await CorrespondenceService.archiveLetter(
      req.params.id,
      actorOf(req),
      req.body?.note
    );
    res.json(ApiResponse.success(result));
  }),

  createDisposition: asyncHandler(async (req: Request, res: Response) => {
    const result = await CorrespondenceService.createDisposition(
      { ...req.body, senderId: req.user!.id },
      actorOf(req)
    );
    res.status(201).json(ApiResponse.success(result));
  }),

  updateDispositionStatus: asyncHandler(async (req: Request, res: Response) => {
    const { status, notes } = req.body;
    const result = await CorrespondenceService.updateDispositionStatus(
      req.params.id,
      status,
      notes,
      req.user!.id
    );
    res.json(ApiResponse.success(result));
  }),

  getStats: asyncHandler(async (req: Request, res: Response) => {
    const actor = actorOf(req);

    if (!choosesUnit(actor) && !handlesUnitCorrespondence(actor)) {
      throw Errors.forbidden('Anda tidak memiliki akses ke statistik persuratan');
    }

    const unitId = choosesUnit(actor)
      ? (req.query.unitId as string | undefined)
      : (actor.unitId ?? undefined);

    const result = await CorrespondenceService.getDashboardStats(unitId);
    res.json(ApiResponse.success(result));
  }),

  getParticipants: asyncHandler(async (req: Request, res: Response) => {
    const query = (res.locals.validatedQuery || req.query) as {
      search?: string;
      unitId?: string;
      limit?: number;
    };
    const result = await CorrespondenceService.getParticipants(
      {
        search: query.search,
        unitId: query.unitId,
        limit: query.limit,
      },
      actorOf(req)
    );
    res.json(ApiResponse.success(result));
  }),

  verifyPublic: asyncHandler(async (req: Request, res: Response) => {
    const token =
      (req.body?.token as string) ||
      (req.query.token as string) ||
      (req.params.token as string);
    if (!token) {
      throw Errors.badRequest('Token verifikasi wajib diisi');
    }

    const result = await CorrespondenceService.verifyPublicLetter(token);
    res.json(ApiResponse.success(result));
  }),
};
