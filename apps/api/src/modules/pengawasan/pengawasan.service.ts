import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class PengawasanService {
  // ==================== AUDITS ====================

  async createAudit(data: {
    title: string;
    description?: string;
    auditType: string;
    plannedDate: string;
    scope?: string;
    methodology?: string;
    unitId: string;
    leadAuditorId: string;
    strategicPlanId?: string;
    riskId?: string;
  }) {
    return prisma.internalAudit.create({
      data: {
        title: data.title,
        description: data.description,
        auditType: data.auditType,
        plannedDate: new Date(data.plannedDate),
        scope: data.scope,
        methodology: data.methodology,
        unit: { connect: { id: data.unitId } },
        leadAuditor: { connect: { id: data.leadAuditorId } },
        strategicPlan: data.strategicPlanId ? { connect: { id: data.strategicPlanId } } : undefined,
        risk: data.riskId ? { connect: { id: data.riskId } } : undefined,
      },
      include: {
        unit: { select: { id: true, name: true } },
        leadAuditor: { select: { id: true, name: true } },
        strategicPlan: { select: { id: true, title: true } },
        risk: { select: { id: true, code: true, category: true } },
        findings: true,
      },
    });
  }

  async getAudits(unitId: string, query: { status?: string; auditType?: string; strategicPlanId?: string; riskId?: string }) {
    const where: Prisma.InternalAuditWhereInput = { unitId };
    if (query.status) where.status = query.status as any;
    if (query.auditType) where.auditType = query.auditType;
    if (query.strategicPlanId) where.strategicPlanId = query.strategicPlanId;
    if (query.riskId) where.riskId = query.riskId;

    return prisma.internalAudit.findMany({
      where,
      include: {
        unit: { select: { id: true, name: true } },
        leadAuditor: { select: { id: true, name: true } },
        strategicPlan: { select: { id: true, title: true } },
        risk: { select: { id: true, code: true, category: true } },
        findings: {
          select: { id: true, severity: true, title: true },
        },
      },
      orderBy: { plannedDate: 'desc' },
    });
  }

  async getAuditById(id: string) {
    return prisma.internalAudit.findUnique({
      where: { id },
      include: {
        unit: { select: { id: true, name: true } },
        leadAuditor: { select: { id: true, name: true } },
        strategicPlan: { select: { id: true, title: true } },
        risk: { select: { id: true, code: true, category: true, riskLevel: true } },
        findings: {
          include: {
            responsible: { select: { id: true, name: true } },
            planObjective: { select: { id: true, title: true } },
            followUps: {
              include: {
                verifiedBy: { select: { id: true, name: true } },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async updateAudit(id: string, data: Prisma.InternalAuditUpdateInput) {
    return prisma.internalAudit.update({
      where: { id },
      data,
      include: {
        unit: { select: { id: true, name: true } },
        leadAuditor: { select: { id: true, name: true } },
      },
    });
  }

  async deleteAudit(id: string) {
    return prisma.internalAudit.delete({ where: { id } });
  }

  // ==================== FINDINGS ====================

  async createFinding(data: {
    auditId: string;
    findingNumber: string;
    title: string;
    description: string;
    severity: 'OBSERVATION' | 'MINOR' | 'MAJOR' | 'CRITICAL';
    category: string;
    evidence?: string;
    rootCause?: string;
    recommendation?: string;
    responsibleId?: string;
    dueDate?: string;
    planObjectiveId?: string;
  }) {
    return prisma.auditFinding.create({
      data: {
        audit: { connect: { id: data.auditId } },
        findingNumber: data.findingNumber,
        title: data.title,
        description: data.description,
        severity: data.severity,
        category: data.category,
        evidence: data.evidence,
        rootCause: data.rootCause,
        recommendation: data.recommendation,
        responsible: data.responsibleId ? { connect: { id: data.responsibleId } } : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        planObjective: data.planObjectiveId ? { connect: { id: data.planObjectiveId } } : undefined,
      },
      include: {
        responsible: { select: { id: true, name: true } },
        planObjective: { select: { id: true, title: true } },
      },
    });
  }

  async updateFinding(id: string, data: any) {
    const { responsibleId, planObjectiveId, ...rest } = data;
    const updateData: any = { ...rest };

    if (responsibleId) updateData.responsible = { connect: { id: responsibleId } };
    else if (responsibleId === null) updateData.responsible = { disconnect: true };

    if (planObjectiveId) updateData.planObjective = { connect: { id: planObjectiveId } };
    else if (planObjectiveId === null) updateData.planObjective = { disconnect: true };
    if (rest.dueDate) updateData.dueDate = new Date(rest.dueDate);

    return prisma.auditFinding.update({
      where: { id },
      data: updateData,
      include: {
        responsible: { select: { id: true, name: true } },
        planObjective: { select: { id: true, title: true } },
      },
    });
  }

  async deleteFinding(id: string) {
    return prisma.auditFinding.delete({ where: { id } });
  }

  // ==================== FOLLOW-UPS ====================

  async createFollowUp(data: {
    findingId: string;
    action: string;
    dueDate?: string;
    evidence?: string;
  }) {
    return prisma.auditFollowUp.create({
      data: {
        finding: { connect: { id: data.findingId } },
        action: data.action,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        evidence: data.evidence,
      },
    });
  }

  async updateFollowUp(id: string, data: any, verifiedById?: string) {
    const updateData: any = { ...data };

    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
    if (data.status === 'VERIFIED' && verifiedById) {
      updateData.verifiedBy = { connect: { id: verifiedById } };
      updateData.verifiedAt = new Date();
    }
    if (data.status === 'RESOLVED') {
      updateData.completedAt = new Date();
    }

    return prisma.auditFollowUp.update({
      where: { id },
      data: updateData,
      include: { verifiedBy: { select: { id: true, name: true } } },
    });
  }

  async deleteFollowUp(id: string) {
    return prisma.auditFollowUp.delete({ where: { id } });
  }

  // ==================== SUGGESTION ENGINE ====================

  async suggestAuditSchedules(unitId?: string) {
    // When unitId is omitted, query across all units in a single pair of DB queries
    // instead of fanning out per-unit (which caused up to 40+ queries).
    const unitFilter = unitId ? { unitId } : {};

    // 1. Get high risks from the Risk module
    const highRisks = await prisma.risk.findMany({
      where: {
        ...unitFilter,
        status: 'OPEN',
        riskLevel: { in: ['HIGH', 'EXTREME'] },
      },
      include: {
        strategicPlan: { select: { id: true, title: true } },
      },
    });

    if (highRisks.length === 0) return [];

    // 2. Batch-query all non-cancelled audits linked to these risks (avoids N+1)
    const riskIds = highRisks.map((r) => r.id);
    const existingAudits = await prisma.internalAudit.findMany({
      where: {
        ...unitFilter,
        riskId: { in: riskIds },
        status: { not: 'CANCELLED' },
      },
      select: { riskId: true },
    });
    const coveredRiskIds = new Set(existingAudits.map((a) => a.riskId));

    // 3. Suggest audits for risks that don't have a linked internal audit yet
    return highRisks
      .filter((risk) => !coveredRiskIds.has(risk.id))
      .map((risk) => ({
        riskId: risk.id,
        riskCode: risk.code,
        riskLevel: risk.riskLevel,
        suggestedTitle: `Audit Kepatuhan & Mitigasi: ${risk.code}`,
        suggestedDescription: `Audit internal khusus untuk memverifikasi efektivitas mitigasi risiko: ${risk.description}`,
        strategicPlanId: risk.strategicPlanId,
        strategicPlanTitle: risk.strategicPlan?.title,
        priority: risk.riskLevel === 'EXTREME' ? 'URGENT' : 'HIGH',
      }));
  }
}

export const pengawasanService = new PengawasanService();
