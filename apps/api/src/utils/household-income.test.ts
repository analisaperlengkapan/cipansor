import { describe, it, expect } from 'vitest';
import { IncomeRange, OccupationType } from '@prisma/client';
import { householdIncome, needScore, bracketFor } from './household-income';

/**
 * The behaviour these tests exist for: the previous scoring read
 * `fatherIncome` alone, which ranked the neediest applicants last.
 */
describe('householdIncome', () => {
  it('scores an orphan on the surviving parent, not on nothing', () => {
    // Father deceased, mother a market trader. Under the old rule this santri
    // scored 0 on the need criterion — below a comfortable single-earner
    // family — because fatherIncome was null.
    const income = householdIncome({
      fatherOccupation: OccupationType.SUDAH_MENINGGAL,
      fatherIncome: null,
      motherOccupation: OccupationType.PEDAGANG,
      motherIncome: IncomeRange.KURANG_500K,
    });

    expect(income.known).toBe(true);
    expect(income.knownEarners).toBe(2);
    expect(income.bracket).toBe(IncomeRange.KURANG_500K);
    expect(needScore(income)).toBe(100);
  });

  it('counts a working mother instead of ignoring her', () => {
    const withMother = householdIncome({
      fatherIncome: IncomeRange.RANGE_1JT_2JT,
      motherIncome: IncomeRange.RANGE_1JT_2JT,
    });
    const fatherOnly = householdIncome({
      fatherIncome: IncomeRange.RANGE_1JT_2JT,
    });

    // 1.5jt + 1.5jt = 3jt, a different bracket from 1.5jt alone.
    expect(withMother.bracket).toBe(IncomeRange.RANGE_2JT_5JT);
    expect(fatherOnly.bracket).toBe(IncomeRange.RANGE_1JT_2JT);
    expect(needScore(withMother)).toBeLessThan(needScore(fatherOnly));
  });

  it('includes the wali for a child who lives with one', () => {
    const income = householdIncome({
      fatherOccupation: OccupationType.SUDAH_MENINGGAL,
      motherOccupation: OccupationType.SUDAH_MENINGGAL,
      guardianOccupation: OccupationType.PNS,
      guardianIncome: IncomeRange.RANGE_5JT_10JT,
    });

    expect(income.bracket).toBe(IncomeRange.RANGE_5JT_10JT);
    expect(needScore(income)).toBe(40);
  });

  it('treats a deceased or unemployed parent as a known zero', () => {
    const income = householdIncome({
      fatherOccupation: OccupationType.SUDAH_MENINGGAL,
      motherOccupation: OccupationType.TIDAK_BEKERJA,
    });

    expect(income.known).toBe(true);
    expect(income.totalIdr).toBe(0);
    expect(income.bracket).toBe(IncomeRange.TIDAK_BERPENGHASILAN);
    expect(needScore(income)).toBe(100);
  });

  // Absence of data is not evidence of poverty; scoring it as destitute would
  // reward the least complete form.
  it('scores an entirely unrecorded household as 0, not as destitute', () => {
    const income = householdIncome({});

    expect(income.known).toBe(false);
    expect(income.knownEarners).toBe(0);
    expect(needScore(income)).toBe(0);
  });

  it('ranks a wealthy household below a poor one', () => {
    const wealthy = householdIncome({ fatherIncome: IncomeRange.LEBIH_20JT });
    const poor = householdIncome({ fatherIncome: IncomeRange.KURANG_500K });

    expect(needScore(poor)).toBeGreaterThan(needScore(wealthy));
  });
});

describe('bracketFor', () => {
  it('places boundary values in the bucket that contains them', () => {
    expect(bracketFor(0)).toBe(IncomeRange.TIDAK_BERPENGHASILAN);
    expect(bracketFor(499_999)).toBe(IncomeRange.KURANG_500K);
    expect(bracketFor(500_000)).toBe(IncomeRange.RANGE_500K_1JT);
    expect(bracketFor(1_999_999)).toBe(IncomeRange.RANGE_1JT_2JT);
    expect(bracketFor(2_000_000)).toBe(IncomeRange.RANGE_2JT_5JT);
    expect(bracketFor(20_000_000)).toBe(IncomeRange.LEBIH_20JT);
  });
});
