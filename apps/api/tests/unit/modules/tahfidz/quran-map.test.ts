import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks must be hoisted
const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
}));

// Mock @prisma/client
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      tahfidzRecord = {
        findMany: mocks.findMany,
      };
      $disconnect = vi.fn();
    },
    UserRole: {
      SUPER_ADMIN: 'SUPER_ADMIN',
    },
    Prisma: {
      sql: vi.fn(),
      empty: '',
    },
  };
});

// Mock src/lib/prisma
vi.mock('../../../../../src/lib/prisma', () => ({
  prisma: {
    tahfidzRecord: {
      findMany: mocks.findMany,
    },
  },
}));

vi.mock('../../../../../src/lib/logger');

import { getQuranProgressMap } from '../../../../../src/modules/tahfidz/tahfidz.analytics';

describe('getQuranProgressMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate progress correctly based on ziyadah records', async () => {
    const studentId = 'student-123';

    // Mock Ziyadah records (Al-Fatihah full, Al-Baqarah partial)
    mocks.findMany
      .mockResolvedValueOnce([
        { surahNumber: 1, ayahStart: 1, ayahEnd: 7, recordedAt: new Date('2024-01-01') }, // Al-Fatihah
        { surahNumber: 2, ayahStart: 1, ayahEnd: 100, recordedAt: new Date('2024-01-02') }, // Al-Baqarah
      ])
      // Mock Assessment records (Passed Ali Imran)
      .mockResolvedValueOnce([
        { surahNumber: 3, score: 85, recordedAt: new Date('2024-01-03') }, // Ali Imran
      ])
      // Mock Murojaah records
      .mockResolvedValueOnce([]);

    const result = await getQuranProgressMap(studentId);

    expect(result.studentId).toBe(studentId);

    // Check Al-Fatihah (Verses: 7) -> Memorized via Ziyadah
    const fatihah = result.surahs.find((s) => s.surahNumber === 1);
    expect(fatihah?.status).toBe('MEMORIZED');

    // Check Al-Baqarah (Verses: 286) -> In Progress (only 100 ayat)
    const baqarah = result.surahs.find((s) => s.surahNumber === 2);
    expect(baqarah?.status).toBe('IN_PROGRESS');

    // Check Ali Imran -> Memorized via Assessment
    const aliImran = result.surahs.find((s) => s.surahNumber === 3);
    expect(aliImran?.status).toBe('MEMORIZED');
    expect(aliImran?.strength).toBe(85);

    // Check stats
    expect(result.stats.totalMemorized).toBe(2); // Fatihah + Ali Imran
    expect(result.stats.totalInProgress).toBe(1); // Baqarah
  });
});
