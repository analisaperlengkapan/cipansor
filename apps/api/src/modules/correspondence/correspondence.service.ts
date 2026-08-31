import {
  PrismaClient,
  Prisma,
  LetterFlowAction,
  LetterStatus as DbLetterStatus,
  LetterType as DbLetterType,
  LetterNature as DbLetterNature,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  CreateLetterInput,
  CreateDispositionInput,
  LetterDirection,
  LetterStatus,
  UpdateLetterInput,
} from '@cipansor/shared';
import { eventBus } from '@/lib/event-bus';
import { EsignService } from '@/modules/esign/esign.service';
import {
  assertLetterAccess,
  letterScopeWhere,
  type LetterActor,
} from '@/utils/letter-access';
import {
  assertMayArchive,
  assertMayResubmit,
  assertMayReview,
  statusAfterApproval,
  statusAfterResubmit,
  type ReviewerRung,
} from '@/utils/letter-workflow';
import { AGENDA_TYPE_CODE, assertNatureAllowed } from '@/utils/letter-naskah';

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

  async createLetter(data: CreateLetterInput, userId: string) {
    // Jenis naskah menentukan sifat mana yang sah dan buku nomor mana yang
    // dipakai. Divalidasi sebelum apa pun ditulis: menolak setelah nomor
    // agenda terlanjur naik akan meninggalkan lubang di buku agenda.
    const type = (data.type as DbLetterType | undefined) ?? DbLetterType.SURAT_DINAS;
    assertNatureAllowed(type, data.nature as unknown as DbLetterNature);

    // Get active academic year
    const activeYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    });
    const academicYearId = activeYear?.id || 'DEFAULT';

    // Generate number if missing
    let agendaNumber = data.agendaNumber;
    let letterNumber = data.letterNumber;

    if (data.direction === 'INCOMING' && !agendaNumber) {
      agendaNumber = await this.generateNumber(data.unitId, 'INCOMING', academicYearId);
    } else if (data.direction === 'OUTGOING' && !letterNumber) {
      // Typically only generated when status is READY or SIGNED, but we'll allow draft numbering if needed
      // Or just leave it empty for DRAFT
      if (data.status !== 'DRAFT') {
        // Per jenis, not one shared counter: on paper an SK has its own agenda
        // book, and sharing a counter would make SK numbers skip every time an
        // ordinary letter went out.
        letterNumber = await this.generateNumber(
          data.unitId,
          AGENDA_TYPE_CODE[type],
          academicYearId
        );
      }
    }

    return await prisma.$transaction(async (tx) => {
      // Create Letter
      const letter = await tx.letter.create({
        data: {
          unitId: data.unitId,
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
          status: data.status as any,
          senderName: data.senderName,
          senderTitle: data.senderTitle,
          senderInstance: data.senderInstance,
          recipientName: data.recipientName,
          recipientInstance: data.recipientInstance,
          createdById: userId,
        },
      });

      // Add Reviewers
      if (data.reviewerIds && data.reviewerIds.length > 0) {
        await tx.letterReviewer.createMany({
          data: data.reviewerIds.map((reviewerId, index) => ({
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
        await tx.letterRecipient.createMany({
          data: data.recipientIds.map((recipientId) => ({
            letterId: letter.id,
            userId: recipientId,
            unitId: data.unitId,
            isCC: false,
          })),
        });
      }

      await recordFlow(tx, {
        letterId: letter.id,
        actorId: userId,
        action: LetterFlowAction.CREATED,
        toStatus: letter.status,
        note: letter.subject,
      });

      // A draft that is created straight into review has been submitted, and
      // saying so keeps the history readable: otherwise the first approval
      // appears with nothing before it explaining why anyone was reviewing.
      if (letter.status !== DbLetterStatus.DRAFT && data.reviewerIds?.length) {
        await recordFlow(tx, {
          letterId: letter.id,
          actorId: userId,
          action: LetterFlowAction.SUBMITTED,
          toStatus: letter.status,
        });
      }

      return letter;
    });
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
    isFinalSigner?: boolean
  ) {
    const result = await prisma.$transaction(async (tx) => {
      const letter = await tx.letter.findUnique({
        where: { id: letterId },
        select: { id: true, status: true, createdById: true, reviewers: true },
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
          const currentMaxOrder = Math.max(...letter.reviewers.map((r) => r.order), mine.order, 0);
          const newOrder = currentMaxOrder + 1;
          const existingNext = letter.reviewers.find((r) => r.reviewerId === nextReviewerId);

          if (existingNext) {
            const updatedIsSigner = isFinalSigner ? true : existingNext.isSigner;
            // If already in ladder, reset status to PENDING, clear reviewedAt, move order to end of sequence, and preserve/update isSigner
            await tx.letterReviewer.update({
              where: { id: existingNext.id },
              data: {
                order: newOrder,
                status: 'PENDING',
                reviewedAt: null,
                isSigner: updatedIsSigner,
              },
            });
            updatedLadder = updatedLadder.map((r) =>
              r.id === existingNext.id
                ? { ...r, order: newOrder, status: 'PENDING', isSigner: updatedIsSigner }
                : r
            );
          } else {
            const newRung = await tx.letterReviewer.create({
              data: {
                letterId,
                reviewerId: nextReviewerId,
                order: newOrder,
                status: 'PENDING',
                isSigner: !!isFinalSigner,
              },
            });
            updatedLadder.push({
              id: newRung.id,
              reviewerId: nextReviewerId,
              order: newOrder,
              status: 'PENDING',
              isSigner: !!isFinalSigner,
            });
          }
        } else if (isFinalSigner && !mine.isSigner) {
          // Mark current reviewer as signer if specified
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

      // Review approval alone must NEVER set status directly to SIGNED — signing requires E-Sign passphrase via esign.service.
      if (action === 'APPROVE' && nextStatus === DbLetterStatus.SIGNED) {
        nextStatus = DbLetterStatus.READY_TO_SIGN;
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
   * Public verification for signed letters via token
   */
  async verifyPublicLetter(token: string) {
    const res = await EsignService.verifyByToken(token);
    if (!res.found) {
      return {
        isValid: false,
        reason: 'Token verifikasi surat tidak ditemukan atau tidak valid.',
      };
    }

    return {
      isValid: res.isValid,
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
