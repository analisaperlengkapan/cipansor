import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../lib/prisma';
import { CorrespondenceService } from './correspondence.service';

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
    },
    letterRecipient: {
      createMany: vi.fn(),
    },
    disposition: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    academicYear: {
      findFirst: vi.fn(),
    },
    agendaNumber: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
    $queryRaw: vi.fn(),
  },
}));

vi.mock('../../lib/event-bus', () => ({
  eventBus: {
    emit: vi.fn(),
  },
}));

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
        status: 'RECEIVED' as any,
        classificationId: 'class-1',
        senderName: 'Diknas',
      };

      vi.mocked(prisma.letter.create).mockResolvedValue({ id: 'letter-1' } as any);

      await CorrespondenceService.createLetter(dto, 'user-1');

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
    it('should approve review and update status to SIGNED if signer', async () => {
      vi.mocked(prisma.letterReviewer.findUnique).mockResolvedValue({
        id: 'review-1',
        isSigner: true,
      } as any);

      vi.mocked(prisma.letterReviewer.update).mockResolvedValue({} as any);
      vi.mocked(prisma.letter.update).mockResolvedValue({} as any);

      await CorrespondenceService.processReview('letter-1', 'user-1', 'APPROVE');

      expect(prisma.letterReviewer.update).toHaveBeenCalledWith({
        where: { id: 'review-1' },
        data: expect.objectContaining({ status: 'APPROVED' }),
      });

      expect(prisma.letter.update).toHaveBeenCalledWith({
        where: { id: 'letter-1' },
        data: { status: 'SIGNED' },
      });
    });

    it('should set status to REVISION_NEEDED if rejected', async () => {
      vi.mocked(prisma.letterReviewer.findUnique).mockResolvedValue({
        id: 'review-1',
        isSigner: false,
      } as any);

      await CorrespondenceService.processReview('letter-1', 'user-1', 'REJECT', 'Salah tanggal');

      expect(prisma.letter.update).toHaveBeenCalledWith({
        where: { id: 'letter-1' },
        data: { status: 'REVISION_NEEDED' },
      });
    });
  });

  describe('Dispositions', () => {
    it('should create disposition and notify recipient', async () => {
      vi.mocked(prisma.letter.findUnique).mockResolvedValue({ id: 'letter-1', status: 'RECEIVED' } as any);
      vi.mocked(prisma.disposition.create).mockResolvedValue({ id: 'disp-1' } as any);

      await CorrespondenceService.createDisposition({
        letterId: 'letter-1',
        senderId: 'user-1',
        recipientId: 'user-2',
        instruction: 'Tolong hadiri',
      });

      expect(prisma.disposition.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          instruction: 'Tolong hadiri',
          recipientId: 'user-2',
        }),
      });
    });

    it('should update disposition status', async () => {
      vi.mocked(prisma.disposition.findUnique).mockResolvedValue({
        id: 'disp-1',
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
    });
  });
});
