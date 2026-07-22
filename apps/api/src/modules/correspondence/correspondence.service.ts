import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  CreateLetterInput,
  CreateDispositionInput,
  LetterDirection,
  LetterStatus,
  UpdateLetterInput,
} from '@cipansor/shared';
import { eventBus } from '@/lib/event-bus';
import {
  assertLetterAccess,
  letterScopeWhere,
  type LetterActor,
} from '@/utils/letter-access';

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
          format: '[NO]/[TYPE]/[ROMAN]/[YEAR]', // Default format
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
        letterNumber = await this.generateNumber(data.unitId, 'OUTGOING', academicYearId);
      }
    }

    return await prisma.$transaction(async (tx) => {
      // Create Letter
      const letter = await tx.letter.create({
        data: {
          unitId: data.unitId,
          direction: data.direction as any, // Enum mapping might need care
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
            isSigner: index === data.reviewerIds!.length - 1, // Last one is signer
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
      },
    });
  },

  async processReview(
    letterId: string,
    reviewerId: string,
    action: 'APPROVE' | 'REJECT',
    notes?: string
  ) {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Reviewer Status
      const review = await tx.letterReviewer.findUnique({
        where: {
          letterId_reviewerId: {
            letterId,
            reviewerId,
          },
        },
      });

      if (!review) throw new Error('Reviewer not assigned to this letter');

      const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      await tx.letterReviewer.update({
        where: { id: review.id },
        data: {
          status,
          notes,
          reviewedAt: new Date(),
        },
      });

      // 2. Check Workflow Logic
      let signed = false;
      if (action === 'REJECT') {
        // If rejected, set letter to Revision Needed
        await tx.letter.update({
          where: { id: letterId },
          data: { status: 'REVISION_NEEDED' as any },
        });
      } else if (review.isSigner) {
        // If signer approves, the letter is signed.
        await tx.letter.update({
          where: { id: letterId },
          data: { status: 'SIGNED' as any },
        });
        signed = true;
      }

      return { success: true, signed };
    });

    // Post-commit: when a letter has been signed, notify its creator so they can
    // proceed (dispatch/archive). Done outside the transaction so the listener
    // sees the committed SIGNED status.
    if (result.signed) {
      const letter = await prisma.letter.findUnique({
        where: { id: letterId },
        select: { createdById: true, unitId: true, subject: true, letterNumber: true },
      });
      if (letter) {
        const { eventBus } = await import('@/lib/event-bus');
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
   * Anyone authenticated could previously inject a disposition into any
   * letter's chain — and because a disposition is itself a grant of access,
   * that was also a way to grant yourself the letter.
   */
  async createDisposition(data: CreateDispositionInput, actor: LetterActor) {
    const letter = await assertLetterAccess(actor, data.letterId);

    const disposition = await prisma.disposition.create({
      data: {
        letterId: data.letterId,
        senderId: data.senderId,
        recipientId: data.recipientId,
        instruction: data.instruction,
        deadline: data.deadline ? new Date(data.deadline) : null,
        parentDispositionId: data.parentDispositionId,
        status: 'PENDING',
        notes: data.notes,
      },
    });

    // NOTE: an empty `if (letter.status === 'SENT' || 'ARCHIVED') {}` stub sat
    // here, so a letter's status never advanced to DISPOSED and the last
    // recipient had no way to close the chain. Removed rather than left
    // looking implemented; the status transitions arrive with the disposition
    // workflow rework, which needs the flow-history table to be meaningful.

    // Notify Recipient
    eventBus.emit('notification:send', {
      userId: data.recipientId,
      type: 'REMINDER',
      title: 'Disposisi Baru',
      message: `Anda menerima disposisi baru: "${data.instruction}"`,
      data: {
        entityId: disposition.id,
        entityType: 'DISPOSITION',
        letterId: letter.id,
        link: `/e-office/letter/${letter.id}`,
      },
    });

    return disposition;
  },

  async updateDispositionStatus(id: string, status: string, notes?: string, userId?: string) {
    const disposition = await prisma.disposition.findUnique({ where: { id } });
    if (!disposition) throw new Error('Disposition not found');

    if (userId && disposition.recipientId !== userId) {
      throw new Error('Unauthorized access to this disposition');
    }

    const updatedDisposition = await prisma.disposition.update({
      where: { id },
      data: {
        status,
        notes: notes
          ? disposition.notes
            ? `${disposition.notes}\n\n[UPDATE] ${notes}`
            : notes
          : undefined,
        completedAt: status === 'COMPLETED' ? new Date() : null,
      },
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
};
