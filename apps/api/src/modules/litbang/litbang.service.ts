import { prisma } from '../../lib/prisma';

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
    fundingSource?: string;
    methodology?: string;
  }) {
    return prisma.researchProject.create({ data: { ...data, budget: data.budget as any } });
  }

  async updateProject(id: string, data: Partial<{
    title: string;
    abstract: string;
    category: string;
    status: any;
    startDate: Date;
    endDate: Date;
    budget: number;
    fundingSource: string;
    methodology: string;
    findings: string;
    publishedUrl: string;
    progress: number;
  }>) {
    return prisma.researchProject.update({ where: { id }, data: data as any });
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
    return prisma.researchMilestone.create({ data });
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
      if (milestones.length === 0) {
        await tx.researchProject.updateMany({
          where: { id: updated.projectId, status: { not: 'CANCELLED' } },
          data: { progress: 0, updatedAt: now },
        });
        return updated;
      }
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
}

export const litbangService = new LitbangService();
