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

  async getLetters(
    unitId: string,
    params: {
      page?: number;
      limit?: number;
      direction?: LetterDirection;
      status?: LetterStatus;
      search?: string;
      scope?: 'ALL' | 'PERSONAL';
      userId?: string;
    }
  ) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.LetterWhereInput = {
      unitId,
      direction: params.direction ? (params.direction as any) : undefined,
      status: params.status ? (params.status as any) : undefined,
      OR: params.search
        ? [
            { subject: { contains: params.search, mode: 'insensitive' } },
            { letterNumber: { contains: params.search, mode: 'insensitive' } },
            { senderName: { contains: params.search, mode: 'insensitive' } },
          ]
        : undefined,
    };

    if (params.scope === 'PERSONAL' && params.userId) {
      where.AND = [
        {
          OR: [
            { recipients: { some: { userId: params.userId } } },
            { dispositions: { some: { recipientId: params.userId } } },
          ],
        },
      ];
    }

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

  async getLetterById(id: string) {
    return await prisma.letter.findUnique({
      where: { id },
      include: {
        classification: true,
        createdBy: { select: { name: true } },
        reviewers: {
          include: {
            reviewer: { select: { name: true } },
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
    return await prisma.$transaction(async (tx) => {
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
      if (action === 'REJECT') {
        // If rejected, set letter to Revision Needed
        await tx.letter.update({
          where: { id: letterId },
          data: { status: 'REVISION_NEEDED' as any },
        });
      } else if (review.isSigner) {
        // If signer approves, set letter to Signed
        await tx.letter.update({
          where: { id: letterId },
          data: { status: 'SIGNED' as any },
        });
        // TODO: Trigger Digital Signature here
      }

      return { success: true };
    });
  },

  async createDisposition(data: CreateDispositionInput) {
    // Check if letter exists
    const letter = await prisma.letter.findUnique({
      where: { id: data.letterId },
    });
    if (!letter) throw new Error('Letter not found');

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

    // Update letter status if it was just received
    if (letter.status === 'SENT' || letter.status === 'ARCHIVED') {
        // logic to mark letter as 'DISPOSED' or 'IN_PROGRESS' if needed
    }

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
        link: `/e-office/letter/${letter.id}`
      }
    });

    return disposition;
  },

  async updateDispositionStatus(
    id: string,
    status: string,
    notes?: string,
    userId?: string
  ) {
    const disposition = await prisma.disposition.findUnique({ where: { id } });
    if (!disposition) throw new Error('Disposition not found');

    if (userId && disposition.recipientId !== userId) {
      throw new Error('Unauthorized access to this disposition');
    }

    return await prisma.disposition.update({
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
          link: `/e-office/letter/${disposition.letterId}`
        }
      });
    }

    return result;
  },
};
