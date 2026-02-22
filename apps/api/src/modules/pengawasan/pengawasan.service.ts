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
      },
      include: {
        unit: { select: { id: true, name: true } },
        leadAuditor: { select: { id: true, name: true } },
        findings: true,
      },
    });
  }

  async getAudits(unitId: string, query: { status?: string; auditType?: string }) {
    const where: Prisma.InternalAuditWhereInput = { unitId };
    if (query.status) where.status = query.status as any;
    if (query.auditType) where.auditType = query.auditType;

    return prisma.internalAudit.findMany({
      where,
      include: {
        unit: { select: { id: true, name: true } },
        leadAuditor: { select: { id: true, name: true } },
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
        findings: {
          include: {
            responsible: { select: { id: true, name: true } },
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
      },
      include: {
        responsible: { select: { id: true, name: true } },
      },
    });
  }

  async updateFinding(id: string, data: any) {
    const { responsibleId, ...rest } = data;
    const updateData: any = { ...rest };

    if (responsibleId) updateData.responsible = { connect: { id: responsibleId } };
    else if (responsibleId === null) updateData.responsible = { disconnect: true };
    if (rest.dueDate) updateData.dueDate = new Date(rest.dueDate);

    return prisma.auditFinding.update({
      where: { id },
      data: updateData,
      include: { responsible: { select: { id: true, name: true } } },
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
}

export const pengawasanService = new PengawasanService();
