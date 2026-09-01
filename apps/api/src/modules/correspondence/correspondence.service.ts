import {
  PrismaClient,
  Prisma,
  LetterFlowAction,
  LetterStatus as DbLetterStatus,
  LetterType as DbLetterType,
  LetterNature as DbLetterNature,
  RoleCode,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  CreateLetterInput,
  CreateDispositionInput,
  LetterDirection,
  LetterStatus,
  UpdateLetterInput,
  EXCLUDED_CORRESPONDENCE_ROLES,
} from '@cipansor/shared';
import { eventBus } from '@/lib/event-bus';
import { verifyLetterByToken } from '@/utils/letter-verification';
import {
  assertLetterAccess,
  handlesUnitCorrespondence,
  letterScopeWhere,
  type LetterActor,
} from '@/utils/letter-access';
import { isFoundationScopedRole, seesAllUnits } from '@/utils/resolve-unit-id';
import {
  assertMayArchive,
  assertMayResubmit,
  assertMayReview,
  nextRung,
  statusAfterApproval,
  statusAfterResubmit,
  type ReviewerRung,
} from '@/utils/letter-workflow';
import { AGENDA_TYPE_CODE, assertNatureAllowed } from '@/utils/letter-naskah';
import { Errors } from '@/middleware/error';

/** Anything that can run a query — the live client or a transaction handle. */
type Db = Prisma.TransactionClient | PrismaClient;

/**
 * Append one entry to a letter's history.
 *
 * Always called with the same transaction that performed the change, so a
 * letter cannot move without the move being recorded — a history written
 * afterwards, outside the transaction, is a history with holes in it exactly
 * when something went wrong and the record matters most.
 */
async function recordFlow(
  db: Db,
  entry: {
    letterId: string;
    actorId: string;
    action: LetterFlowAction;
    targetId?: string | null;
    fromStatus?: DbLetterStatus | null;
    toStatus?: DbLetterStatus | null;
    note?: string | null;
  }
) {
  await db.letterFlowEvent.create({
    data: {
      letterId: entry.letterId,
      actorId: entry.actorId,
      action: entry.action,
      targetId: entry.targetId ?? null,
      fromStatus: entry.fromStatus ?? null,
      toStatus: entry.toStatus ?? null,
      note: entry.note ?? null,
    },
  });
}

/**
 * Bentuk nomor surat bawaan, mengikuti surat asli Yayasan:
 *
 *     434/Sket/Y-CPS/VII/2026
 *      │    │     │    │    └── tahun
 *      │    │     │    └─────── bulan angka Romawi
 *      │    │     └──────────── kode organisasi
 *      │    └────────────────── kode jenis naskah (AGENDA_TYPE_CODE)
 *      └─────────────────────── nomor urut dalam buku agenda jenis itu
 *
 * Versi pertama menghilangkan kode organisasi, sehingga nomor yang dihasilkan
 * tidak sama bentuknya dengan surat yang selama ini dikeluarkan. Ini hanya
 * *bawaan*: `AgendaNumber.format` disimpan per unit + jenis + tahun ajaran,
 * jadi unit yang memakai kode sendiri tinggal menyunting barisnya tanpa
 * mengubah kode.
 */
const DEFAULT_AGENDA_FORMAT = '[NO]/[TYPE]/Y-CPS/[ROMAN]/[YEAR]';

