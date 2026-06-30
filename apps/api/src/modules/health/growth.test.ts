import { describe, it, expect } from 'vitest';
import { calculateGrowthZScores } from './service';

describe('Health Growth Z-Scores', () => {
  it('should calculate correct Z-scores for normal weight/height male (24 months)', () => {
    const result = calculateGrowthZScores({
      ageMonths: 24,
      gender: 'MALE',
      weight: 12.2, // Median for 24mo Male
      height: 87.8, // Median for 24mo Male
    });

    expect(result.weightZScore).toBe(0);
    expect(result.heightZScore).toBe(0);
    expect(result.nutritionStatus).toBe('NORMAL');
  });

  it('should identify underweight status', () => {
    const result = calculateGrowthZScores({
      ageMonths: 36,
      gender: 'FEMALE',
      weight: 10, // Median is 13.9, SD is 1.3. 10 is ~ -3 SD
      height: 95.1,
    });

    expect(result.weightZScore).toBeLessThan(-2.5);
    expect(result.nutritionStatus).toBe('SEVERELY_UNDERWEIGHT');
  });

  it('should identify overweight status', () => {
    const result = calculateGrowthZScores({
      ageMonths: 60,
      gender: 'MALE',
      weight: 23, // Median is 18.3, SD is 1.9. 23 is ~ +2.4 SD
      height: 110,
    });

    expect(result.weightZScore).toBeGreaterThan(2);
    expect(result.nutritionStatus).toBe('OVERWEIGHT');
  });

  it('should handle missing weight or height', () => {
    const result = calculateGrowthZScores({
      ageMonths: 12,
      gender: 'FEMALE',
      height: 74,
    });

    expect(result.heightZScore).toBe(0);
    expect(result.weightZScore).toBeNull();
    expect(result.nutritionStatus).toBe('NORMAL');
  });

  it('should calculate correct Z-scores for school-age students (15 years / 180 months)', () => {
    const result = calculateGrowthZScores({
      ageMonths: 180,
      gender: 'MALE',
      weight: 54.0, // Median for 15y Male
      height: 170.1, // Median for 15y Male
    });

    expect(result.weightZScore).toBe(0);
    expect(result.heightZScore).toBe(0);
    expect(result.nutritionStatus).toBe('NORMAL');
  });

  it('should identify overweight in older students', () => {
    const result = calculateGrowthZScores({
      ageMonths: 216, // 18 years
      gender: 'FEMALE',
      weight: 76.1, // Median is 56.5, SD is 9.8. 76.1 is exactly +2 SD
      height: 163.0,
    });

    expect(result.weightZScore).toBe(2);
    expect(result.nutritionStatus).toBe('OVERWEIGHT');
  });
});
