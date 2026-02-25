import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../lib/prisma';
import { litbangService } from './litbang.service';

// Mock external dependencies
vi.mock('../../lib/prisma', () => ({
  prisma: {
    researchProject: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    researchMilestone: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    innovationProposal: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('Litbang Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Research Projects', () => {
    it('should create research project', async () => {
      const dto = {
        unitId: 'unit-1',
        title: 'Project Alpha',
        category: 'SCIENCE',
        leaderId: 'user-1',
        budget: 10000000,
      };

      vi.mocked(prisma.researchProject.create).mockResolvedValue({ id: 'proj-1', ...dto } as any);

      await litbangService.createProject(dto);

      expect(prisma.researchProject.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Project Alpha',
          budget: 10000000,
        }),
      });
    });

    it('should get projects with filters', async () => {
      vi.mocked(prisma.researchProject.findMany).mockResolvedValue([{ id: 'proj-1' }] as any);

      await litbangService.getProjects({ unitId: 'unit-1', status: 'IN_PROGRESS' });

      expect(prisma.researchProject.findMany).toHaveBeenCalledWith({
        where: { unitId: 'unit-1', status: 'IN_PROGRESS' },
        include: expect.any(Object),
        orderBy: expect.any(Object),
      });
    });
  });

  describe('Research Milestones', () => {
    it('should update milestone and recalculate project progress', async () => {
      vi.mocked(prisma.researchMilestone.update).mockResolvedValue({ id: 'ms-1', projectId: 'proj-1' } as any);
      vi.mocked(prisma.researchMilestone.findMany).mockResolvedValue([
        { id: 'ms-1', status: 'COMPLETED' },
        { id: 'ms-2', status: 'PENDING' },
      ] as any);
      vi.mocked(prisma.researchProject.update).mockResolvedValue({} as any);

      await litbangService.updateMilestone('ms-1', { status: 'COMPLETED' });

      expect(prisma.researchMilestone.update).toHaveBeenCalledWith({
        where: { id: 'ms-1' },
        data: { status: 'COMPLETED' },
      });

      // Recalculate progress: 1 completed out of 2 = 50%
      expect(prisma.researchProject.update).toHaveBeenCalledWith({
        where: { id: 'proj-1' },
        data: { progress: 50 },
      });
    });
  });

  describe('Innovation Proposals', () => {
    it('should evaluate proposal correctly based on score', async () => {
      vi.mocked(prisma.innovationProposal.update).mockResolvedValue({ id: 'prop-1' } as any);

      await litbangService.evaluateProposal('prop-1', 'user-1', 80, 'Good ideas');

      expect(prisma.innovationProposal.update).toHaveBeenCalledWith({
        where: { id: 'prop-1' },
        data: expect.objectContaining({
          status: 'PILOT', // Score >= 70
          score: 80,
          approvedById: 'user-1',
        }),
      });

      await litbangService.evaluateProposal('prop-1', 'user-1', 50, 'Needs work');

      expect(prisma.innovationProposal.update).toHaveBeenCalledWith({
        where: { id: 'prop-1' },
        data: expect.objectContaining({
          status: 'REJECTED', // Score < 70
          score: 50,
        }),
      });
    });
  });

  describe('Summary Dashboard', () => {
    it('should count projects and proposals', async () => {
      vi.mocked(prisma.researchProject.count).mockResolvedValueOnce(5); // total
      vi.mocked(prisma.researchProject.count).mockResolvedValueOnce(2); // active
      vi.mocked(prisma.innovationProposal.count).mockResolvedValueOnce(10); // total
      vi.mocked(prisma.innovationProposal.count).mockResolvedValueOnce(3); // implemented

      const summary = await litbangService.getSummary('unit-1');

      expect(summary.totalProjects).toBe(5);
      expect(summary.activeProjects).toBe(2);
      expect(summary.totalProposals).toBe(10);
      expect(summary.implementedProposals).toBe(3);
    });
  });
});
