import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CorrespondenceService } from './correspondence.service';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    letter: {
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    letterReviewer: {
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

describe('CorrespondenceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLetters', () => {
    it('should filter by REVIEW scope correctly', async () => {
      const mockLetters = [{ id: '1' }];
      (prisma.letter.findMany as any).mockResolvedValue(mockLetters);
      (prisma.letter.count as any).mockResolvedValue(1);

      await CorrespondenceService.getLetters('unit-1', {
        scope: 'REVIEW',
        userId: 'user-1',
      });

      expect(prisma.letter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            reviewers: {
              some: {
                reviewerId: 'user-1',
                status: 'PENDING',
              },
            },
          }),
        })
      );
    });
  });

  describe('processReview', () => {
    it('should throw error if previous reviewer has not approved', async () => {
      // Mock finding the current review
      (prisma.letterReviewer.findUnique as any).mockResolvedValue({
        id: 'review-2',
        letterId: 'letter-1',
        order: 2,
        isSigner: false,
      });

      // Mock counting previous pending reviews -> returns 1 (meaning 1 previous is pending)
      (prisma.letterReviewer.count as any).mockResolvedValue(1);

      await expect(
        CorrespondenceService.processReview('letter-1', 'user-2', 'APPROVE')
      ).rejects.toThrow('Reviewer sebelumnya belum menyetujui surat ini.');
    });

    it('should approve if previous reviewers approved', async () => {
      (prisma.letterReviewer.findUnique as any).mockResolvedValue({
        id: 'review-2',
        letterId: 'letter-1',
        order: 2,
        isSigner: false,
      });

      (prisma.letterReviewer.count as any).mockResolvedValue(0);

      await CorrespondenceService.processReview('letter-1', 'user-2', 'APPROVE');

      expect(prisma.letterReviewer.update).toHaveBeenCalledWith({
        where: { id: 'review-2' },
        data: expect.objectContaining({ status: 'APPROVED' }),
      });
    });

    it('should set letter status to REVISION_NEEDED if rejected', async () => {
       (prisma.letterReviewer.findUnique as any).mockResolvedValue({
        id: 'review-1',
        letterId: 'letter-1',
        order: 1,
        isSigner: false,
      });

      (prisma.letterReviewer.count as any).mockResolvedValue(0);

      await CorrespondenceService.processReview('letter-1', 'user-1', 'REJECT');

      expect(prisma.letter.update).toHaveBeenCalledWith({
        where: { id: 'letter-1' },
        data: { status: 'REVISION_NEEDED' },
      });
    });
  });
});
