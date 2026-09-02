import { Request, Response } from 'express';
import { CorrespondenceService } from './correspondence.service';
import { asyncHandler, Errors } from '@/middleware/error';
import { ApiResponse } from '@/utils/response';
import crypto from 'crypto';
import {
  generateLetterPdfBuffer,
  stampRevoked,
  LetterPdfError,
} from '@/utils/generate-letter-pdf';
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

    /**
     * A withdrawn letter is still printed — stamped DICABUT, not refused.
     *
     * The office still has to file a copy, and whoever is already holding the
     * letter deserves a sheet that explains itself. Refusing the download left
     * both without one. Electronic-signature platforms do the same: DocuSign
     * watermarks a voided envelope VOID and keeps it downloadable.
     *
     * The care is in *what* gets stamped. The generator drops the signature
     * block once a signature is revoked, so a naive re-render is a different
     * document from the one that was hashed — and uploading it to the public
     * page would be answered with the sentence a forgery gets. So the naskah is
     * rebuilt **as it stood when signed**, its bytes are re-hashed, and the
     * stamp is applied only once that hash matches `pdfHash`. Circulated copies
     * keep verifying, and keep reporting the revocation.
     *
     * When it does not match, the bytes have drifted since signing — the very
     * hazard `docs/EOFFICE_ESIGN_PLAN.md` §2.4 describes — and refusing is the
     * honest answer until PR-3 archives the signed bytes.
     */
    const latest = letter.signatures?.at(-1);
    const revoked = latest?.revokedAt ? latest : null;

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await generateLetterPdfBuffer(
        revoked
          ? {
              ...letter,
              signatures: (letter.signatures ?? []).map((s) => ({ ...s, revokedAt: null })),
            }
          : letter
      );
    } catch (e) {
      if (e instanceof LetterPdfError) throw Errors.badRequest(e.message);
      throw e;
    }

    if (revoked) {
      const hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
      if (!latest?.pdfHash || hash !== latest.pdfHash) {
        throw Errors.badRequest(
          'Naskah ini tidak dapat dicetak ulang: berkas yang dihasilkan tidak lagi sama persis ' +
            'dengan yang ditandatangani, sehingga salinan bercap pun tidak dapat dipertanggungjawabkan.'
        );
      }
      pdfBuffer = await stampRevoked(pdfBuffer, {
        reason: revoked.revokedReason ?? 'Dicabut oleh pejabat yang berwenang.',
        revokedAt: new Date(revoked.revokedAt as unknown as string),
        revokedByName: revoked.revokedBy?.name ?? null,
      });
    }
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

};
