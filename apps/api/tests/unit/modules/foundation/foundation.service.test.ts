import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. Define the mock object FIRST
const prismaMock = vi.hoisted(() => ({
  foundation: {
    findUnique: vi.fn(),
  },
  boardMember: {
    count: vi.fn(),
  },
  foundationDocument: {
    count: vi.fn(),
  },
  journalEntry: {
    aggregate: vi.fn(),
  },
}));

// 2. Mock the module to return the object
// Path: apps/api/tests/unit/modules/foundation -> apps/api/src/lib/prisma
// Depth: foundation -> modules -> unit -> tests -> apps/api root -> src -> lib -> prisma
// ../../../../src/lib/prisma
vi.mock('../../../../src/lib/prisma', () => ({
  prisma: prismaMock,
}));

// 3. Import the service (which imports the mocked module)
// ../../../../src/modules/foundation/service
import { getFoundationStats } from '../../../../src/modules/foundation/service';

describe('Foundation Service - Stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return foundation stats with zero finance when units are empty', async () => {
    const mockFoundation = {
      name: 'Yayasan Test',
      units: [],
      _count: {
        units: 0,
        boardMembers: 5,
        documents: 3,
      },
    };

    prismaMock.foundation.findUnique.mockResolvedValue(mockFoundation);
    prismaMock.boardMember.count.mockResolvedValue(2);
    prismaMock.foundationDocument.count.mockResolvedValue(1);

    const result = await getFoundationStats('foundation-1');

    expect(result).toEqual({
      foundationId: 'foundation-1',
      foundationName: 'Yayasan Test',
      totalUnits: 0,
      totalStudents: 0,
      totalTeachers: 0,
      totalStaff: 0,
      totalBoardMembers: 5,
      activeBoardMembers: 2,
      totalDocuments: 3,
      expiringDocuments: 1,
      unitsSummary: [],
      financialSummary: {
        totalRevenue: 0,
        totalExpense: 0,
        netIncome: 0,
      },
      studentDistribution: [],
    });

    // Should NOT call finance queries
    expect(prismaMock.journalEntry.aggregate).not.toHaveBeenCalled();
  });

  it('should return foundation stats with finance calculation when units exist', async () => {
    const mockFoundation = {
      name: 'Yayasan Test',
      units: [
        { id: 'u1', name: 'TK', type: 'TK_QURAN', _count: { students: 50, teachers: 5, staff: 2 } },
        { id: 'u2', name: 'SD', type: 'SD_IT', _count: { students: 100, teachers: 10, staff: 4 } },
      ],
      _count: {
        units: 2,
        boardMembers: 5,
        documents: 3,
      },
    };

    prismaMock.foundation.findUnique.mockResolvedValue(mockFoundation);
    prismaMock.boardMember.count.mockResolvedValue(2);
    prismaMock.foundationDocument.count.mockResolvedValue(1);

    // Mock aggregate results
    // First call: REVENUE (Credit - Debit)
    // Second call: EXPENSE (Debit - Credit)
    prismaMock.journalEntry.aggregate
      .mockResolvedValueOnce({
        _sum: { credit: 1000000, debit: 0 },
      })
      .mockResolvedValueOnce({
        _sum: { debit: 400000, credit: 0 },
      });

    const result = await getFoundationStats('foundation-1');

    expect(result).toEqual({
      foundationId: 'foundation-1',
      foundationName: 'Yayasan Test',
      totalUnits: 2,
      totalStudents: 150, // 50 + 100
      totalTeachers: 15, // 5 + 10
      totalStaff: 6, // 2 + 4
      totalBoardMembers: 5,
      activeBoardMembers: 2,
      totalDocuments: 3,
      expiringDocuments: 1,
      unitsSummary: mockFoundation.units,
      financialSummary: {
        totalRevenue: 1000000, // 1000000 - 0
        totalExpense: 400000,  // 400000 - 0
        netIncome: 600000,
      },
      studentDistribution: [
        { unitName: 'TK', count: 50 },
        { unitName: 'SD', count: 100 },
      ],
    });

    // Should call finance queries
    expect(prismaMock.journalEntry.aggregate).toHaveBeenCalledTimes(2);
  });
});
