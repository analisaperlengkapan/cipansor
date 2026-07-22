import { IncomeRange, OccupationType } from '@prisma/client';

/**
 * Household income, for need-based scholarship and fee relief decisions.
 *
 * The scoring service read `student.fatherIncome` alone, and that inverted the
 * result for the families most in need. A santri whose father has died has no
 * `fatherIncome`, so the "penghasilan" criterion scored them 0 — the lowest
 * possible — while a family with a comfortable single earner scored higher.
 * The neediest applicants were ranked last by the criterion meant to find
 * them.
 *
 * It also ignored working mothers outright. A family supported by the mother
 * looked identical to a family with no income at all.
 *
 * So income is computed across the whole household: father, mother, and the
 * wali when the child lives with one.
 *
 * Buckets cannot be added, so each is reduced to a representative midpoint,
 * summed, then placed back into a bucket. This is an estimate and is treated
 * as one — the point is ordering applicants sensibly, not accounting.
 */

/** Representative rupiah value for each bucket. Open-ended top bucket is a floor. */
const MIDPOINT_IDR: Record<IncomeRange, number> = {
  [IncomeRange.TIDAK_BERPENGHASILAN]: 0,
  [IncomeRange.KURANG_500K]: 250_000,
  [IncomeRange.RANGE_500K_1JT]: 750_000,
  [IncomeRange.RANGE_1JT_2JT]: 1_500_000,
  [IncomeRange.RANGE_2JT_5JT]: 3_500_000,
  [IncomeRange.RANGE_5JT_10JT]: 7_500_000,
  [IncomeRange.RANGE_10JT_20JT]: 15_000_000,
  [IncomeRange.LEBIH_20JT]: 25_000_000,
};

/**
 * Occupations that establish an income of zero rather than leaving it unknown.
 *
 * This is the distinction that matters: a deceased father contributes a
 * *known* nothing. Treating that as "unrecorded" is what produced the
 * inversion above.
 */
const KNOWN_ZERO_OCCUPATIONS: readonly OccupationType[] = [
  OccupationType.SUDAH_MENINGGAL,
  OccupationType.TIDAK_BEKERJA,
];

export interface HouseholdEarner {
  income?: IncomeRange | null;
  occupation?: OccupationType | null;
}

export interface HouseholdIncome {
  /** Estimated monthly household income in rupiah. */
  totalIdr: number;
  /** The bucket `totalIdr` falls into. */
  bracket: IncomeRange;
  /**
   * False when nothing at all is recorded for any earner. Callers should not
   * score an unknown household as "poor" — absence of data is not evidence.
   */
  known: boolean;
  /** How many earners contributed a known figure. */
  knownEarners: number;
}

function contribution(earner: HouseholdEarner): number | null {
  if (earner.income != null) return MIDPOINT_IDR[earner.income];
  if (earner.occupation && KNOWN_ZERO_OCCUPATIONS.includes(earner.occupation)) {
    return 0;
  }
  return null;
}

/** Place a rupiah figure into the bucket that contains it. */
export function bracketFor(totalIdr: number): IncomeRange {
  if (totalIdr <= 0) return IncomeRange.TIDAK_BERPENGHASILAN;
  if (totalIdr < 500_000) return IncomeRange.KURANG_500K;
  if (totalIdr < 1_000_000) return IncomeRange.RANGE_500K_1JT;
  if (totalIdr < 2_000_000) return IncomeRange.RANGE_1JT_2JT;
  if (totalIdr < 5_000_000) return IncomeRange.RANGE_2JT_5JT;
  if (totalIdr < 10_000_000) return IncomeRange.RANGE_5JT_10JT;
  if (totalIdr < 20_000_000) return IncomeRange.RANGE_10JT_20JT;
  return IncomeRange.LEBIH_20JT;
}

/**
 * Sum what the household is known to earn.
 *
 * The wali is included because `livingWith` exists for children who do not
 * live with their parents; for those, the wali is the household.
 */
export function householdIncome(student: {
  fatherIncome?: IncomeRange | null;
  fatherOccupation?: OccupationType | null;
  motherIncome?: IncomeRange | null;
  motherOccupation?: OccupationType | null;
  guardianIncome?: IncomeRange | null;
  guardianOccupation?: OccupationType | null;
}): HouseholdIncome {
  const earners: HouseholdEarner[] = [
    { income: student.fatherIncome, occupation: student.fatherOccupation },
    { income: student.motherIncome, occupation: student.motherOccupation },
    { income: student.guardianIncome, occupation: student.guardianOccupation },
  ];

  let totalIdr = 0;
  let knownEarners = 0;

  for (const earner of earners) {
    const value = contribution(earner);
    if (value === null) continue;
    totalIdr += value;
    knownEarners += 1;
  }

  return {
    totalIdr,
    bracket: bracketFor(totalIdr),
    known: knownEarners > 0,
    knownEarners,
  };
}

/**
 * Need score, 0–100: the poorer the household, the higher the score.
 *
 * An unrecorded household scores 0 deliberately. Scoring it as destitute would
 * reward incomplete forms, and the criterion is meant to rank evidence.
 */
export function needScore(income: HouseholdIncome): number {
  if (!income.known) return 0;

  const byBracket: Record<IncomeRange, number> = {
    [IncomeRange.TIDAK_BERPENGHASILAN]: 100,
    [IncomeRange.KURANG_500K]: 100,
    [IncomeRange.RANGE_500K_1JT]: 90,
    [IncomeRange.RANGE_1JT_2JT]: 80,
    [IncomeRange.RANGE_2JT_5JT]: 60,
    [IncomeRange.RANGE_5JT_10JT]: 40,
    [IncomeRange.RANGE_10JT_20JT]: 20,
    [IncomeRange.LEBIH_20JT]: 10,
  };

  return byBracket[income.bracket];
}
