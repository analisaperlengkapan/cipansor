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
    },
    letterRecipient: {
      createMany: vi.fn(),
    },
    disposition: {
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

      vi.mocked(prisma.agendaNumber.update).mockResolvedValue({} as any);

      const result = await CorrespondenceService.generateNumber(
        'unit-1',
        'OUTGOING',
        'year-1'
      );

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
      vi.mocked(prisma.agendaNumber.update).mockResolvedValue({} as any);

      await CorrespondenceService.generateNumber('unit-1', 'OUTGOING', 'year-1');

      expect(prisma.agendaNumber.create).toHaveBeenCalled();
    });
  });

  describe('processReview', () => {
    it('should approve a letter', async () => {
      vi.mocked(prisma.letterReviewer.findUnique).mockResolvedValue({
        id: 'review-1',
        isSigner: false,
      } as any);

      const result = await CorrespondenceService.processReview(
        'letter-1',
        'user-1',
        'APPROVE'
      );

      expect(result.success).toBe(true);
      expect(prisma.letterReviewer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'review-1' },
          data: expect.objectContaining({ status: 'APPROVED' }),
        })
      );
    });

    it('should update letter status to SIGNED if signer approves', async () => {
      vi.mocked(prisma.letterReviewer.findUnique).mockResolvedValue({
        id: 'review-1',
        isSigner: true,
      } as any);

      await CorrespondenceService.processReview('letter-1', 'user-1', 'APPROVE');

      expect(prisma.letter.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'letter-1' },
          data: { status: 'SIGNED' },
        })
      );
    });
  });
});
