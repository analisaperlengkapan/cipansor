import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';
import { tataLaksanaService } from '../tatalaksana/tatalaksana.service';

export class LitbangService {
  // ── Research Projects ─────────────────────────────
  async getProjects(params: {
    unitId?: string;
    status?: string;
    category?: string;
  }) {
    const where: any = {};
    if (params.unitId) where.unitId = params.unitId;
    if (params.status) where.status = params.status;
    if (params.category) where.category = params.category;

    return prisma.researchProject.findMany({
      where,
      include: {
        leader: { select: { id: true, name: true } },
        milestones: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async getProject(id: string) {
    return prisma.researchProject.findUniqueOrThrow({
      where: { id },
      include: {
        leader: { select: { id: true, name: true } },
        milestones: { orderBy: { sortOrder: "asc" } },
      },
    });
  }

  async createProject(data: {
    unitId: string;
    title: string;
    abstract?: string;
    category: string;
    leaderId: string;
    startDate?: Date;
    endDate?: Date;
    budget?: number;
    budgetId?: string;
    fundingSource?: string;
    methodology?: string;
  }) {
    return prisma.researchProject.create({
      data: {
        ...data,
        budget: data.budget !== undefined ? new Prisma.Decimal(data.budget) : undefined,
      },
    });
  }

  async updateProject(
    id: string,
    data: Partial<{
      title: string;
      abstract: string;
      category: string;
      status: any;
      startDate: Date;
      endDate: Date;
      budget: number;
      budgetId: string;
      fundingSource: string;
      methodology: string;
      findings: string;
      publishedUrl: string;
      progress: number;
    }>
  ) {
    const updateData: any = { ...data };
    if (data.budget !== undefined) updateData.budget = new Prisma.Decimal(data.budget);

    const project = await prisma.researchProject.update({
      where: { id },
      data: updateData,
    });

    // Integration: If published, propose SOP from findings
    // Idempotency is handled within createDraftFromResearch by checking for existing researchId in title
    if (project.status === 'PUBLISHED' && project.findings) {
      await tataLaksanaService.createDraftFromResearch({
        unitId: project.unitId,
        researchId: project.id,
        title: project.title,
        findings: project.findings,
        createdById: project.leaderId,
      });
    }

    return project;
  }

  async deleteProject(id: string) {
    return prisma.researchProject.delete({ where: { id } });
  }

  // ── Milestones ────────────────────────────────────
  async createMilestone(data: {
    projectId: string;
    title: string;
    description?: string;
    dueDate?: Date;
    sortOrder?: number;
  }) {
    return prisma.$transaction(async (tx) => {
      const created = await tx.researchMilestone.create({ data });

      const milestones = await tx.researchMilestone.findMany({ where: { projectId: created.projectId } });
      const now = new Date();
      const completed = milestones.filter((m) => m.status === "COMPLETED").length;
      const progress = Math.round((completed / milestones.length) * 100);
      if (progress === 100) {
        const progressionStatuses = ['PROPOSAL', 'IN_PROGRESS', 'APPROVED'];
        const result = await tx.researchProject.updateMany({
          where: { id: created.projectId, status: { in: progressionStatuses } },
          data: { progress, status: 'COMPLETED', updatedAt: now },
        });
        if (result.count === 0) {
          await tx.researchProject.updateMany({
            where: { id: created.projectId, status: { notIn: [...progressionStatuses, 'CANCELLED'] } },
            data: { progress, updatedAt: now },
          });
        }
      } else {
        await tx.researchProject.updateMany({
          where: { id: created.projectId, status: { not: 'CANCELLED' } },
          data: { progress, updatedAt: now },
        });
      }

      return created;
    });
  }

  async updateMilestone(id: string, data: Partial<{
    title: string;
    description: string;
    dueDate: Date;
    completedAt: Date;
    status: string;
    sortOrder: number;
  }>) {
    const milestone = await prisma.$transaction(async (tx) => {
      const updated = await tx.researchMilestone.update({ where: { id }, data });

      const milestones = await tx.researchMilestone.findMany({ where: { projectId: updated.projectId } });
      const now = new Date();
      const completed = milestones.filter((m) => m.status === "COMPLETED").length;
      const progress = Math.round((completed / milestones.length) * 100);
      if (progress === 100) {
        const progressionStatuses = ['PROPOSAL', 'IN_PROGRESS', 'APPROVED'];
        const result = await tx.researchProject.updateMany({
          where: { id: updated.projectId, status: { in: progressionStatuses } },
          data: { progress, status: 'COMPLETED', updatedAt: now },
        });
        if (result.count === 0) {
          await tx.researchProject.updateMany({
            where: { id: updated.projectId, status: { notIn: [...progressionStatuses, 'CANCELLED'] } },
            data: { progress, updatedAt: now },
          });
        }
      } else {
        await tx.researchProject.updateMany({
          where: { id: updated.projectId, status: { not: 'CANCELLED' } },
          data: { progress, updatedAt: now },
        });
      }

      return updated;
    });

    return milestone;
  }

  async deleteMilestone(id: string) {
    await prisma.$transaction(async (tx) => {
      const milestone = await tx.researchMilestone.findUniqueOrThrow({ where: { id } });
      await tx.researchMilestone.delete({ where: { id } });
      const milestones = await tx.researchMilestone.findMany({ where: { projectId: milestone.projectId } });
      const now = new Date();
      if (milestones.length === 0) {
        await tx.researchProject.updateMany({
          where: { id: milestone.projectId, status: { not: 'CANCELLED' } },
          data: { progress: 0, updatedAt: now },
        });
        return;
      }
      const completed = milestones.filter((m) => m.status === "COMPLETED").length;
      const progress = Math.round((completed / milestones.length) * 100);
      if (progress === 100) {
        const progressionStatuses = ['PROPOSAL', 'IN_PROGRESS', 'APPROVED'];
        const result = await tx.researchProject.updateMany({
          where: { id: milestone.projectId, status: { in: progressionStatuses } },
          data: { progress, status: 'COMPLETED', updatedAt: now },
        });
        if (result.count === 0) {
          await tx.researchProject.updateMany({
            where: { id: milestone.projectId, status: { notIn: [...progressionStatuses, 'CANCELLED'] } },
            data: { progress, updatedAt: now },
          });
        }
      } else {
        await tx.researchProject.updateMany({
          where: { id: milestone.projectId, status: { not: 'CANCELLED' } },
          data: { progress, updatedAt: now },
        });
      }
    });
  }


  // ── Innovation Proposals ──────────────────────────
  async getProposals(params: {
    unitId?: string;
    status?: string;
    category?: string;
  }) {
    const where: any = {};
    if (params.unitId) where.unitId = params.unitId;
    if (params.status) where.status = params.status;
    if (params.category) where.category = params.category;

    return prisma.innovationProposal.findMany({
      where,
      include: {
        proposer: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getProposal(id: string) {
    return prisma.innovationProposal.findUniqueOrThrow({
      where: { id },
      include: {
        proposer: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    });
  }

  async createProposal(data: {
    unitId: string;
    title: string;
    description?: string;
    category: string;
    proposerId: string;
    impact?: string;
    resources?: string;
    timeline?: string;
  }) {
    return prisma.innovationProposal.create({ data });
  }

  async updateProposal(id: string, data: Partial<{
    title: string;
    description: string;
    category: string;
    status: any;
    impact: string;
    resources: string;
    timeline: string;
    score: number;
    feedback: string;
  }>) {
    return prisma.innovationProposal.update({ where: { id }, data });
  }

  async evaluateProposal(id: string, evaluatorId: string, score: number, feedback?: string) {
    return prisma.innovationProposal.update({
      where: { id },
      data: {
        status: score >= 70 ? ("PILOT" as any) : ("REJECTED" as any),
        score,
        feedback,
        approvedById: evaluatorId,
        approvedAt: new Date(),
      },
    });
  }

  async deleteProposal(id: string) {
    return prisma.innovationProposal.delete({ where: { id } });
  }

  async promoteProposal(id: string, data: {
    type: 'RESEARCH' | 'STRATEGY';
    objectiveId?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const proposal = await tx.innovationProposal.findUniqueOrThrow({
        where: { id },
      });

      if (data.type === 'RESEARCH') {
        const project = await tx.researchProject.create({
          data: {
            unitId: proposal.unitId,
            title: `[Inovasi] ${proposal.title}`,
            abstract: proposal.description,
            category: proposal.category,
            leaderId: proposal.proposerId,
            status: 'PROPOSAL' as any,
          }
        });

        await tx.innovationProposal.update({
          where: { id },
          data: { status: 'IMPLEMENTED' as any }
        });

        return project;
      }

      if (data.type === 'STRATEGY' && data.objectiveId) {
        const activity = await tx.planActivity.create({
          data: {
            objectiveId: data.objectiveId,
            title: `Implementasi Inovasi: ${proposal.title}`,
            description: proposal.description,
            status: 'PLANNED' as any,
          }
        });

        await tx.innovationProposal.update({
          where: { id },
          data: { status: 'IMPLEMENTED' as any }
        });

        return activity;
      }

      throw new Error("Tipe promosi tidak valid atau Objective ID tidak ditemukan");
    });
  }

  // ── Summary ───────────────────────────────────────
  async getSummary(unitId?: string) {
    const projectWhere = unitId ? { unitId } : {};
    const proposalWhere = unitId ? { unitId } : {};

    const [totalProjects, activeProjects, totalProposals, implementedProposals] =
      await Promise.all([
        prisma.researchProject.count({ where: projectWhere }),
        prisma.researchProject.count({ where: { ...projectWhere, status: "IN_PROGRESS" } }),
        prisma.innovationProposal.count({ where: proposalWhere }),
        prisma.innovationProposal.count({ where: { ...proposalWhere, status: "IMPLEMENTED" } }),
      ]);

    return { totalProjects, activeProjects, totalProposals, implementedProposals };
  }

  async getResearchSOPImpact() {
    const sops = await prisma.standardOperatingProcedure.findMany({
      where: {
        title: { contains: '(Litbang:' }
      },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
      }
    });

    const total = sops.length;
    const active = sops.filter(s => s.status === 'ACTIVE').length;

    return { total, active, sops: sops.slice(0, 5) };
  }

  async getProjectFinancialStatus(projectId: string) {
    const project = await prisma.researchProject.findUniqueOrThrow({
      where: { id: projectId },
      select: { unitId: true, budget: true, startDate: true, endDate: true, budgetId: true, budgetRel: { select: { accountId: true } } },
    });

    const budget = Number(project.budget || 0);

    if (project.budgetId && project.budgetRel?.accountId) {
      const aggregates = await prisma.journalEntry.aggregate({
        where: {
          unitId: project.unitId,
          accountId: project.budgetRel.accountId,
          date: {
            gte: project.startDate || undefined,
            lte: project.endDate || new Date(),
          },
        },
        _sum: { debit: true, credit: true },
      });

      const realization = (aggregates._sum.debit?.toNumber() || 0) - (aggregates._sum.credit?.toNumber() || 0);
      const percentage = budget > 0 ? Math.min(100, Math.max(0, (realization / budget) * 100)) : 0;

      return { budget, realization: Math.max(0, realization), percentage };
    }

    if (!project.startDate) return { budget, realization: 0, percentage: 0 };

    const aggregates = await prisma.journalEntry.aggregate({
      where: {
        unitId: project.unitId,
        date: {
          gte: project.startDate,
          lte: project.endDate || new Date(),
        },
        account: {
          type: { in: ['EXPENSE', 'ASSET'] },
        },
      },
      _sum: { debit: true, credit: true },
    });

    const realization = (aggregates._sum.debit?.toNumber() || 0) - (aggregates._sum.credit?.toNumber() || 0);
    const percentage = budget > 0 ? Math.min(100, Math.max(0, (realization / budget) * 100)) : 0;

    return {
      budget,
      realization: Math.max(0, realization),
      percentage,
    };
  }
}

export const litbangService = new LitbangService();
