import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    alumniEducation: { findMany: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import { getPlacements } from './service';

const mocked = prisma as unknown as {
  alumniEducation: { findMany: ReturnType<typeof vi.fn> };
};

const placement = (over: Record<string, unknown>) => ({
  id: 'e1',
  institution: 'UI',
  degree: 'S1',
  field: 'Informatika',
  startYear: 2026,
  admissionPath: null,
  scholarshipName: null,
  isInternational: false,
  alumni: { id: 'a1', name: 'Fulan', graduationYear: 2025 },
  ...over,
});

describe('getPlacements (Si-Taka)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('aggregates paths, institutions, international and scholarship counts from real rows', async () => {
    mocked.alumniEducation.findMany.mockResolvedValue([
      placement({ id: 'e1', admissionPath: 'SNBP', scholarshipName: 'KIP-K' }),
      placement({ id: 'e2', admissionPath: 'SNBP', institution: 'UI' }),
      placement({
        id: 'e3',
        admissionPath: 'Al-Azhar',
        institution: 'Al-Azhar University',
        isInternational: true,
      }),
      placement({ id: 'e4', institution: 'UGM' }), // no path → "Lainnya"
    ]);

    const result = await getPlacements('unit-1');

    expect(result.stats.total).toBe(4);
    expect(result.stats.internationalCount).toBe(1);
    expect(result.stats.scholarshipCount).toBe(1);
    expect(result.stats.byPath).toEqual([
      { path: 'SNBP', count: 2 },
      { path: 'Al-Azhar', count: 1 },
      { path: 'Lainnya', count: 1 },
    ]);
    expect(result.stats.topInstitutions[0]).toEqual({ institution: 'UI', count: 2 });

    // Unit scoping goes through the alumni relation
    expect(mocked.alumniEducation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { alumni: { unitId: 'unit-1' } } })
    );
  });

  it('returns honest zeros when no placements exist', async () => {
    mocked.alumniEducation.findMany.mockResolvedValue([]);
    const result = await getPlacements();
    expect(result.placements).toEqual([]);
    expect(result.stats).toMatchObject({
      total: 0,
      internationalCount: 0,
      scholarshipCount: 0,
      byPath: [],
      topInstitutions: [],
    });
  });
});
