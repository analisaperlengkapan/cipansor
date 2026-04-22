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
      updateMany: vi.fn(),
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
    journalEntry: {
      aggregate: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
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
      // In the actual implementation it uses updateMany with status guards
      expect(prisma.researchProject.updateMany).toHaveBeenCalledWith({
        where: expect.objectContaining({ id: 'proj-1' }),
        data: expect.objectContaining({ progress: 50 }),
      });
    });

    it('should calculate project financial status', async () => {
      const mockProject = {
        id: 'proj-1',
        unitId: 'unit-1',
        budget: 1000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      vi.mocked(prisma.researchProject.findUniqueOrThrow).mockResolvedValue(mockProject as any);
      vi.mocked(prisma.journalEntry.aggregate).mockResolvedValue({
        _sum: {
          debit: { toNumber: () => 600 },
          credit: { toNumber: () => 100 },
        },
      } as any);

      const result = await litbangService.getProjectFinancialStatus('proj-1');

      expect(result.budget).toBe(1000);
      expect(result.realization).toBe(500); // 600 - 100
      expect(result.percentage).toBe(50);
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
