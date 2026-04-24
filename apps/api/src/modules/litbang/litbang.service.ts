import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';

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
        budget: data.budget ? new Prisma.Decimal(data.budget) : undefined,
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

    return prisma.researchProject.update({
      where: { id },
      data: updateData,
    });
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
    // Wrap create and progress recalculation in a transaction so the project's
    // progress is always consistent with its milestones. Without this, adding a
    // new non-COMPLETED milestone to a project that was auto-COMPLETED (100%
    // progress) would leave the progress and status stale.
    return prisma.$transaction(async (tx) => {
      const created = await tx.researchMilestone.create({ data });

      // Inline recalculation using the transaction client
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
    // Wrap update and progress recalculation in a transaction so the project's
    // progress is always consistent with its milestones (matching deleteMilestone).
    const milestone = await prisma.$transaction(async (tx) => {
      const updated = await tx.researchMilestone.update({ where: { id }, data });

      // Inline recalculation using the transaction client
      const milestones = await tx.researchMilestone.findMany({ where: { projectId: updated.projectId } });
      const now = new Date();
      // Note: milestones.length === 0 is unreachable here because we just updated
      // a milestone above, so at least one always exists. The guard is kept in
      // deleteMilestone where it IS reachable.
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
    // Wrap delete and progress recalculation in a transaction so the project's
    // progress is always consistent with its milestones.
    await prisma.$transaction(async (tx) => {
      const milestone = await tx.researchMilestone.findUniqueOrThrow({ where: { id } });
      await tx.researchMilestone.delete({ where: { id } });
      // Inline recalculation using the transaction client
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
        status: score >= 70 ? "PILOT" : "REJECTED",
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

  async getProjectFinancialStatus(projectId: string) {
    const project = await prisma.researchProject.findUniqueOrThrow({
      where: { id: projectId },
      select: { unitId: true, budget: true, startDate: true, endDate: true, budgetId: true, budgetRel: { select: { accountId: true } } },
    });

    const budget = Number(project.budget || 0);

    // Best Practice: If the research project is explicitly linked to a budget code,
    // we use that for precise tracking. Otherwise, we fallback to unit-level
    // aggregation during the project dates (legacy behavior).
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
