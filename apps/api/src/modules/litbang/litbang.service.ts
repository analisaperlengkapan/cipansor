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
    const milestone = await prisma.researchMilestone.update({ where: { id }, data });

    // Recalculate project progress based on milestones
    await this.recalculateProgress(milestone.projectId);

    return milestone;
  }

  async deleteMilestone(id: string) {
    const milestone = await prisma.researchMilestone.findUniqueOrThrow({ where: { id } });
    await prisma.researchMilestone.delete({ where: { id } });
    await this.recalculateProgress(milestone.projectId);
  }

  private async recalculateProgress(projectId: string) {
    const milestones = await prisma.researchMilestone.findMany({ where: { projectId } });
    if (milestones.length === 0) return;

    const completed = milestones.filter((m) => m.status === "COMPLETED").length;
    const progress = Math.round((completed / milestones.length) * 100);

    if (progress === 100) {
      // Auto-complete only if the project is still in a progression state.
      // This avoids overriding intentional statuses like PUBLISHED or ON_HOLD.
      const progressionStatuses = ['PROPOSAL', 'IN_PROGRESS', 'APPROVED'];
      const result = await prisma.researchProject.updateMany({
        where: { id: projectId, status: { in: progressionStatuses } },
        data: { progress, status: 'COMPLETED' },
      });
      // For projects already in a non-progression state (except CANCELLED), only update progress
      if (result.count === 0) {
        await prisma.researchProject.updateMany({
          where: { id: projectId, status: { notIn: [...progressionStatuses, 'CANCELLED'] } },
          data: { progress },
        });
      }
    } else {
      await prisma.researchProject.updateMany({
        where: { id: projectId, status: { not: 'CANCELLED' } },
        data: { progress },
      });
    }
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
