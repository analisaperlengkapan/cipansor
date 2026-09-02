import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CorrespondenceService } from '../../../../src/modules/correspondence/correspondence.service';
import { prisma } from '../../../../src/lib/prisma';

// Mock dependencies
vi.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    agendaNumber: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    letter: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
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
      updateMany: vi.fn(),
    },
    // Append-only history; the transaction handle is this same mocked client.
    letterFlowEvent: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

describe('CorrespondenceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateNumber', () => {
    it('should generate a formatted number', async () => {
      vi.mocked(prisma.agendaNumber.findUnique).mockResolvedValue({
        id: 'agenda-1',
        unitId: 'unit-1',
        academicYearId: 'year-1',
        type: 'OUTGOING',
        lastNumber: 10,
        format: '[NO]/[TYPE]/[ROMAN]/[YEAR]',
      } as any);

      vi.mocked(prisma.agendaNumber.update).mockResolvedValue({
        lastNumber: 11,
      } as any);

      const result = await CorrespondenceService.generateNumber('unit-1', 'OUTGOING', 'year-1');

      const date = new Date();
      const year = date.getFullYear().toString();
      // We accept any roman month in the test string to avoid flaky tests based on current month
      expect(result).toMatch(new RegExp(`011/OUTGOING/[IVX]+/${year}`));
    });

    it('should create new agenda config if not exists', async () => {
      vi.mocked(prisma.agendaNumber.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.agendaNumber.create).mockResolvedValue({
        id: 'agenda-new',
        lastNumber: 0,
        format: '[NO]/[TYPE]/[ROMAN]/[YEAR]',
      } as any);
      vi.mocked(prisma.agendaNumber.update).mockResolvedValue({
        lastNumber: 1,
      } as any);

      await CorrespondenceService.generateNumber('unit-1', 'OUTGOING', 'year-1');

      expect(prisma.agendaNumber.create).toHaveBeenCalled();
    });
  });

  describe('processReview', () => {
    // Review is tiered now: the service reads the whole ladder and refuses an
    // out-of-turn approval, so the mock provides the letter with its reviewers
    // rather than a single row fetched by (letterId, reviewerId) — the lookup
    // this method no longer does. See letter-workflow.test.ts for the rule
    // itself; these check it is wired into the service.
    it('approves a first-rung paraf and advances toward the signer', async () => {
      vi.mocked(prisma.letter.findUnique).mockResolvedValue({
        id: 'letter-1',
        status: 'PENDING_REVIEW',
        createdById: 'creator-1',
        reviewers: [
          { id: 'review-1', reviewerId: 'user-1', order: 1, status: 'PENDING', isSigner: false },
          { id: 'review-2', reviewerId: 'signer', order: 2, status: 'PENDING', isSigner: true },
        ],
      } as any);

      const result = await CorrespondenceService.processReview('letter-1', 'user-1', 'APPROVE');

      expect(result.success).toBe(true);
      expect(prisma.letterReviewer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'review-1' },
          data: expect.objectContaining({ status: 'APPROVED' }),
        })
      );
      // Not signed — a rung remains above this one.
      expect(prisma.letter.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'letter-1' },
          data: { status: 'READY_TO_SIGN' },
        })
      );
    });

    it('signs the letter when the signer approves last', async () => {
      vi.mocked(prisma.letter.findUnique).mockResolvedValue({
        id: 'letter-1',
        status: 'READY_TO_SIGN',
        createdById: 'creator-1',
        // The rung below has already parafed, so it is the signer's turn.
        reviewers: [
          { id: 'review-1', reviewerId: 'user-1', order: 1, status: 'APPROVED', isSigner: false },
          { id: 'review-2', reviewerId: 'signer', order: 2, status: 'PENDING', isSigner: true },
        ],
        unitId: 'unit-1',
        subject: 'Test',
        letterNumber: '1',
      } as any);

      await CorrespondenceService.processReview('letter-1', 'signer', 'APPROVE');

      expect(prisma.letter.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'letter-1' },
          data: { status: 'SIGNED' },
        })
      );
    });

    it('refuses to let the signer sign ahead of the rung below', async () => {
      vi.mocked(prisma.letter.findUnique).mockResolvedValue({
        id: 'letter-1',
        status: 'PENDING_REVIEW',
        createdById: 'creator-1',
        reviewers: [
          { id: 'review-1', reviewerId: 'user-1', order: 1, status: 'PENDING', isSigner: false },
          { id: 'review-2', reviewerId: 'signer', order: 2, status: 'PENDING', isSigner: true },
        ],
      } as any);

      await expect(
        CorrespondenceService.processReview('letter-1', 'signer', 'APPROVE')
      ).rejects.toThrow(/Belum giliran/);
      expect(prisma.letter.update).not.toHaveBeenCalled();
    });
  });

  describe('Resubmit and archive', () => {
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

      const result = await CorrespondenceService.resubmitLetter('letter-1', admin as any);

      expect(prisma.letterReviewer.updateMany).toHaveBeenCalledWith({
        where: { letterId: 'letter-1' },
        data: { status: 'PENDING', reviewedAt: null },
      });
      expect(result.status).toBe('PENDING_REVIEW');
    });

    it('archives a disposed letter and closes open dispositions', async () => {
      vi.mocked(prisma.letter.findUnique).mockResolvedValue(
        accessRow({ status: 'DISPOSED', direction: 'INCOMING' }) as any
      );
      vi.mocked(prisma.disposition.updateMany).mockResolvedValue({ count: 1 } as any);
      vi.mocked(prisma.letter.update).mockResolvedValue({} as any);

      const result = await CorrespondenceService.archiveLetter('letter-1', admin as any);

      expect(prisma.disposition.updateMany).toHaveBeenCalledWith({
        where: { letterId: 'letter-1', status: { not: 'COMPLETED' } },
        data: expect.objectContaining({ status: 'COMPLETED' }),
      });
      expect(result.status).toBe('ARCHIVED');
    });
  });

  describe('Dispositions', () => {
    it('creates a disposition and advances incoming letter status to DISPOSED', async () => {
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
      vi.mocked(prisma.disposition.create).mockResolvedValue({ id: 'disp-1', recipientId: 'user-2' } as any);
      vi.mocked(prisma.letter.update).mockResolvedValue({} as any);

      const result = await CorrespondenceService.createDisposition(
        {
          letterId: 'letter-1',
          senderId: 'user-1',
          recipientId: 'user-2',
          instruction: 'Tolong tindak lanjuti',
        },
        { id: 'user-1', roleCode: 'SUPER_ADMIN', unitId: null } as any
      );

      expect(result).toHaveProperty('id', 'disp-1');
      expect(prisma.letter.update).toHaveBeenCalledWith({
        where: { id: 'letter-1' },
        data: { status: 'DISPOSED' },
      });
    });
  });

  describe('getLetterById', () => {
    it('selects signatures and verifies access', async () => {
      const row = {
        id: 'letter-1',
        unitId: 'unit-1',
        createdById: 'creator-1',
        status: 'SIGNED',
        reviewers: [],
        recipients: [],
        dispositions: [],
      };
      vi.mocked(prisma.letter.findUnique).mockResolvedValue(row as any);

      await CorrespondenceService.getLetterById('letter-1', {
        userId: 'u1',
        roleCode: 'SUPER_ADMIN',
        unitId: null,
      } as any);

      const detailCall = vi.mocked(prisma.letter.findUnique).mock.calls.at(-1)![0] as any;
      expect(detailCall.include.signatures).toBeDefined();
    });
  });
});
