import { describe, it, expect, vi, beforeEach } from 'vitest';
import { kitabProgressController } from '../../src/modules/kitab-progress/kitab-progress.controller';
import { kitabProgressService } from '../../src/modules/kitab-progress/kitab-progress.service';
import { Request, Response } from 'express';

// Mock the service
vi.mock('../../src/modules/kitab-progress/kitab-progress.service', () => ({
  kitabProgressService: {
    updateProgress: vi.fn(),
  },
}));

describe('KitabProgressController Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('measures bulkCreateRecords performance', async () => {
    const recordCount = 50;
    const delayMs = 20;

    // Mock updateProgress with a delay
    vi.mocked(kitabProgressService.updateProgress).mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return {} as any;
    });

    // Mock Request and Response
    const records = Array.from({ length: recordCount }).map((_, i) => ({
      studentId: `student-${i}`,
      kitabId: 'kitab-1',
      academicYearId: 'year-1',
    }));

    const req = {
      body: { records },
      user: { sub: 'user-1', role: 'TEACHER', unitId: 'unit-1' },
    } as unknown as Request;

    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;

    const next = vi.fn();

    const start = performance.now();
    await kitabProgressController.bulkCreateRecords(req, res, next);
    const end = performance.now();
    const duration = end - start;

    console.log(
      `\n[Benchmark] bulkCreateRecords with ${recordCount} records (simulated ${delayMs}ms each) took ${duration.toFixed(2)}ms\n`
    );

    // Verify correct behavior
    expect(kitabProgressService.updateProgress).toHaveBeenCalledTimes(recordCount);
    expect(res.json).toHaveBeenCalledWith({
      data: {
        success: recordCount,
        failed: 0,
        errors: [],
      },
    });
  });
});
