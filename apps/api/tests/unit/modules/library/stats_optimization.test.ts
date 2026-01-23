import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma Client
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      book = {
        aggregate: vi.fn(),
      };
      bookCategory = {
        count: vi.fn(),
      };
      borrowing = {
        count: vi.fn(),
        findMany: vi.fn(),
      };
      $transaction = vi.fn((callback) => callback(this));
    },
    BookStatus: {
      AVAILABLE: 'AVAILABLE',
      BORROWED: 'BORROWED',
    },
    BorrowingStatus: {
      ACTIVE: 'ACTIVE',
    },
  };
});

// Import service
import { getLibraryStats } from '../../../../src/modules/library/service';
import { prisma } from '../../../../src/lib/prisma';

describe('Library Service - Stats Optimization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use findMany (single query) instead of count (multiple queries) for borrowing stats', async () => {
    const unitId = 'unit-123';

    // Mock responses
    (prisma.book.aggregate as any).mockResolvedValue({
      _count: 100,
      _sum: { quantity: 150, available: 120 },
    });
    (prisma.bookCategory.count as any).mockResolvedValue(5);

    // Mock borrowing responses
    // We expect the implementation to call findMany
    const mockBorrowings = [
      { dueDate: new Date(Date.now() + 86400000) }, // Future (Not Overdue)
      { dueDate: new Date(Date.now() - 86400000) }, // Past (Overdue)
      { dueDate: new Date(Date.now() - 100000) }, // Past (Overdue)
    ];
    (prisma.borrowing.findMany as any).mockResolvedValue(mockBorrowings);

    // For the OLD implementation (so test runs without erroring on undefined return if it calls count)
    (prisma.borrowing.count as any).mockResolvedValue(999);

    const result = await getLibraryStats(unitId);

    // Verify findMany was called
    expect(prisma.borrowing.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.borrowing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'ACTIVE',
          book: { unitId },
        }),
        select: { dueDate: true },
      })
    );

    // Verify count was NOT called for borrowing
    expect(prisma.borrowing.count).not.toHaveBeenCalled();

    // Verify calculations
    expect(result.activeBorrowings).toBe(3);
    expect(result.overdueBorrowings).toBe(2);
  });
});
