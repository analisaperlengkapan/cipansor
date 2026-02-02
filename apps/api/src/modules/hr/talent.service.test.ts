import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCompetency, createPerformanceReview } from './talent.service';
import { prisma } from '../../lib/prisma';
import { Errors } from '../../middleware/error';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    competency: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    performanceReview: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('Talent Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCompetency', () => {
    it('should create a competency successfully', async () => {
      const input = { name: 'Leadership', description: 'Lead people' };
      vi.mocked(prisma.competency.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.competency.create).mockResolvedValue({ id: '1', ...input } as any);

      const result = await createCompetency(input);
      expect(result).toHaveProperty('id');
      expect(result.name).toBe('Leadership');
    });

    it('should throw error if competency exists', async () => {
      const input = { name: 'Leadership' };
      vi.mocked(prisma.competency.findUnique).mockResolvedValue({ id: '1', ...input } as any);

      await expect(createCompetency(input)).rejects.toThrow(Errors.badRequest('Competency with this name already exists'));
    });
  });

  describe('createPerformanceReview', () => {
    it('should create review if no active one exists', async () => {
      const input = {
        userId: 'u1',
        reviewerId: 'u2',
        cycleName: 'Q1 2025',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      };

      vi.mocked(prisma.performanceReview.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.performanceReview.create).mockResolvedValue({ id: 'r1', ...input } as any);

      const result = await createPerformanceReview(input);
      expect(result.id).toBe('r1');
    });

    it('should throw if active review exists', async () => {
      const input = {
        userId: 'u1',
        reviewerId: 'u2',
        cycleName: 'Q1 2025',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      };

      vi.mocked(prisma.performanceReview.findFirst).mockResolvedValue({ id: 'r1' } as any);

      await expect(createPerformanceReview(input)).rejects.toThrow(/An active review for this cycle already exists/);
    });
  });
});
