import { describe, it, expect, vi, beforeEach } from 'vitest';
import { researchService } from '../service';
import { prisma } from '../../../lib/prisma';

vi.mock('../../../lib/prisma', () => ({
  prisma: {
    researchTheme: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    researchSubmission: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
    researchReference: {
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('ResearchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a research theme', async () => {
    const mockData = { unitId: 'u1', academicYearId: 'ay1', title: 'Islamic Ethics' };
    (prisma.researchTheme.create as any).mockResolvedValue({ id: 't1', ...mockData });

    const result = await researchService.createTheme(mockData);
    expect(result.title).toBe('Islamic Ethics');
  });
});
