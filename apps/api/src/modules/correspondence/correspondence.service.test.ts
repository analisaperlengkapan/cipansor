import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../lib/prisma';
import { CorrespondenceService } from './correspondence.service';

// Shared event-bus spy. reviewLetter dispatches via a dynamic import('@/lib/event-bus'),
// so mock both the relative and aliased specifiers with the same spy.
const { emitMock } = vi.hoisted(() => ({ emitMock: vi.fn() }));

// Mock external dependencies
vi.mock('../../lib/prisma', () => ({
  prisma: {
    letter: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    letterReviewer: {
      createMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    letterRecipient: {
      createMany: vi.fn(),
    },
    disposition: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    // The append-only history table. The transaction handle is the same mocked
    // client (see $transaction below), so recordFlow's writes land here.
    letterFlowEvent: {
      create: vi.fn(),
    },
    academicYear: {
      findFirst: vi.fn(),
    },
    agendaNumber: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $executeRaw: vi.fn().mockResolvedValue(1),
    $transaction: vi.fn((callback) => callback(prisma)),
    $queryRaw: vi.fn(),
  },
}));

vi.mock('../../lib/event-bus', () => ({ eventBus: { emit: emitMock } }));
vi.mock('@/lib/event-bus', () => ({ eventBus: { emit: emitMock } }));

describe('Correspondence Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Letters', () => {
    it('should create an incoming letter with auto-numbered agenda', async () => {
      vi.mocked(prisma.academicYear.findFirst).mockResolvedValue({ id: 'year-1' } as any);
      vi.mocked(prisma.agendaNumber.findUnique).mockResolvedValue({
        id: 'agenda-1',
        format: '[NO]/[TYPE]/[ROMAN]/[YEAR]',
      } as any);
      vi.mocked(prisma.agendaNumber.update).mockResolvedValue({ lastNumber: 1 } as any);

      const dto = {
        unitId: 'unit-1',
        direction: 'INCOMING' as any,
        date: new Date().toISOString(),
        subject: 'Undangan Rapat',
        status: 'DRAFT' as any,
        nature: 'PUBLIC' as any,
        classificationId: 'class-1',
        senderName: 'Diknas',
      };

      vi.mocked(prisma.letter.create).mockResolvedValue({ id: 'letter-1' } as any);

      await CorrespondenceService.createLetter(dto as any, { id: 'user-1', roleCode: 'SUPER_ADMIN', unitId: 'unit-1' });

      // Uses transaction
      expect(prisma.letter.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          direction: 'INCOMING',
          subject: 'Undangan Rapat',
          agendaNumber: expect.stringContaining('INCOMING'), // generated number
        }),
      });
    });

    it('should query letters with pagination and scope', async () => {
      vi.mocked(prisma.letter.count).mockResolvedValue(20);
      vi.mocked(prisma.letter.findMany).mockResolvedValue([{ id: 'letter-1' }] as any);

      const result = await CorrespondenceService.getLetters('unit-1', {
        page: 2,
        limit: 10,
        scope: 'PERSONAL',
        userId: 'user-1',
        actor: { id: 'user-1', roleCode: 'SUPER_ADMIN', unitId: null },
      });

      expect(prisma.letter.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          AND: expect.any(Array), // The PERSONAL scope condition
        }),
        skip: 10,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });

      expect(result.meta.totalPages).toBe(2);
      expect(result.data.length).toBe(1);
    });
  });

  describe('Review Process', () => {
    // A two-rung ladder: the sekretaris parafs (order 1), then the ketua signs
    // (order 2). Tiering is enforced now, so the whole ladder is what the
    // service reads — not just the caller's own row as before.
    const ladder = (overrides: Record<string, string> = {}) => [
      {
        id: 'rev-sekretaris',
        reviewerId: 'sekretaris',
        order: 1,
        status: overrides.sekretaris ?? 'PENDING',
        isSigner: false,
      },
      {
        id: 'rev-ketua',
        reviewerId: 'ketua',
        order: 2,
        status: overrides.ketua ?? 'PENDING',
        isSigner: true,
      },
    ];

    it('leaves the letter in READY_TO_SIGN when the signer approves, waiting for esign signature', async () => {
      // Sekretaris has already parafed; only the signer is left.
      vi.mocked(prisma.letter.findUnique).mockResolvedValue({
        id: 'letter-1',
        status: 'READY_TO_SIGN',
        createdById: 'creator-1',
        reviewers: ladder({ sekretaris: 'APPROVED' }),
        unitId: 'unit-1',
        subject: 'Undangan Rapat',
        letterNumber: '001/X/2026',
      } as any);
      vi.mocked(prisma.letterReviewer.update).mockResolvedValue({} as any);
      vi.mocked(prisma.letter.update).mockResolvedValue({} as any);

      await CorrespondenceService.processReview('letter-1', 'ketua', 'APPROVE');

      expect(prisma.letterReviewer.update).toHaveBeenCalledWith({
        where: { id: 'rev-ketua' },
        data: expect.objectContaining({ status: 'APPROVED' }),
      });
      expect(prisma.letter.update).toHaveBeenCalledWith({
        where: { id: 'letter-1' },
        data: { status: 'READY_TO_SIGN' },
      });
    });

    // The gap the tiering closes: the signer cannot sign ahead of the rung
    // below. Previously processReview acted on whoever called it.
    it('refuses to let the signer sign before the sekretaris has parafed', async () => {
      vi.mocked(prisma.letter.findUnique).mockResolvedValue({
        id: 'letter-1',
        status: 'PENDING_REVIEW',
        createdById: 'creator-1',
        reviewers: ladder(),
      } as any);

      await expect(
        CorrespondenceService.processReview('letter-1', 'ketua', 'APPROVE')
      ).rejects.toThrow(/Belum giliran/);

      expect(prisma.letter.update).not.toHaveBeenCalled();
    });

    it('advances to the next rung rather than signing when a non-signer approves', async () => {
      vi.mocked(prisma.letter.findUnique).mockResolvedValue({
        id: 'letter-1',
        status: 'PENDING_REVIEW',
        createdById: 'creator-1',
        reviewers: ladder(),
      } as any);
      vi.mocked(prisma.letterReviewer.update).mockResolvedValue({} as any);
      vi.mocked(prisma.letter.update).mockResolvedValue({} as any);

      await CorrespondenceService.processReview('letter-1', 'sekretaris', 'APPROVE');

      expect(prisma.letter.update).toHaveBeenCalledWith({
        where: { id: 'letter-1' },
        data: { status: 'READY_TO_SIGN' },
      });
    });


    it('returns a rejected draft to REVISION_NEEDED and notifies its author', async () => {
      vi.mocked(prisma.letter.findUnique).mockResolvedValue({
        id: 'letter-1',
        status: 'PENDING_REVIEW',
        createdById: 'creator-1',
        unitId: 'unit-1',
        subject: 'Undangan Rapat',
        reviewers: ladder(),
      } as any);
      vi.mocked(prisma.letterReviewer.update).mockResolvedValue({} as any);
      vi.mocked(prisma.letter.update).mockResolvedValue({} as any);

      await CorrespondenceService.processReview(
        'letter-1',
        'sekretaris',
        'REJECT',
        'Salah tanggal'
      );

      expect(prisma.letter.update).toHaveBeenCalledWith({
        where: { id: 'letter-1' },
        data: { status: 'REVISION_NEEDED' },
      });
      // The dead end this closes: the author was never told a draft came back.
      expect(emitMock).toHaveBeenCalledWith(
        'notification:send',
        expect.objectContaining({
          userId: 'creator-1',
          title: 'Surat Dikembalikan untuk Revisi',
        })
      );
    });
  });

  describe('Resubmit and archive', () => {
    // assertLetterAccess reads the letter; a SUPER_ADMIN actor sees all units,
    // so this row is enough to pass the access check and drive the workflow.
    const accessRow = (over: Record<string, unknown>) => ({
      id: 'letter-1',
      unitId: 'unit-1',
      createdById: 'creator-1',
      status: 'DRAFT',
      direction: 'OUTGOING',
      reviewers: [],
      recipients: [],
      dispositions: [],
      ...over,
    });
    const admin = { id: 'creator-1', roleCode: 'SUPER_ADMIN', unitId: null };

    it('clears every paraf when a returned draft is resubmitted', async () => {
      vi.mocked(prisma.letter.findUnique).mockResolvedValue(
        accessRow({
          status: 'REVISION_NEEDED',
          reviewers: [
            { id: 'r1', reviewerId: 'sekretaris', order: 1, status: 'APPROVED', isSigner: false },
            { id: 'r2', reviewerId: 'ketua', order: 2, status: 'PENDING', isSigner: true },
          ],
        }) as any
      );
      vi.mocked(prisma.letterReviewer.updateMany).mockResolvedValue({ count: 2 } as any);
      vi.mocked(prisma.letter.update).mockResolvedValue({} as any);

      const result = await CorrespondenceService.resubmitLetter('letter-1', admin);

      // Every approval is reset, not only those below the rejector: a paraf
      // approves a specific text, and the text has changed.
      expect(prisma.letterReviewer.updateMany).toHaveBeenCalledWith({
        where: { letterId: 'letter-1' },
        data: { status: 'PENDING', reviewedAt: null },
      });
      expect(result.status).toBe('PENDING_REVIEW');
    });

    it('refuses to resubmit anything that was not returned for revision', async () => {
      vi.mocked(prisma.letter.findUnique).mockResolvedValue(
        accessRow({ status: 'PENDING_REVIEW' }) as any
      );
      await expect(
        CorrespondenceService.resubmitLetter('letter-1', admin)
      ).rejects.toThrow(/dikembalikan untuk revisi/);
    });

    it('archives a disposed letter and closes any open dispositions', async () => {
      vi.mocked(prisma.letter.findUnique).mockResolvedValue(
        accessRow({ status: 'DISPOSED', direction: 'INCOMING' }) as any
      );
      vi.mocked(prisma.disposition.updateMany).mockResolvedValue({ count: 1 } as any);
      vi.mocked(prisma.letter.update).mockResolvedValue({} as any);

      const result = await CorrespondenceService.archiveLetter('letter-1', admin);

      expect(prisma.disposition.updateMany).toHaveBeenCalledWith({
        where: { letterId: 'letter-1', status: { not: 'COMPLETED' } },
        data: expect.objectContaining({ status: 'COMPLETED' }),
      });
      expect(result.status).toBe('ARCHIVED');
    });

    it('refuses to archive a letter twice', async () => {
      vi.mocked(prisma.letter.findUnique).mockResolvedValue(
        accessRow({ status: 'ARCHIVED' }) as any
      );
      await expect(
        CorrespondenceService.archiveLetter('letter-1', admin)
      ).rejects.toThrow(/sudah diarsipkan/);
    });
  });

  describe('Dispositions', () => {
    it('creates a disposition, advances an incoming letter to DISPOSED, and notifies', async () => {
      // assertLetterAccess reads this first; the SUPER_ADMIN actor sees all
      // units so the identifying row is enough. `direction` decides whether
      // the letter's status advances — only incoming letters are disposed.
      vi.mocked(prisma.letter.findUnique).mockResolvedValue({
        id: 'letter-1',
        unitId: 'unit-1',
        createdById: 'creator-1',
        status: 'SIGNED',
        direction: 'INCOMING',
        reviewers: [],
        recipients: [],
        dispositions: [],
      } as any);
      vi.mocked(prisma.disposition.create).mockResolvedValue({ id: 'disp-1' } as any);
      vi.mocked(prisma.letter.update).mockResolvedValue({} as any);

      await CorrespondenceService.createDisposition(
        {
          letterId: 'letter-1',
          senderId: 'user-1',
          recipientId: 'user-2',
          instruction: 'Tolong hadiri',
        },
        { id: 'user-1', roleCode: 'SUPER_ADMIN', unitId: null }
      );

      expect(prisma.disposition.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          instruction: 'Tolong hadiri',
          recipientId: 'user-2',
        }),
      });
      // The transition an empty stub used to stand in for.
      expect(prisma.letter.update).toHaveBeenCalledWith({
        where: { id: 'letter-1' },
        data: { status: 'DISPOSED' },
      });
      expect(prisma.letterFlowEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'DISPOSED',
          targetId: 'user-2',
        }),
      });
    });

    it('refuses to dispose a letter that is already archived', async () => {
      vi.mocked(prisma.letter.findUnique).mockResolvedValue({
        id: 'letter-1',
        unitId: 'unit-1',
        createdById: 'creator-1',
        status: 'ARCHIVED',
        direction: 'INCOMING',
        reviewers: [],
        recipients: [],
        dispositions: [],
      } as any);

      await expect(
        CorrespondenceService.createDisposition(
          {
            letterId: 'letter-1',
            senderId: 'user-1',
            recipientId: 'user-2',
            instruction: 'Tolong hadiri',
          },
          { id: 'user-1', roleCode: 'SUPER_ADMIN', unitId: null }
        )
      ).rejects.toThrow(/sudah diarsipkan/);
    });

    it('updates disposition status and records it in the history', async () => {
      vi.mocked(prisma.disposition.findUnique).mockResolvedValue({
        id: 'disp-1',
        letterId: 'letter-1',
        recipientId: 'user-2',
        senderId: 'user-1',
        instruction: 'Hadir',
      } as any);
      vi.mocked(prisma.disposition.update).mockResolvedValue({} as any);

      await CorrespondenceService.updateDispositionStatus('disp-1', 'COMPLETED', 'Sudah hadir', 'user-2');

      expect(prisma.disposition.update).toHaveBeenCalledWith({
        where: { id: 'disp-1' },
        data: expect.objectContaining({
          status: 'COMPLETED',
          completedAt: expect.any(Date),
        }),
      });
      expect(prisma.letterFlowEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'DISPOSITION_UPDATED',
          letterId: 'letter-1',
        }),
      });
    });
  });

  /**
   * The QR on a printed letter is the whole point of signing it electronically,
   * and the naskah can only carry one if the letter itself reports its
   * signature. Before this, `getLetterById` did not select `signatures` at all,
   * so the QR existed only inside the dialog shown once at signing: close it
   * and a signed letter downloaded identical to an unsigned one.
   */
  describe('getLetterById — the signature travels with the letter', () => {
    const identifyingRow = {
      id: 'letter-1',
      unitId: 'unit-1',
      createdById: 'creator-1',
      status: 'SIGNED',
      reviewers: [],
      recipients: [],
      dispositions: [],
    };

    it('selects the signature so the naskah can print its QR', async () => {
      vi.mocked(prisma.letter.findUnique).mockResolvedValue(identifyingRow as any);

      await CorrespondenceService.getLetterById('letter-1', {
        userId: 'u1',
        roleCode: 'SUPER_ADMIN',
        unitId: null,
      } as any);

      // The second call is the detail read; the first is assertLetterAccess.
      const detailCall = vi.mocked(prisma.letter.findUnique).mock.calls.at(-1)![0] as any;
      expect(detailCall.include.signatures).toBeDefined();
      const select = detailCall.include.signatures.select;
      expect(select.verificationToken).toBe(true);
      expect(select.signedAt).toBe(true);
      // A revoked signature must not be printed as a valid one, so the naskah
      // has to be able to tell.
      expect(select.revokedAt).toBe(true);
    });

    it('does not ship the raw signature or digest to every reader', async () => {
      vi.mocked(prisma.letter.findUnique).mockResolvedValue(identifyingRow as any);

      await CorrespondenceService.getLetterById('letter-1', {
        userId: 'u1',
        roleCode: 'SUPER_ADMIN',
        unitId: null,
      } as any);

      const detailCall = vi.mocked(prisma.letter.findUnique).mock.calls.at(-1)![0] as any;
      const select = detailCall.include.signatures.select;
      // The proof is checked server-side by GET /esign/verify/:token. Putting
      // the cryptographic material on every screen that opens the letter buys
      // nothing and widens what a leaked response discloses.
      expect(select.signature).toBeUndefined();
      expect(select.digest).toBeUndefined();
      expect(select.publicKey).toBeUndefined();
    });
  });
});
