import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    student: { findUnique: vi.fn() },
    growthRecord: { create: vi.fn() },
  },
}));

import { prisma } from '../../lib/prisma';
import { calculateGrowthZScores, createGrowthRecord } from './health.service';

const mocked = prisma as any;

describe('calculateGrowthZScores', () => {
  it('computes Z-scores against the nearest WHO milestone', () => {
    // 10-year-old boy at exactly median values → Z = 0
    const atMedian = calculateGrowthZScores({
      ageMonths: 120,
      gender: 'MALE',
      height: 137.8,
      weight: 31.2,
    });
    expect(atMedian).toEqual({
      heightZScore: 0,
      weightZScore: 0,
      nutritionStatus: 'NORMAL',
    });

    // Severely underweight: 3+ SD below median
    const under = calculateGrowthZScores({
      ageMonths: 120,
      gender: 'MALE',
      weight: 31.2 - 3 * 4.5,
    });
    expect(under.weightZScore).toBe(-3);
    expect(under.nutritionStatus).toBe('SEVERELY_UNDERWEIGHT');
  });

  it('returns nulls when measurements are missing', () => {
    const result = calculateGrowthZScores({ ageMonths: 60, gender: 'FEMALE' });
    expect(result).toEqual({
      heightZScore: null,
      weightZScore: null,
      nutritionStatus: null,
    });
  });
});

describe('createGrowthRecord', () => {
  beforeEach(() => vi.clearAllMocks());

  it('persists computed age and Z-scores from the student profile', async () => {
    mocked.student.findUnique.mockResolvedValue({
      birthDate: new Date('2016-01-15'),
      gender: 'MALE',
    });
    mocked.growthRecord.create.mockResolvedValue({ id: 'gr-1' });

    await createGrowthRecord(
      {
        studentId: 's1',
        unitId: 'unit-1',
        recordDate: new Date('2026-01-15'),
        weight: 31.2,
        height: 137.8,
      } as any,
      'nurse-1'
    );

    expect(mocked.growthRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ageMonths: 120,
          heightZScore: 0,
          weightZScore: 0,
          nutritionStatus: 'NORMAL',
        }),
      })
    );
  });
});
