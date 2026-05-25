import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../lib/prisma';
import { litbangService } from './litbang.service';
import { tataLaksanaService } from '../tatalaksana/tatalaksana.service';

// Mock external dependencies
vi.mock('../tatalaksana/tatalaksana.service', () => ({
  tataLaksanaService: {
    createDraftFromResearch: vi.fn(),
  },
}));

const { mockPrisma } = vi.hoisted(() => {
  const mock = {
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
    planActivity: {
      create: vi.fn(),
    },
    standardOperatingProcedure: {
      create: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    journalEntry: {
      aggregate: vi.fn(),
    },
    $transaction: vi.fn().mockImplementation((cb: any) => cb(mock)),
  };
  return { mockPrisma: mock };
});

vi.mock('../../lib/prisma', () => ({
  prisma: mockPrisma,
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

      expect(prisma.researchProject.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          title: 'Project Alpha',
        }),
      }));
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

      expect(prisma.researchProject.updateMany).toHaveBeenCalledWith({
        where: expect.objectContaining({ id: 'proj-1' }),
        data: expect.objectContaining({ progress: 50 }),
      });
    });
  });

  describe('Project Financial Status', () => {
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
      expect(result.realization).toBe(500);
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
          status: 'PILOT',
          score: 80,
          approvedById: 'user-1',
        }),
      });

      await litbangService.evaluateProposal('prop-1', 'user-1', 50, 'Needs work');

      expect(prisma.innovationProposal.update).toHaveBeenCalledWith({
        where: { id: 'prop-1' },
        data: expect.objectContaining({
          status: 'REJECTED',
          score: 50,
        }),
      });
    });
  });

  describe('Summary Dashboard', () => {
    it('should count projects and proposals', async () => {
      vi.mocked(prisma.researchProject.count).mockResolvedValueOnce(5);
      vi.mocked(prisma.researchProject.count).mockResolvedValueOnce(2);
      vi.mocked(prisma.innovationProposal.count).mockResolvedValueOnce(10);
      vi.mocked(prisma.innovationProposal.count).mockResolvedValueOnce(3);

      const summary = await litbangService.getSummary('unit-1');

      expect(summary.totalProjects).toBe(5);
      expect(summary.activeProjects).toBe(2);
      expect(summary.totalProposals).toBe(10);
      expect(summary.implementedProposals).toBe(3);
    });
  });

  describe('Promotion and SOP Integration', () => {
    it('should promote proposal to research project', async () => {
      const mockProposal = { id: 'prop-1', unitId: 'unit-1', title: 'New Tech', description: 'desc', category: 'TEKNOLOGI', proposerId: 'user-1' };
      vi.mocked(prisma.innovationProposal.findUniqueOrThrow).mockResolvedValue(mockProposal as any);
      vi.mocked(prisma.researchProject.create).mockResolvedValue({ id: 'proj-1' } as any);

      await litbangService.promoteProposal('prop-1', { type: 'RESEARCH' });

      expect(prisma.researchProject.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          title: '[Inovasi] New Tech',
          unitId: 'unit-1',
        })
      }));
      expect(prisma.innovationProposal.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'prop-1' },
        data: { status: 'IMPLEMENTED' }
      }));
    });

    it('should create SOP draft when project is published', async () => {
      const mockProject = {
        id: 'proj-1',
        unitId: 'unit-1',
        title: 'Project Alpha',
        findings: 'Research findings here',
        leaderId: 'user-1',
        status: 'PUBLISHED'
      };

      vi.mocked(prisma.researchProject.update).mockResolvedValue(mockProject as any);
      vi.mocked(tataLaksanaService.createDraftFromResearch).mockResolvedValue({} as any);

      await litbangService.updateProject('proj-1', { status: 'PUBLISHED', findings: 'Research findings here' });

      expect(tataLaksanaService.createDraftFromResearch).toHaveBeenCalledWith(expect.objectContaining({
        researchId: 'proj-1',
        findings: 'Research findings here',
      }));
    });
  });
});
