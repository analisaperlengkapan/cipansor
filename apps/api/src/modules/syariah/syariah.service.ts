import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class SyariahService {
  async createCompliance(data: {
    category: 'MUAMALAH' | 'TARBIYAH' | 'IBADAH' | 'AKHLAQ' | 'GOVERNANCE';
    title: string;
    description?: string;
    standard?: string;
    unitId: string;
  }) {
    return prisma.shariaCompliance.create({
      data: {
        category: data.category,
        title: data.title,
        description: data.description,
        standard: data.standard,
        unit: { connect: { id: data.unitId } },
      },
      include: {
        unit: { select: { id: true, name: true } },
      },
    });
  }

  async getCompliances(unitId: string, query: { category?: string; status?: string }) {
    const where: Prisma.ShariaComplianceWhereInput = { unitId };
    if (query.category) where.category = query.category as any;
    if (query.status) where.status = query.status as any;

    return prisma.shariaCompliance.findMany({
      where,
      include: {
        unit: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true } },
        audits: {
          select: { id: true, score: true, auditDate: true },
          orderBy: { auditDate: 'desc' },
          take: 3,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getComplianceById(id: string) {
    return prisma.shariaCompliance.findUnique({
      where: { id },
      include: {
        unit: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true } },
        audits: {
          include: {
            auditor: { select: { id: true, name: true } },
          },
          orderBy: { auditDate: 'desc' },
        },
      },
    });
  }

  async updateCompliance(id: string, data: any, reviewedById?: string) {
    const updateData: any = { ...data };
    if (data.nextReviewAt) updateData.nextReviewAt = new Date(data.nextReviewAt);
    if (reviewedById && (data.status || data.score !== undefined)) {
      updateData.reviewedBy = { connect: { id: reviewedById } };
      updateData.reviewedAt = new Date();
    }

    return prisma.shariaCompliance.update({
      where: { id },
      data: updateData,
      include: {
        unit: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
    });
  }

  async deleteCompliance(id: string) {
    return prisma.shariaCompliance.delete({ where: { id } });
  }

  // ==================== SHARIA AUDITS ====================

  async createShariaAudit(data: {
    complianceId: string;
    auditorId: string;
    auditDate: string;
    findings: string;
    recommendation?: string;
    score: number;
    evidence?: string;
  }) {
    const audit = await prisma.shariaAudit.create({
      data: {
        compliance: { connect: { id: data.complianceId } },
        auditor: { connect: { id: data.auditorId } },
        auditDate: new Date(data.auditDate),
        findings: data.findings,
        recommendation: data.recommendation,
        score: data.score,
        evidence: data.evidence,
      },
      include: {
        auditor: { select: { id: true, name: true } },
      },
    });

    // Update compliance score with latest audit result
    await prisma.shariaCompliance.update({
      where: { id: data.complianceId },
      data: {
        score: data.score,
        reviewedAt: new Date(),
        status: data.score >= 80 ? 'COMPLIANT' : data.score >= 50 ? 'PARTIALLY' : 'NON_COMPLIANT',
      },
    });

    return audit;
  }

  async getComplianceSummary(unitId: string) {
    const compliances = await prisma.shariaCompliance.findMany({
      where: { unitId },
      select: { status: true, category: true, score: true },
    });

    const summary = {
      total: compliances.length,
      compliant: compliances.filter((c) => c.status === 'COMPLIANT').length,
      partial: compliances.filter((c) => c.status === 'PARTIALLY').length,
      nonCompliant: compliances.filter((c) => c.status === 'NON_COMPLIANT').length,
      underReview: compliances.filter((c) => c.status === 'UNDER_REVIEW').length,
      averageScore:
        compliances.length > 0
          ? compliances.reduce((sum, c) => sum + (c.score || 0), 0) / compliances.length
          : 0,
      byCategory: {} as Record<string, { total: number; averageScore: number }>,
    };

    const categories = ['MUAMALAH', 'TARBIYAH', 'IBADAH', 'AKHLAQ', 'GOVERNANCE'];
    for (const cat of categories) {
      const items = compliances.filter((c) => c.category === cat);
      summary.byCategory[cat] = {
        total: items.length,
        averageScore: items.length > 0 ? items.reduce((s, i) => s + (i.score || 0), 0) / items.length : 0,
      };
    }

    return summary;
  }
}

export const syariahService = new SyariahService();