export const CorrespondenceService = {
  // Helper: Generate Auto Number
  async generateNumber(unitId: string, type: string, academicYearId: string): Promise<string> {
    // 1. Find Agenda Config
    let agenda = await prisma.agendaNumber.findUnique({
      where: {
        unitId_academicYearId_type: {
          unitId,
          academicYearId,
          type,
        },
      },
    });

    // 2. Create if not exists
    if (!agenda) {
      agenda = await prisma.agendaNumber.create({
        data: {
          unitId,
          academicYearId,
          type,
          lastNumber: 0,
          format: DEFAULT_AGENDA_FORMAT,
        },
      });
    }

    // 3. Increment (Atomic)
    const updatedAgenda = await prisma.agendaNumber.update({
      where: { id: agenda.id },
      data: { lastNumber: { increment: 1 } },
    });

    const newNumber = updatedAgenda.lastNumber;

    // 4. Format String
    const date = new Date();
    const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const romanMonth = romanMonths[date.getMonth()];
    const year = date.getFullYear().toString();

    let formatted = agenda.format
      .replace('[NO]', newNumber.toString().padStart(3, '0'))
      .replace('[TYPE]', type)
      .replace('[ROMAN]', romanMonth)
      .replace('[YEAR]', year);

    return formatted;
  },

  /**
   * Validate that all supplied user IDs exist, are active, have active internal roles, and fall within permitted unit scope.
   */
  async validateParticipantEligibility(userIds: string[], actor?: LetterActor) {
    if (!userIds || userIds.length === 0) return;

    const uniqueIds = Array.from(new Set(userIds));
    const now = new Date();

    const users = await prisma.user.findMany({
      where: {
        id: { in: uniqueIds },
        isActive: true,
      },
      select: {
        id: true,
        unitId: true,
        teacher: { select: { nip: true } },
        staff: { select: { nip: true } },
        userRoles: {
          where: {
            role: {
              code: {
                notIn: EXCLUDED_CORRESPONDENCE_ROLES as unknown as RoleCode[],
              },
            },
            OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
          },
          select: { role: { select: { code: true } } },
        },
      },
    });

    if (users.length !== uniqueIds.length) {
      throw Errors.badRequest('Satu atau lebih penerima/pemeriksa tidak ditemukan atau tidak aktif');
    }

    const actorSeesAll = actor ? seesAllUnits(actor) : true;

    for (const u of users) {
      const isInternal = u.teacher || u.staff || u.userRoles.length > 0;
      if (!isInternal) {
        throw Errors.badRequest(`Pengguna ${u.id} tidak memiliki peran internal yang sah`);
      }

      // Enforce unit scope if caller is unit-restricted
      if (!actorSeesAll && actor?.unitId && u.unitId && u.unitId !== actor.unitId) {
        throw Errors.forbidden(`Pengguna ${u.id} berada di luar unit Anda`);
      }
    }
  },

  async createLetter(data: CreateLetterInput, userId: string, actor?: LetterActor) {
    if (!actor || !actor.roleCode) {
      throw Errors.forbidden('Peran Anda tidak berwenang untuk membuat surat dinas');
    }

    // Executive foundation roles authorized to issue correspondence
    const isFoundationExecutive =
      actor.roleCode === RoleCode.YAYASAN_KETUA || actor.roleCode === RoleCode.YAYASAN_SEKRETARIS;
    const isCorrespondenceRole = handlesUnitCorrespondence(actor);
    const isSuperAdmin = actor.roleCode === RoleCode.SUPER_ADMIN;

    // Allowlist: ONLY unit correspondence roles (tata usaha, kepsek, admin unit), executive foundation roles (Ketua/Sekretaris), and SUPER_ADMIN.
    // Oversight-only roles (YAYASAN_PEMBINA, YAYASAN_PENGAWAS, YAYASAN_ANGGOTA) do NOT have creation authority.
    const isAuthorizedCreator = isCorrespondenceRole || isFoundationExecutive || isSuperAdmin;

    if (!isAuthorizedCreator) {
      throw Errors.forbidden('Peran Anda tidak berwenang untuk membuat surat dinas');
    }

    // Validate reviewer and recipient eligibility
    const participantsToValidate = [
      ...(data.reviewerIds || []),
      ...(data.recipientIds || []),
    ];
    if (participantsToValidate.length > 0) {
      await this.validateParticipantEligibility(participantsToValidate, actor);
    }

    // Client is only allowed to request initial status DRAFT or PENDING_REVIEW
    if (data.status !== LetterStatus.DRAFT && data.status !== LetterStatus.PENDING_REVIEW) {
      throw Errors.badRequest('Status awal surat hanya dapat berupa DRAFT atau PENDING_REVIEW');
    }

    // Single-unit bypass is strictly reserved for Executive Foundation Roles and SUPER_ADMIN.
    const isFoundationBypass = isFoundationExecutive || isSuperAdmin;
    const targetUnitId = (isFoundationBypass ? data.unitId : actor.unitId) || data.unitId;

    if (!targetUnitId) {
      throw Errors.badRequest('Unit ID wajib diisi');
    }
    if (!isFoundationBypass && actor.unitId && data.unitId && data.unitId !== actor.unitId) {
      throw Errors.forbidden('Anda tidak berwenang membuat surat untuk unit lain');
    }

    // Jenis naskah menentukan sifat mana yang sah dan buku nomor mana yang
    // dipakai. Divalidasi sebelum apa pun ditulis: menolak setelah nomor
    // agenda terlanjur naik akan meninggalkan lubang di buku agenda.
    const type = (data.type as DbLetterType | undefined) ?? DbLetterType.SURAT_DINAS;
    assertNatureAllowed(type, data.nature as unknown as DbLetterNature);

    // Incoming letters do not enter review unless reviewerIds are provided.
    // If an incoming letter is submitted without reviewers, set status based on recipient assignment.
    let initialStatus = data.status as DbLetterStatus;
    if (data.direction === 'INCOMING' && initialStatus === DbLetterStatus.PENDING_REVIEW && (!data.reviewerIds || data.reviewerIds.length === 0)) {
      initialStatus = data.recipientIds && data.recipientIds.length > 0
        ? DbLetterStatus.DISPOSED
        : DbLetterStatus.DRAFT;
    }

    // Get active academic year
    const activeYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    });
    const academicYearId = activeYear?.id || 'DEFAULT';

    // Generate number if missing
    let agendaNumber = data.agendaNumber;
    let letterNumber = data.letterNumber;

    if (data.direction === 'INCOMING' && !agendaNumber) {
      agendaNumber = await this.generateNumber(targetUnitId, 'INCOMING', academicYearId);
    } else if (data.direction === 'OUTGOING' && !letterNumber) {
      // Typically only generated when status is READY or SIGNED, but we'll allow draft numbering if needed
      // Or just leave it empty for DRAFT
      if (initialStatus !== 'DRAFT') {
        // Per jenis, not one shared counter: on paper an SK has its own agenda
        // book, and sharing a counter would make SK numbers skip every time an
        // ordinary letter went out.
        letterNumber = await this.generateNumber(
          targetUnitId,
          AGENDA_TYPE_CODE[type],
          academicYearId
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create Letter
      const letter = await tx.letter.create({
        data: {
          unitId: targetUnitId,
          direction: data.direction as any, // Enum mapping might need care
          type,
          classificationId: data.classificationId,
          agendaNumber: agendaNumber,
          letterNumber: letterNumber,
          date: new Date(data.date),
          receivedAt: data.receivedAt ? new Date(data.receivedAt) : null,
          subject: data.subject,
          content: data.content,
          fileUrl: data.fileUrl,
          urgency: data.urgency as any,
          nature: data.nature as any,
          status: initialStatus,
          senderName: data.senderName,
          senderTitle: data.senderTitle,
          senderInstance: data.senderInstance,
          recipientName: data.recipientName,
          recipientInstance: data.recipientInstance,
          createdById: userId,
        },
      });

      // Add Reviewers (deduplicated)
      if (data.reviewerIds && data.reviewerIds.length > 0) {
        const uniqueReviewerIds = Array.from(new Set(data.reviewerIds));
        await tx.letterReviewer.createMany({
          data: uniqueReviewerIds.map((reviewerId, index) => ({
            letterId: letter.id,
            reviewerId: reviewerId,
            order: index + 1,
            status: 'PENDING',
            isSigner: false, // Default to false so dynamic review-and-forward can take place
          })),
        });
      }

      // Add Recipients
      if (data.recipientIds && data.recipientIds.length > 0) {
        const uniqueRecipients = Array.from(new Set(data.recipientIds));
        await tx.letterRecipient.createMany({
          data: uniqueRecipients.map((recipientId) => ({
            letterId: letter.id,
            userId: recipientId,
            unitId: targetUnitId,
            isCC: false,
          })),
        });
      }

      // Record CREATED flow event first
      await recordFlow(tx, {
        letterId: letter.id,
        actorId: userId,
        action: LetterFlowAction.CREATED,
        toStatus: letter.status,
        note: letter.subject,
      });

      // Record SUBMITTED if created straight into review
      if (letter.status !== DbLetterStatus.DRAFT && data.reviewerIds?.length) {
        await recordFlow(tx, {
          letterId: letter.id,
          actorId: userId,
          action: LetterFlowAction.SUBMITTED,
          toStatus: letter.status,
        });
      }

      const createdDispositionsToNotify: Array<{ id: string; recipientId: string }> = [];

      // Create live Dispositions ONLY when initial status is DISPOSED
      if (data.direction === 'INCOMING' && initialStatus === DbLetterStatus.DISPOSED && data.recipientIds?.length) {
        const uniqueRecipients = Array.from(new Set(data.recipientIds));
        for (const recipientId of uniqueRecipients) {
          const createdDisp = await tx.disposition.create({
            data: {
              letterId: letter.id,
              senderId: userId,
              recipientId,
              instruction: 'Surat Masuk Diteruskan',
              status: 'PENDING',
            },
          });

          await recordFlow(tx, {
            letterId: letter.id,
            actorId: userId,
            action: LetterFlowAction.DISPOSED,
            targetId: recipientId,
            fromStatus: letter.status,
            toStatus: DbLetterStatus.DISPOSED,
            note: 'Surat Masuk Diteruskan',
          });

          createdDispositionsToNotify.push({ id: createdDisp.id, recipientId });
        }
      }

      return { letter, createdDispositionsToNotify };
    });

    // Post-commit: Notify first reviewer if letter created directly in PENDING_REVIEW
    const uniqueReviewers = data.reviewerIds ? Array.from(new Set(data.reviewerIds)) : [];
    if (result.letter.status === DbLetterStatus.PENDING_REVIEW && uniqueReviewers.length) {
      const firstReviewerId = uniqueReviewers[0];
      eventBus.emit('notification:send', {
        userId: firstReviewerId,
        unitId: result.letter.unitId,
        type: 'REMINDER',
        title: 'Konsep Surat Perlu Ditinjau',
        message: `Konsep surat "${result.letter.subject}" diajukan kepada Anda untuk ditinjau.`,
        data: { letterId: result.letter.id, link: `/e-office/letter/${result.letter.id}` },
      });
    }

    // Post-commit: Notify recipients for automatic dispositions
    for (const disp of result.createdDispositionsToNotify) {
      eventBus.emit('notification:send', {
        userId: disp.recipientId,
        type: 'REMINDER',
        title: 'Disposisi Baru',
        message: 'Anda menerima terusan surat masuk baru.',
        data: {
          entityId: disp.id,
          entityType: 'DISPOSITION',
          letterId: result.letter.id,
          link: `/e-office/letter/${result.letter.id}`,
        },
      });
    }

    return result.letter;
  },

  /**
   * `unitId` is an optional *narrowing* on top of what `actor` may see — not
   * the access rule itself. Foundation and cross-unit roles have no unit of
   * their own, so `undefined` means "every unit they are entitled to", not
   * "no rows".
   */
  async getLetters(
    unitId: string | undefined,
    params: {
      page?: number;
      limit?: number;
      direction?: LetterDirection;
      status?: LetterStatus;
      search?: string;
      scope?: 'ALL' | 'PERSONAL';
      userId?: string;
      actor: LetterActor;
    }
  ) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    // Every independent restriction is its own AND term. Written as sibling
    // keys, a second `OR` would silently replace the first — the same way the
    // dormitory filter lost its unit scope.
    const and: Prisma.LetterWhereInput[] = [letterScopeWhere(params.actor)];

    if (unitId) and.push({ unitId });

    if (params.search) {
      and.push({
        OR: [
          { subject: { contains: params.search, mode: 'insensitive' } },
          { letterNumber: { contains: params.search, mode: 'insensitive' } },
          { senderName: { contains: params.search, mode: 'insensitive' } },
        ],
      });
    }

    if (params.scope === 'PERSONAL' && params.userId) {
      and.push({
        OR: [
          { recipients: { some: { userId: params.userId } } },
          { dispositions: { some: { recipientId: params.userId } } },
        ],
      });
    }

    const where: Prisma.LetterWhereInput = {
      direction: params.direction ? (params.direction as any) : undefined,
      status: params.status ? (params.status as any) : undefined,
      AND: and,
    };

    const [total, data] = await Promise.all([
      prisma.letter.count({ where }),
      prisma.letter.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          classification: true,
          createdBy: { select: { name: true } },
          reviewers: {
            include: {
              reviewer: { select: { name: true } },
            },
            orderBy: { order: 'asc' },
          },
        },
      }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * `actor` is required, not optional: this route used to return any letter to
   * any authenticated caller. Making the parameter mandatory means a future
   * caller cannot reintroduce the hole by simply forgetting to pass it.
   */
  async getLetterById(id: string, actor: LetterActor) {
    await assertLetterAccess(actor, id);

    return await prisma.letter.findUnique({
      where: { id },
      include: {
        unit: true,
        classification: true,
        createdBy: { select: { name: true } },
        reviewers: {
          include: {
            reviewer: {
              select: {
                name: true,
                teacher: { select: { nip: true } },
                staff: { select: { nip: true } },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        recipients: {
          include: {
            user: { select: { name: true } },
          },
        },
        dispositions: {
          include: {
            sender: { select: { name: true } },
            recipient: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        // Oldest first: this is read as a story, and a story told backwards
        // makes the reader reconstruct the order themselves.
        flowEvents: {
          include: {
            actor: { select: { name: true } },
            target: { select: { name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        /**
         * The signature belongs to the letter, not to the moment it was
         * created. Without it here the QR existed only inside the dialog shown
         * once at signing: close it and the naskah could no longer be printed
         * with anything to scan, which is the whole point of signing it.
         *
         * `signature` and `digest` are not selected — the naskah carries the
         * token, and the proof is checked by the public verify endpoint. The
         * caller has already passed `assertLetterAccess` above, so this adds
         * nothing they could not already read.
         */
        signatures: {
          select: {
            id: true,
            signedAt: true,
            verificationToken: true,
            algorithm: true,
            // A revoked signature must not print as a valid one.
            revokedAt: true,
            signer: {
              select: {
                name: true,
                teacher: { select: { nip: true } },
                staff: { select: { nip: true } },
              },
            },
          },
          orderBy: { signedAt: 'asc' },
        },
      },
    });
  },

  async processReview(
    letterId: string,
    reviewerId: string,
    action: 'APPROVE' | 'REJECT',
    notes?: string,
    nextReviewerId?: string,
    isFinalSigner?: boolean,
    actor?: LetterActor
  ) {
    if (nextReviewerId) {
      await this.validateParticipantEligibility([nextReviewerId], actor);
    }
    const result = await prisma.$transaction(async (tx) => {
      const letter = await tx.letter.findUnique({
        where: { id: letterId },
        select: {
          id: true,
          status: true,
          createdById: true,
          direction: true,
          unitId: true,
          reviewers: true,
          recipients: { select: { userId: true } },
        },
      });
      if (!letter) throw new Error('Letter not found');

      const ladder: ReviewerRung[] = letter.reviewers.map((r) => ({
        id: r.id,
        reviewerId: r.reviewerId,
        order: r.order,
        status: r.status,
        isSigner: r.isSigner,
      }));

      const mine = assertMayReview(letter.status, ladder, reviewerId);

      let updatedLadder: ReviewerRung[] = [...ladder];

      if (action === 'APPROVE') {
        if (nextReviewerId === reviewerId) {
          throw new Error('Tidak dapat meneruskan surat kepada diri sendiri.');
        }

        // Validate that an approval specifies either a nextReviewerId, isFinalSigner, or an existing signer
        const hasExistingSigner = updatedLadder.some((r) => r.isSigner);
        if (!nextReviewerId && !isFinalSigner && !hasExistingSigner) {
          throw new Error('Harus memilih pejabat penerus atau menandai sebagai penandatangan akhir.');
        }

        if (isFinalSigner) {
          // Transactionally ensure exactly one active final signer
          await tx.letterReviewer.updateMany({
            where: { letterId },
            data: { isSigner: false },
          });
          updatedLadder = updatedLadder.map((r) => ({ ...r, isSigner: false }));
        }

        // If approving and nextReviewerId is provided, add or update the next reviewer dynamically
        if (nextReviewerId) {
          const existingNext = letter.reviewers.find((r) => r.reviewerId === nextReviewerId);
          const nonSigners = letter.reviewers.filter((r) => !r.isSigner && r.id !== existingNext?.id);
          const maxNonSignerOrder = Math.max(...nonSigners.map((r) => r.order), mine.order, 0);
          const newNextOrder = maxNonSignerOrder + 1;

          if (existingNext) {
            const updatedIsSigner = isFinalSigner ? true : existingNext.isSigner;
            await tx.letterReviewer.update({
              where: { id: existingNext.id },
              data: {
                order: newNextOrder,
                status: 'PENDING',
                reviewedAt: null,
                isSigner: updatedIsSigner,
              },
            });
            updatedLadder = updatedLadder.map((r) =>
              r.id === existingNext.id
                ? { ...r, order: newNextOrder, status: 'PENDING', isSigner: updatedIsSigner }
                : r
            );
          } else {
            const newRung = await tx.letterReviewer.create({
              data: {
                letterId,
                reviewerId: nextReviewerId,
                order: newNextOrder,
                status: 'PENDING',
                isSigner: !!isFinalSigner,
              },
            });
            updatedLadder.push({
              id: newRung.id,
              reviewerId: nextReviewerId,
              order: newNextOrder,
              status: 'PENDING',
              isSigner: !!isFinalSigner,
            });
          }

          // If nextReviewerId is NOT marked as final signer, move any existing signer to sit AFTER nextReviewerId
          if (!isFinalSigner) {
            const existingSigners = letter.reviewers.filter((r) => r.isSigner && r.id !== existingNext?.id);
            for (const signer of existingSigners) {
              const shiftedOrder = newNextOrder + 1;
              await tx.letterReviewer.update({
                where: { id: signer.id },
                data: { order: shiftedOrder },
              });
              updatedLadder = updatedLadder.map((r) =>
                r.id === signer.id ? { ...r, order: shiftedOrder } : r
              );
            }
          }
        } else if (isFinalSigner) {
          // Mark current reviewer as signer if specified (restoring flag after bulk reset even if previously a signer)
          updatedLadder = updatedLadder.map((r) =>
            r.reviewerId === reviewerId ? { ...r, isSigner: true } : r
          );
          await tx.letterReviewer.update({
            where: { id: mine.id },
            data: { isSigner: true },
          });
        }
      }

      let nextStatus =
        action === 'APPROVE'
          ? statusAfterApproval(updatedLadder, reviewerId)
          : DbLetterStatus.REVISION_NEEDED;

      const reviewFinished = action === 'APPROVE' && !nextRung(updatedLadder.map((r) => r.reviewerId === reviewerId ? { ...r, status: 'APPROVED' } : r));
      const disposedRecipients: string[] = [];

      if (action === 'APPROVE') {
        if (letter.direction === 'INCOMING' && reviewFinished) {
          nextStatus = DbLetterStatus.DISPOSED;

          // When review finishes for an INCOMING letter with recipients, create live Disposition tasks
          if (letter.recipients && letter.recipients.length > 0) {
            const uniqueRecipientIds = Array.from(
              new Set(letter.recipients.map((r) => r.userId).filter(Boolean))
            ) as string[];

            for (const recipientId of uniqueRecipientIds) {
              await tx.disposition.create({
                data: {
                  letterId: letter.id,
                  senderId: reviewerId,
                  recipientId,
                  instruction: 'Surat Masuk Diteruskan',
                  status: 'PENDING',
                },
              });

              await recordFlow(tx, {
                letterId: letter.id,
                actorId: reviewerId,
                action: LetterFlowAction.DISPOSED,
                targetId: recipientId,
                fromStatus: letter.status,
                toStatus: DbLetterStatus.DISPOSED,
                note: 'Surat Masuk Diteruskan',
              });

              disposedRecipients.push(recipientId);
            }
          }
        } else if (nextStatus === DbLetterStatus.SIGNED) {
          // Review approval alone must NEVER set status directly to SIGNED for outgoing letters — signing requires E-Sign passphrase via esign.service.
          nextStatus = DbLetterStatus.READY_TO_SIGN;
        }
      }

      await tx.letterReviewer.update({
        where: { id: mine.id },
        data: {
          status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
          notes,
          reviewedAt: new Date(),
        },
      });

      await tx.letter.update({
        where: { id: letterId },
        data: { status: nextStatus },
      });

      await recordFlow(tx, {
        letterId,
        actorId: reviewerId,
        action:
          action === 'REJECT'
            ? LetterFlowAction.REVISION_REQUESTED
            : nextStatus === DbLetterStatus.SIGNED
              ? LetterFlowAction.SIGNED
              : LetterFlowAction.APPROVED,
        targetId: action === 'REJECT' ? letter.createdById : nextReviewerId || null,
        fromStatus: letter.status,
        toStatus: nextStatus,
        note: notes ? (nextReviewerId ? `${notes} [Diteruskan]` : notes) : (nextReviewerId ? 'Diteruskan ke peninjau berikutnya' : null),
      });

      return {
        success: true,
        signed: nextStatus === DbLetterStatus.SIGNED,
        rejected: action === 'REJECT',
        authorId: letter.createdById,
        status: nextStatus,
        disposedRecipients,
      };
    });

    // A returned draft is only actionable if its author hears about it.
    // Nothing told them before, so REVISION_NEEDED was a silent dead end.
    if (result.rejected) {
      const letter = await prisma.letter.findUnique({
        where: { id: letterId },
        select: { subject: true, unitId: true },
      });
      eventBus.emit('notification:send', {
        userId: result.authorId,
        unitId: letter?.unitId,
        type: 'REMINDER',
        title: 'Surat Dikembalikan untuk Revisi',
        message: `Konsep "${letter?.subject ?? ''}" dikembalikan${
          notes ? `: ${notes}` : '.'
        }`,
        data: { letterId, link: `/e-office/letter/${letterId}` },
      });
    }

    // Post-commit: notify recipients for automatic dispositions created upon incoming review completion
    if (result.disposedRecipients && result.disposedRecipients.length > 0) {
      const letter = await prisma.letter.findUnique({
        where: { id: letterId },
        select: { subject: true, unitId: true },
      });
      for (const recipientId of result.disposedRecipients) {
        eventBus.emit('notification:send', {
          userId: recipientId,
          unitId: letter?.unitId,
          type: 'REMINDER',
          title: 'Disposisi Baru',
          message: `Anda menerima disposisi baru untuk surat "${letter?.subject ?? ''}".`,
          data: { letterId, link: `/e-office/letter/${letterId}` },
        });
      }
    }

    // Post-commit: when a letter is forwarded to a next reviewer, notify that official.
    if (action === 'APPROVE' && nextReviewerId) {
      const letter = await prisma.letter.findUnique({
        where: { id: letterId },
        select: { subject: true, unitId: true },
      });
      eventBus.emit('notification:send', {
        userId: nextReviewerId,
        unitId: letter?.unitId,
        type: 'REMINDER',
        title: 'Konsep Surat Perlu Ditinjau',
        message: `Konsep surat "${letter?.subject ?? ''}" diteruskan kepada Anda untuk ditinjau.`,
        data: { letterId, link: `/e-office/letter/${letterId}` },
      });
    }

    // Post-commit: when a letter has been signed, notify its creator so they can
    // proceed (dispatch/archive). Done outside the transaction so the listener
    // sees the committed SIGNED status.
    if (result.signed) {
      const letter = await prisma.letter.findUnique({
        where: { id: letterId },
        select: { createdById: true, unitId: true, subject: true, letterNumber: true },
      });
      if (letter) {
        eventBus.emit('notification:send', {
          userId: letter.createdById,
          unitId: letter.unitId,
          type: 'INFO',
          title: 'Surat Telah Ditandatangani',
          message: `Surat "${letter.subject}"${
            letter.letterNumber ? ` (${letter.letterNumber})` : ''
          } telah ditandatangani dan siap diproses.`,
          data: { letterId },
        });
      }
    }

    return { success: true };
  },

  /**
   * Submit an existing DRAFT letter into review (PENDING_REVIEW).
   *
   * Only the creator can submit their draft, and only when at least one
   * reviewer is assigned.
   */
  async submitForReview(letterId: string, actor: LetterActor, note?: string) {
    await assertLetterAccess(actor, letterId);

    const result = await prisma.$transaction(async (tx) => {
      const letter = await tx.letter.findUnique({
        where: { id: letterId },
        select: {
          id: true,
          status: true,
          createdById: true,
          direction: true,
          type: true,
          unitId: true,
          letterNumber: true,
          subject: true,
          reviewers: {
            orderBy: { order: 'asc' },
          },
        },
      });
      if (!letter) throw Errors.notFound('Letter not found');

      if (letter.createdById !== actor.id) {
        throw Errors.forbidden('Hanya pembuat surat yang dapat mengajukan konsep untuk ditinjau');
      }

      if (letter.status !== DbLetterStatus.DRAFT) {
        throw Errors.badRequest('Hanya surat berstatus DRAFT yang dapat diajukan untuk ditinjau');
      }

      if (!letter.reviewers || letter.reviewers.length === 0) {
        throw Errors.badRequest('Konsep surat harus memiliki minimal satu pemeriksa sebelum diajukan');
      }

      const nextStatus = DbLetterStatus.PENDING_REVIEW;

      let letterNumber = letter.letterNumber;
      if (letter.direction === 'OUTGOING' && !letterNumber) {
        const activeYear = await tx.academicYear.findFirst({
          where: { isActive: true },
        });
        const academicYearId = activeYear?.id || 'DEFAULT';
        const typeKey = AGENDA_TYPE_CODE[letter.type as DbLetterType] || 'SKET';
        letterNumber = await this.generateNumber(letter.unitId, typeKey, academicYearId);
      }

      await tx.letter.update({
        where: { id: letterId },
        data: {
          status: nextStatus,
          ...(letterNumber ? { letterNumber } : {}),
        },
      });

      await recordFlow(tx, {
        letterId,
        actorId: actor.id,
        action: LetterFlowAction.SUBMITTED,
        fromStatus: DbLetterStatus.DRAFT,
        toStatus: nextStatus,
        note: note || 'Mengajukan konsep surat untuk ditinjau',
      });

      const sortedReviewers = [...letter.reviewers].sort((a, b) => a.order - b.order);
      const firstReviewerId = sortedReviewers[0]?.reviewerId;

      return { id: letterId, status: nextStatus, firstReviewerId, subject: letter.subject };
    });

    // Post-commit: Notify first reviewer when draft is submitted for review
    if (result.firstReviewerId) {
      eventBus.emit('notification:send', {
        userId: result.firstReviewerId,
        type: 'REMINDER',
        title: 'Konsep Surat Perlu Ditinjau',
        message: `Konsep surat "${result.subject}" diajukan kepada Anda untuk ditinjau.`,
        data: { letterId, link: `/e-office/letter/${letterId}` },
      });
    }

    return { id: result.id, status: result.status };
  },

  /**
   * Send a returned draft back up the ladder.
   *
   * This route did not exist. Rejecting a draft set it to REVISION_NEEDED and
   * there it stayed — the author could edit the text but had no way to put it
   * back into review, so every returned letter was abandoned. A rule with no
   * way to satisfy it is not a rule, it is a trap.
   */
  async resubmitLetter(letterId: string, actor: LetterActor, note?: string) {
    await assertLetterAccess(actor, letterId);

    return await prisma.$transaction(async (tx) => {
      const letter = await tx.letter.findUnique({
        where: { id: letterId },
        select: { id: true, status: true, createdById: true, reviewers: true },
      });
      if (!letter) throw new Error('Letter not found');

      assertMayResubmit(letter.status, letter.createdById, actor.id);

      const ladder: ReviewerRung[] = letter.reviewers.map((r) => ({
        id: r.id,
        reviewerId: r.reviewerId,
        order: r.order,
        status: r.status,
        isSigner: r.isSigner,
      }));
      const nextStatus = statusAfterResubmit(ladder);

      // Every paraf is cleared, not only those below the rejector — see the
      // reasoning in letter-workflow.ts. An approval given to the previous
      // text says nothing about the text now being sent.
      await tx.letterReviewer.updateMany({
        where: { letterId },
        data: { status: 'PENDING', reviewedAt: null },
      });

      await tx.letter.update({
        where: { id: letterId },
        data: { status: nextStatus },
      });

      await recordFlow(tx, {
        letterId,
        actorId: actor.id,
        action: LetterFlowAction.RESUBMITTED,
        fromStatus: letter.status,
        toStatus: nextStatus,
        note,
      });

      return { id: letterId, status: nextStatus };
    });
  },

  /**
   * Close a letter's journey.
   *
   * The end of the chain the tata usaha described: the last official to hold
   * the letter files it. Nothing could do this before — an empty
   * `if (status === 'SENT' || 'ARCHIVED') {}` stub sat where the transition
   * belonged, so no letter ever reached ARCHIVED and the disposition chain had
   * no ending.
   */
  async archiveLetter(letterId: string, actor: LetterActor, note?: string) {
    await assertLetterAccess(actor, letterId);

    return await prisma.$transaction(async (tx) => {
      const letter = await tx.letter.findUnique({
        where: { id: letterId },
        select: { id: true, status: true },
      });
      if (!letter) throw new Error('Letter not found');

      assertMayArchive(letter.status);

      // Any disposition still open is closed with the letter. Leaving them
      // PENDING would keep the letter on its recipients' to-do lists forever
      // while the letter itself was filed and done.
      await tx.disposition.updateMany({
        where: { letterId, status: { not: 'COMPLETED' } },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      await tx.letter.update({
        where: { id: letterId },
        data: { status: DbLetterStatus.ARCHIVED },
      });

      await recordFlow(tx, {
        letterId,
        actorId: actor.id,
        action: LetterFlowAction.ARCHIVED,
        fromStatus: letter.status,
        toStatus: DbLetterStatus.ARCHIVED,
        note,
      });

      return { id: letterId, status: DbLetterStatus.ARCHIVED };
    });
  },

  /**
   * Anyone authenticated could previously inject a disposition into any
   * letter's chain — and because a disposition is itself a grant of access,
   * that was also a way to grant yourself the letter.
   */
  async createDisposition(data: CreateDispositionInput, actor: LetterActor) {
    const letter = await assertLetterAccess(actor, data.letterId);

    if (letter.status === DbLetterStatus.ARCHIVED) {
      throw new Error(
        'Surat sudah diarsipkan; buka kembali arsipnya sebelum mendisposisikan.'
      );
    }

    const rawRecipients = data.recipientIds && data.recipientIds.length > 0
      ? data.recipientIds
      : data.recipientId
        ? [data.recipientId]
        : [];

    // Deduplicate recipient IDs to prevent duplicate dispositions for the same person
    const recipients = Array.from(new Set(rawRecipients));

    if (recipients.length === 0) {
      throw new Error('Minimal satu penerima disposisi harus ditentukan.');
    }

    await this.validateParticipantEligibility(recipients, actor);

    const createdDispositions = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const targetRecipientId of recipients) {
        const created = await tx.disposition.create({
          data: {
            letterId: data.letterId,
            senderId: data.senderId,
            recipientId: targetRecipientId,
            instruction: data.instruction,
            deadline: data.deadline ? new Date(data.deadline) : null,
            parentDispositionId: data.parentDispositionId,
            status: 'PENDING',
            notes: data.notes,
          },
        });

        await recordFlow(tx, {
          letterId: letter.id,
          actorId: data.senderId,
          action: LetterFlowAction.DISPOSED,
          targetId: targetRecipientId,
          fromStatus: letter.status,
          toStatus:
            letter.direction === 'INCOMING' ? DbLetterStatus.DISPOSED : letter.status,
          note: data.instruction,
        });

        results.push(created);
      }

      if (
        letter.direction === 'INCOMING' &&
        letter.status !== DbLetterStatus.DISPOSED
      ) {
        await tx.letter.update({
          where: { id: letter.id },
          data: { status: DbLetterStatus.DISPOSED },
        });
      }

      return results;
    });

    // Notify All Recipients
    for (const disp of createdDispositions) {
      eventBus.emit('notification:send', {
        userId: disp.recipientId,
        type: 'REMINDER',
        title: 'Disposisi Baru',
        message: `Anda menerima disposisi baru: "${data.instruction}"`,
        data: {
          entityId: disp.id,
          entityType: 'DISPOSITION',
          letterId: letter.id,
          link: `/e-office/letter/${letter.id}`,
        },
      });
    }

    return createdDispositions;
  },

  async updateDispositionStatus(id: string, status: string, notes?: string, userId?: string) {
    const disposition = await prisma.disposition.findUnique({ where: { id } });
    if (!disposition) throw new Error('Disposition not found');

    if (userId && disposition.recipientId !== userId) {
      throw new Error('Unauthorized access to this disposition');
    }

    const updatedDisposition = await prisma.$transaction(async (tx) => {
      const updated = await tx.disposition.update({
        where: { id },
        data: {
          status,
          // Notes are still concatenated here for the disposition's own
          // summary, but the history below is where each update is kept
          // separately — one text column cannot say when each line was added
          // or by whom, which is the whole question being asked of it.
          notes: notes
            ? disposition.notes
              ? `${disposition.notes}\n\n[UPDATE] ${notes}`
              : notes
            : undefined,
          completedAt: status === 'COMPLETED' ? new Date() : null,
        },
      });

      if (userId) {
        await recordFlow(tx, {
          letterId: disposition.letterId,
          actorId: userId,
          action: LetterFlowAction.DISPOSITION_UPDATED,
          targetId: disposition.senderId,
          note: notes ? `[${status}] ${notes}` : `[${status}]`,
        });
      }

      return updated;
    });

    // Notify Sender if Completed
    if (status === 'COMPLETED' && disposition.senderId) {
      eventBus.emit('notification:send', {
        userId: disposition.senderId,
        type: 'INFO',
        title: 'Disposisi Selesai',
        message: `Disposisi "${disposition.instruction}" telah diselesaikan.`,
        data: {
          entityId: disposition.id,
          entityType: 'DISPOSITION',
          letterId: disposition.letterId,
          link: `/e-office/letter/${disposition.letterId}`,
        },
      });
    }

    return updatedDisposition;
  },

  /**
   * Search / list eligible correspondence participants (teachers, staff, foundation officers)
   * accessible to authenticated E-Office participants.
   */
  async getParticipants(
    params: { search?: string; unitId?: string; limit?: number },
    actor?: LetterActor
  ) {
    if (!actor || !actor.roleCode) {
      throw Errors.forbidden('Anda tidak memiliki akses ke direktori persuratan');
    }

    // Deny external roles (students, parents, alumni, komite)
    if ((EXCLUDED_CORRESPONDENCE_ROLES as readonly string[]).includes(actor.roleCode)) {
      throw Errors.forbidden('Anda tidak memiliki akses ke direktori persuratan');
    }

    const limit = Math.min(params.limit || 100, 200);
    const now = new Date();

    // Derive unit scope according to seesAllUnits policy:
    // Cross-unit personnel and foundation roles can see participants across units or specify query.unitId.
    // Unit-pinned roles are restricted to their assigned unitId regardless of query.unitId.
    const actorSeesAll = actor ? seesAllUnits(actor) : true;
    const effectiveUnitId = actorSeesAll ? params.unitId : (actor?.unitId ?? params.unitId);

    const where: Prisma.UserWhereInput = {
      isActive: true,
      // Candidates must have a teacher or staff record, or an active non-external role assignment
      OR: [
        { teacher: { isNot: null } },
        { staff: { isNot: null } },
        {
          userRoles: {
            some: {
              role: {
                code: {
                  notIn: EXCLUDED_CORRESPONDENCE_ROLES as unknown as RoleCode[],
                },
              },
              OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
            },
          },
        },
      ],
    };

    const and: Prisma.UserWhereInput[] = [];

    if (effectiveUnitId) {
      and.push({
        OR: [{ unitId: effectiveUnitId }, { unitId: null }],
      });
    }

    if (params.search) {
      and.push({
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          { email: { contains: params.search, mode: 'insensitive' } },
        ],
      });
    }

    if (and.length > 0) {
      where.AND = and;
    }

    const users = await prisma.user.findMany({
      where,
      take: limit,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        unitId: true,
        unit: { select: { name: true } },
        teacher: { select: { nip: true } },
        staff: { select: { nip: true, position: true } },
        userRoles: {
          select: { role: { select: { code: true } } },
          orderBy: [{ isPrimary: 'desc' }],
          take: 1,
        },
      },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      unitId: u.unitId,
      unitName: u.unit?.name ?? null,
      roleCode: u.userRoles[0]?.role?.code ?? null,
      nip: u.teacher?.nip || u.staff?.nip || null,
      position: u.staff?.position || null,
    }));
  },

  /** `unitId` undefined = foundation-wide totals (see getLetters). */
  async getDashboardStats(unitId?: string) {
    // The counts below rely on Prisma reading an `undefined` field as "no
    // filter". The raw chart query has no such affordance, so it branches.
    // Type definition for Raw SQL Result
    type ChartDataRow = {
      month_key: string;
      direction: string;
      count: number;
    };

    const [totalIncoming, totalOutgoing, pendingReview, needsAction, urgentLetters, chartDataRaw] =
      await Promise.all([
        // Total Incoming
        prisma.letter.count({ where: { unitId, direction: 'INCOMING' } }),
        // Total Outgoing
        prisma.letter.count({ where: { unitId, direction: 'OUTGOING' } }),
        // Pending Review
        prisma.letter.count({ where: { unitId, status: 'PENDING_REVIEW' } }),
        // Needs Action
        prisma.letter.count({
          where: {
            unitId,
            status: { in: ['DRAFT', 'PENDING_REVIEW', 'REVISION_NEEDED'] },
          },
        }),
        // Urgent letters still in flight (not yet archived/disposed)
        prisma.letter.count({
          where: {
            unitId,
            urgency: { in: ['IMMEDIATE', 'URGENT'] },
            status: { notIn: ['ARCHIVED', 'DISPOSED'] },
          },
        }),
        // Chart Data (Last 6 Months). `unit_id = NULL` never matches, so a
        // foundation caller needs the predicate dropped, not parameterised.
        prisma.$queryRaw<ChartDataRow[]>`
        SELECT
          TO_CHAR(date, 'YYYY-MM') as month_key,
          direction,
          COUNT(*)::int as count
        FROM letters
        WHERE (${unitId ?? null}::text IS NULL OR unit_id = ${unitId ?? null})
          AND date >= NOW() - INTERVAL '6 months'
        GROUP BY 1, 2
        ORDER BY 1 ASC
      `,
      ]);

    // Process Chart Data
    const chartMap = new Map<string, { name: string; incoming: number; outgoing: number }>();
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ];

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1); // Prevent month skipping on 31st
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7); // YYYY-MM
      const monthLabel = monthNames[d.getMonth()];
      chartMap.set(key, { name: monthLabel, incoming: 0, outgoing: 0 });
    }

    (chartDataRaw as ChartDataRow[]).forEach((row) => {
      if (chartMap.has(row.month_key)) {
        const entry = chartMap.get(row.month_key)!;
        if (row.direction === 'INCOMING') entry.incoming = row.count;
        if (row.direction === 'OUTGOING') entry.outgoing = row.count;
      }
    });

    return {
      counts: {
        totalIncoming,
        totalOutgoing,
        pendingReview,
        needsAction,
        urgentLetters,
      },
      chart: Array.from(chartMap.values()),
    };
  },

  /**
   * Public verification for signed letters via token and optional uploaded PDF buffer
   */
  async verifyPublicLetter(token: string, pdfBuffer?: Buffer | null) {
    const res = await verifyLetterByToken(token, pdfBuffer);
    if (!res.found) {
      return {
        isValid: false,
        reason: 'Token verifikasi surat tidak ditemukan atau tidak valid.',
      };
    }

    return {
      isValid: res.isValid,
      pdfVerified: res.pdfVerified,
      pdfMatch: res.pdfMatch,
      isRevoked: res.isRevoked,
      revokedAt: res.revokedAt,
      signedAt: res.signedAt,
      algorithm: res.algorithm,
      digest: res.digest,
      signer: res.signer,
      letter: res.letter,
      reason: res.reason,
    };
  },
};
