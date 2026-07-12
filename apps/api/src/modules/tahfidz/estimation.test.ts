import { describe, it, expect } from 'vitest';
import { calculateCompletionEstimate } from './tahfidz.service';

const now = new Date('2026-07-04T00:00:00Z');

describe('calculateCompletionEstimate', () => {
  it('projects completion from the observed pace, not an assumed frequency', () => {
    // 300 ayah over a 30-day window → 10 ayah/day
    const windowRecords = [
      { recordedAt: new Date('2026-06-04T00:00:00Z'), totalAyah: 100 },
      { recordedAt: new Date('2026-06-14T00:00:00Z'), totalAyah: 100 },
      { recordedAt: new Date('2026-06-24T00:00:00Z'), totalAyah: 100 },
    ];

    const result = calculateCompletionEstimate(5236, windowRecords, now);

    expect(result.status).toBe('PROJECTED');
    expect(result.remainingAyah).toBe(1000);
    expect(result.ayahPerDay).toBe(10);
    expect(result.estimatedDays).toBe(100);
    expect(result.estimatedDate).toEqual(new Date('2026-10-12T00:00:00Z'));
  });

  it('refuses to project with fewer than 3 records in the window', () => {
    const result = calculateCompletionEstimate(
      1000,
      [{ recordedAt: new Date('2026-06-20T00:00:00Z'), totalAyah: 50 }],
      now
    );

    expect(result.status).toBe('INSUFFICIENT_DATA');
    expect(result.estimatedDate).toBeNull();
    expect(result.ayahPerDay).toBeNull();
  });

  it('reports completion once all 6236 ayah are memorized', () => {
    const result = calculateCompletionEstimate(6236, [], now);
    expect(result.status).toBe('COMPLETED');
    expect(result.remainingAyah).toBe(0);
    expect(result.estimatedDays).toBe(0);
  });
});
