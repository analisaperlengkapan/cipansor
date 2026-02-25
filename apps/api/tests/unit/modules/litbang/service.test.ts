import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LitbangService } from '@/modules/litbang/litbang.service';

vi.mock('@prisma/client', () => {
  const mockPrisma = {
    researchProject: {
      findMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    researchMilestone: {
      findMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    innovationProposal: {
      findMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  };
  return { PrismaClient: vi.fn(() => mockPrisma) };
});

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient() as any;

describe('LitbangService', () => {
  const service = new LitbangService();

  beforeEach(() => { vi.clearAllMocks(); });

  // ── Research Projects ─────────────────────────────
  describe('getProjects', () => {
    it('should return filtered projects with milestones', async () => {
      const mockProjects = [
        { id: 'p1', title: 'Penelitian AI', status: 'IN_PROGRESS', milestones: [], leader: { id: 'u1', name: 'Ahmad' } },
      ];
      prisma.researchProject.findMany.mockResolvedValue(mockProjects);

      const result = await service.getProjects({ status: 'IN_PROGRESS' });
      expect(result).toHaveLength(1);
      expect(result[0].leader.name).toBe('Ahmad');
    });
  });

  describe('createProject', () => {
    it('should create a new research project', async () => {
      const input = { unitId: 'unit1', title: 'Studi Kurikulum', category: 'Pendidikan', leaderId: 'u1' };
      const mockCreated = { id: 'p1', ...input, status: 'PROPOSAL', progress: 0 };
      prisma.researchProject.create.mockResolvedValue(mockCreated);

      const result = await service.createProject(input);
      expect(result.status).toBe('PROPOSAL');
      expect(result.progress).toBe(0);
    });
  });

  describe('updateProject', () => {
    it('should update project status', async () => {
      prisma.researchProject.update.mockResolvedValue({ id: 'p1', status: 'IN_PROGRESS' });

      const result = await service.updateProject('p1', { status: 'IN_PROGRESS' });
      expect(result.status).toBe('IN_PROGRESS');
    });
  });

  describe('deleteProject', () => {
    it('should delete a project', async () => {
      prisma.researchProject.delete.mockResolvedValue({ id: 'p1' });
      await service.deleteProject('p1');
      expect(prisma.researchProject.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
    });
  });

  // ── Milestones ────────────────────────────────────
  describe('createMilestone', () => {
    it('should create a milestone for a project', async () => {
      const input = { projectId: 'p1', title: 'Literature Review', sortOrder: 1 };
      const mockCreated = { id: 'm1', ...input, status: 'PENDING' };
      prisma.researchMilestone.create.mockResolvedValue(mockCreated);

      const result = await service.createMilestone(input);
      expect(result.title).toBe('Literature Review');
    });
  });

  describe('updateMilestone', () => {
    it('should update milestone and recalculate project progress', async () => {
      const mockUpdated = { id: 'm1', projectId: 'p1', status: 'COMPLETED' };
      prisma.researchMilestone.update.mockResolvedValue(mockUpdated);

      // After update, recalculate progress
      prisma.researchMilestone.findMany.mockResolvedValue([
        { id: 'm1', status: 'COMPLETED' },
        { id: 'm2', status: 'PENDING' },
        { id: 'm3', status: 'COMPLETED' },
      ]);
      prisma.researchProject.update.mockResolvedValue({ id: 'p1', progress: 67 });

      const result = await service.updateMilestone('m1', { status: 'COMPLETED' });
      expect(result.status).toBe('COMPLETED');

      // Progress recalculated: 2/3 = 67%
      expect(prisma.researchProject.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { progress: 67 },
      });
    });

    it('should handle 100% progress when all milestones complete', async () => {
      prisma.researchMilestone.update.mockResolvedValue({ id: 'm1', projectId: 'p1', status: 'COMPLETED' });
      prisma.researchMilestone.findMany.mockResolvedValue([
        { id: 'm1', status: 'COMPLETED' },
        { id: 'm2', status: 'COMPLETED' },
      ]);
      prisma.researchProject.update.mockResolvedValue({ id: 'p1', progress: 100 });

      await service.updateMilestone('m1', { status: 'COMPLETED' });
      expect(prisma.researchProject.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { progress: 100 },
      });
    });
  });

  describe('deleteMilestone', () => {
    it('should delete milestone and recalculate progress', async () => {
      prisma.researchMilestone.findUniqueOrThrow.mockResolvedValue({ id: 'm1', projectId: 'p1' });
      prisma.researchMilestone.delete.mockResolvedValue({ id: 'm1' });
      prisma.researchMilestone.findMany.mockResolvedValue([
        { id: 'm2', status: 'COMPLETED' },
      ]);
      prisma.researchProject.update.mockResolvedValue({ id: 'p1', progress: 100 });

      await service.deleteMilestone('m1');
      expect(prisma.researchMilestone.delete).toHaveBeenCalled();
    });
  });

  // ── Innovation Proposals ──────────────────────────
  describe('getProposals', () => {
    it('should return proposals with proposer details', async () => {
      const mockProposals = [
        { id: 'ip1', title: 'E-Learning Platform', proposer: { id: 'u1', name: 'Budi' } },
      ];
      prisma.innovationProposal.findMany.mockResolvedValue(mockProposals);

      const result = await service.getProposals({});
      expect(result[0].proposer.name).toBe('Budi');
    });
  });

  describe('createProposal', () => {
    it('should create a new innovation proposal', async () => {
      const input = { unitId: 'unit1', title: 'Digital Library', category: 'Teknologi', proposerId: 'u1' };
      const mockCreated = { id: 'ip1', ...input, status: 'IDEA' };
      prisma.innovationProposal.create.mockResolvedValue(mockCreated);

      const result = await service.createProposal(input);
      expect(result.status).toBe('IDEA');
    });
  });

  describe('evaluateProposal', () => {
    it('should approve proposal with score >= 70', async () => {
      const mockEvaluated = { id: 'ip1', status: 'PILOT', score: 85 };
      prisma.innovationProposal.update.mockResolvedValue(mockEvaluated);

      const result = await service.evaluateProposal('ip1', 'eval1', 85, 'Great idea');
      expect(result.status).toBe('PILOT');
      expect(prisma.innovationProposal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'PILOT', score: 85 }),
        })
      );
    });

    it('should reject proposal with score < 70', async () => {
      const mockRejected = { id: 'ip1', status: 'REJECTED', score: 40 };
      prisma.innovationProposal.update.mockResolvedValue(mockRejected);

      const result = await service.evaluateProposal('ip1', 'eval1', 40, 'Needs improvement');
      expect(result.status).toBe('REJECTED');
      expect(prisma.innovationProposal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'REJECTED', score: 40 }),
        })
      );
    });
  });

  describe('deleteProposal', () => {
    it('should delete proposal', async () => {
      prisma.innovationProposal.delete.mockResolvedValue({ id: 'ip1' });
      await service.deleteProposal('ip1');
      expect(prisma.innovationProposal.delete).toHaveBeenCalledWith({ where: { id: 'ip1' } });
    });
  });

  // ── Summary ───────────────────────────────────────
  describe('getSummary', () => {
    it('should return combined project and proposal stats', async () => {
      prisma.researchProject.count
        .mockResolvedValueOnce(10) // totalProjects
        .mockResolvedValueOnce(3); // activeProjects
      prisma.innovationProposal.count
        .mockResolvedValueOnce(15) // totalProposals
        .mockResolvedValueOnce(5); // implementedProposals

      const result = await service.getSummary();
      expect(result).toEqual({
        totalProjects: 10,
        activeProjects: 3,
        totalProposals: 15,
        implementedProposals: 5,
      });
    });
  });
});
