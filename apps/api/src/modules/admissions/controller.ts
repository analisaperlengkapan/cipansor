import { Request, Response, NextFunction } from 'express';
import * as service from './service';
import {
  createAdmissionPeriodSchema,
  updateAdmissionPeriodSchema,
  createRegistrantSchema,
  updateRegistrantSchema,
  updateRegistrantScoreSchema,
  updateRegistrantStatusSchema,
  createRegistrantDocumentSchema,
  verifyDocumentSchema,
  trackRegistrantQuerySchema,
} from './schema';
import { Errors } from '../../middleware/error';
import { z } from 'zod';
import { requireUser } from '../../middleware/auth';

// =====================================
// ADMISSION PERIOD CONTROLLERS
// =====================================

export async function getAdmissionPeriods(req: Request, res: Response, next: NextFunction) {
  try {
    const query = res.locals.validatedQuery;
    const result = await service.getAdmissionPeriods(query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getAdmissionPeriodById(req: Request, res: Response, next: NextFunction) {
  try {
    const period = await service.getAdmissionPeriodById(req.params.id);
    if (!period) {
      throw Errors.notFound('Admission period');
    }
    res.json({ success: true, data: period });
  } catch (error) {
    next(error);
  }
}

export async function createAdmissionPeriod(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createAdmissionPeriodSchema.parse(req.body);
    const period = await service.createAdmissionPeriod(data);
    res.status(201).json({ success: true, data: period });
  } catch (error) {
    next(error);
  }
}

export async function updateAdmissionPeriod(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateAdmissionPeriodSchema.parse(req.body);
    const period = await service.updateAdmissionPeriod(req.params.id, data);
    res.json({ success: true, data: period });
  } catch (error) {
    next(error);
  }
}

export async function deleteAdmissionPeriod(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteAdmissionPeriod(req.params.id);
    res.json({ success: true, message: 'Admission period deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getAdmissionPeriodStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await service.getAdmissionPeriodStats(req.params.id);
    if (!stats) {
      throw Errors.notFound('Admission period');
    }
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

// =====================================
// REGISTRANT CONTROLLERS
// =====================================

export async function getRegistrants(req: Request, res: Response, next: NextFunction) {
  try {
    const query = res.locals.validatedQuery;
    const result = await service.getRegistrants(query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getRegistrantById(req: Request, res: Response, next: NextFunction) {
  try {
    const registrant = await service.getRegistrantById(req.params.id);
    if (!registrant) {
      throw Errors.notFound('Registrant');
    }
    res.json({ success: true, data: registrant });
  } catch (error) {
    next(error);
  }
}

export async function createRegistrant(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createRegistrantSchema.parse(req.body);
    const registrant = await service.createRegistrant(data);
    res.status(201).json({ success: true, data: registrant });
  } catch (error) {
    next(error);
  }
}

export async function updateRegistrant(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateRegistrantSchema.parse(req.body);
    const registrant = await service.updateRegistrant(req.params.id, data);
    res.json({ success: true, data: registrant });
  } catch (error) {
    next(error);
  }
}

export async function updateRegistrantScore(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateRegistrantScoreSchema.parse(req.body);
    const registrant = await service.updateRegistrantScore(req.params.id, data);
    res.json({ success: true, data: registrant });
  } catch (error) {
    next(error);
  }
}

export async function updateRegistrantStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateRegistrantStatusSchema.parse(req.body);
    const registrant = await service.updateRegistrantStatus(req.params.id, data);
    res.json({ success: true, data: registrant });
  } catch (error) {
    next(error);
  }
}

export async function enrollRegistrant(req: Request, res: Response, next: NextFunction) {
  try {
    const schema = z.object({
      nis: z.string().min(1),
      nisn: z.string().optional(),
      classId: z.string().optional(),
      roomId: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const result = await service.enrollRegistrant(req.params.id, {
      nis: data.nis,
      nisn: data.nisn,
      classId: data.classId,
      roomId: data.roomId,
    });
    res.json({
      success: true,
      data: result,
      message: 'Registrant enrolled successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteRegistrant(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteRegistrant(req.params.id);
    res.json({ success: true, message: 'Registrant deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// =====================================
// DOCUMENT CONTROLLERS
// =====================================

export async function getRegistrantDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    const documents = await service.getRegistrantDocuments(req.params.registrantId);
    res.json({ success: true, data: documents });
  } catch (error) {
    next(error);
  }
}

export async function createRegistrantDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createRegistrantDocumentSchema.parse({
      ...req.body,
      registrantId: req.params.registrantId,
    });
    const document = await service.createRegistrantDocument(data);
    res.status(201).json({ success: true, data: document });
  } catch (error) {
    next(error);
  }
}

export async function verifyDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const data = verifyDocumentSchema.parse(req.body);
    const document = await service.verifyDocument(req.params.id, data.isVerified, data.notes);
    res.json({ success: true, data: document });
  } catch (error) {
    next(error);
  }
}

export async function deleteRegistrantDocument(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteRegistrantDocument(req.params.id);
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// =====================================
// PUBLIC CONTROLLERS (no authentication)
// =====================================

/**
 * Return the single most-relevant currently-active admission period for a
 * public landing page / registration form. Exposed WITHOUT authentication so
 * the public PPDB page (`apps/web/src/app/public/ppdb/page.tsx`) can bootstrap
 * the registration form. Returns `null` inside `data` when no period is
 * active (the frontend handles this by showing a "pendaftaran belum dibuka"
 * message).
 *
 * Intentionally LEAKS only: id, name, startDate, endDate, registrationFee,
 * requirements, unit name and academic year name — never registrant counts,
 * internal notes, or any PII.
 */
export async function getPublicActiveAdmissionPeriod(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { prisma } = await import('../../lib/prisma');
    const period = await prisma.admissionPeriod.findFirst({
      where: { isActive: true },
      orderBy: { startDate: 'desc' },
      // Keep this projection in lockstep with the JSDoc whitelist above:
      // id, name, startDate, endDate, registrationFee, requirements, unit
      // name and academic year name — never `quota`, registrant counts,
      // internal notes, or any PII. Anything added here is exposed to
      // anonymous callers of the public PPDB form.
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        registrationFee: true,
        requirements: true,
        unit: { select: { id: true, name: true, type: true } },
        academicYear: { select: { id: true, name: true } },
      },
    });
    res.json({ success: true, data: period });
  } catch (error) {
    next(error);
  }
}

/**
 * Public registrant creation endpoint used by the unauthenticated PPDB form.
 * Validates + persists the same way as `createRegistrant`, but the response
 * is trimmed to non-sensitive identification fields so a public caller can't
 * enumerate internal columns (status history, test scores, etc.) by varying
 * payload shape.
 */
export async function createPublicRegistrant(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = createRegistrantSchema.parse(req.body);

    // Guard: the public endpoint must only accept submissions for periods
    // that are currently ACTIVE and within their registration window.
    // Without this, any caller who has (or guesses) a valid period UUID
    // can submit registrations after the period has been closed by an
    // admin — bypassing the intended admission lifecycle. The companion
    // `getPublicActiveAdmissionPeriod` filters by `isActive: true`, but
    // that only protects UI-driven flows; direct API callers need a
    // server-side check here. Validation lives at the controller (not
    // the service) so the authenticated `createRegistrant` endpoint —
    // used by admins who legitimately need to backfill registrants for
    // closed periods — continues to work unchanged.
    const { prisma } = await import('../../lib/prisma');
    const period = await prisma.admissionPeriod.findUnique({
      where: { id: data.admissionPeriodId },
      select: { isActive: true, startDate: true, endDate: true },
    });

    if (!period) {
      throw Errors.notFound('Admission period');
    }

    const now = new Date();
    if (!period.isActive || now < period.startDate || now > period.endDate) {
      throw Errors.badRequest('Admission period is not open for registration');
    }

    const registrant = await service.createRegistrant(data);
    res.status(201).json({
      success: true,
      data: {
        id: registrant.id,
        registrationNo: registrant.registrationNo,
        fullName: registrant.fullName,
        status: registrant.status,
        createdAt: registrant.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Public PPDB tracking endpoint (`GET /admissions/public/track`). Looks a
 * registrant up by registration number + birth date (two-factor lookup, see
 * `getRegistrantTrackingInfo`) and returns only the whitelisted projection
 * selected there — selection progress, scores, and document verification
 * state. Never expose parent contact data, addresses, or internal notes here:
 * this endpoint is reachable without a session (rate-limited per IP).
 */
export async function trackPublicRegistrantStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { registrationNo, birthDate } = trackRegistrantQuerySchema.parse(req.query);

    const registrant = await service.getRegistrantTrackingInfo(registrationNo, birthDate);
    if (!registrant) {
      throw Errors.notFound('Registrant with provided details');
    }

    res.json({ success: true, data: registrant });
  } catch (error) {
    next(error);
  }
}

export async function getPriorityLeads(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId } = req.query;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = requireUser(req);

    // Unit-level authorization: a UNIT_ADMIN / STAFF must not be able to
    // query another unit's priority leads by guessing/knowing its unitId,
    // nor by omitting `unitId` entirely (which would otherwise return
    // leads across ALL units — see lead-scoring.service.ts where
    // `unitId` is only spread when truthy). SUPER_ADMIN and
    // YAYASAN_ADMIN can scope to any (or all) unit(s).
    let effectiveUnitId = unitId as string | undefined;
    if (user && user.role !== 'SUPER_ADMIN' && user.role !== 'YAYASAN_ADMIN') {
      if (!user.unitId) {
        throw Errors.forbidden('Access to this unit is not allowed');
      }
      if (effectiveUnitId && effectiveUnitId !== user.unitId) {
        throw Errors.forbidden('Access to this unit is not allowed');
      }
      // Force-scope to the caller's own unit when none was provided.
      effectiveUnitId = user.unitId;
    }

    const { getPriorityLeads: getLeads } = await import('./lead-scoring.service');
    const leads = await getLeads(effectiveUnitId);
    res.json({ success: true, data: leads });
  } catch (error) {
    next(error);
  }
}
