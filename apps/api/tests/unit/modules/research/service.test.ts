import { describe, it, expect, vi, beforeEach } from 'vitest';
import { researchService } from '../../../../src/modules/research/research.service';
import { prisma } from '../../../../src/lib/prisma';

// Mock prisma
vi.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    researchProposal: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    researchOutput: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('ResearchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProposal = {
    id: 'prop-1',
    title: 'Test Proposal',
    abstract: 'Abstract',
    category: 'ACADEMIC',
    budgetProposed: 1000000,
    status: 'DRAFT',
    unitId: 'unit-1',
    academicYearId: 'year-1',
    researcherId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('createProposal', () => {
    it('should create a proposal', async () => {
      const input = {
        title: 'Test Proposal',
        abstract: 'Abstract',
        category: 'ACADEMIC' as const,
        budgetProposed: 1000000,
        unitId: 'unit-1',
        academicYearId: 'year-1',
      };

      vi.mocked(prisma.researchProposal.create).mockResolvedValue(mockProposal as any);

      const result = await researchService.createProposal(input, 'user-1');

      expect(prisma.researchProposal.create).toHaveBeenCalledWith({
        data: {
          ...input,
          researcherId: 'user-1',
          status: 'DRAFT',
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockProposal);
    });
  });

  describe('findAllProposals', () => {
    it('should return paginated proposals', async () => {
      vi.mocked(prisma.researchProposal.count).mockResolvedValue(1);
      vi.mocked(prisma.researchProposal.findMany).mockResolvedValue([mockProposal] as any);

      const result = await researchService.findAllProposals({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(prisma.researchProposal.findMany).toHaveBeenCalledWith(expect.objectContaining({
        take: 10,
        skip: 0,
      }));
    });
  });

  describe('updateProposal', () => {
    it('should update proposal', async () => {
      const updateData = { title: 'Updated Title' };
      const updatedMock = { ...mockProposal, ...updateData };

      vi.mocked(prisma.researchProposal.update).mockResolvedValue(updatedMock as any);

      const result = await researchService.updateProposal('prop-1', updateData);

      expect(prisma.researchProposal.update).toHaveBeenCalledWith({
        where: { id: 'prop-1' },
        data: updateData,
      });
      expect(result.title).toBe('Updated Title');
    });
  });
});
