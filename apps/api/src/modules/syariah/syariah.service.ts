import { prisma } from '@/lib/prisma';
import { ShariaCompliance, Prisma } from '@prisma/client';
import { Errors } from '@/middleware/error';

export class SyariahService {
  static async createCompliance(data: Prisma.ShariaComplianceCreateInput) {
    const compliance = await prisma.shariaCompliance.create({ data });

    // Auto-escalate if score is low
    if (compliance.score !== null && compliance.score < 70) {
      await this.handleLowCompliance(compliance);
    }

    return compliance;
  }

  static async updateCompliance(id: string, data: Prisma.ShariaComplianceUpdateInput) {
    const compliance = await prisma.shariaCompliance.update({
      where: { id },
      data,
    });

    if (compliance.score !== null && compliance.score < 70) {
      await this.handleLowCompliance(compliance);
    }

    return compliance;
  }

  private static async handleLowCompliance(compliance: ShariaCompliance) {
    try {
      // Find or create an internal audit for this unit
      let audit = await prisma.internalAudit.findFirst({
        where: {
          unitId: compliance.unitId,
          status: 'PLANNED',
          auditType: 'SYARIAH'
        }
      });

      if (!audit) {
        audit = await prisma.internalAudit.create({
          data: {
            unitId: compliance.unitId,
            title: 'Audit Kepatuhan Syariah Otomatis',
            description: 'Audit dipicu oleh skor kepatuhan rendah.',
            auditType: 'SYARIAH',
            status: 'PLANNED',
            plannedDate: new Date(),
            leadAuditorId: (compliance as any).reviewedById || 'system',
          }
        });
      }

      await prisma.auditFinding.create({
        data: {
          auditId: audit.id,
          findingNumber: `SYR-${compliance.category}-${Date.now()}`,
          title: `Kepatuhan Rendah: ${compliance.title}`,
          description: `Skor kepatuhan ${compliance.score} berada di bawah ambang batas minimum (70).`,
          severity: 'MAJOR',
          category: 'SHARIA_COMPLIANCE',
        }
      });
    } catch (err) {
      console.error('[Syariah] Failed to handle low compliance escalation:', err);
    }
  }

  static async getUnitComplianceSummary(unitId: string) {
    const compliances = await prisma.shariaCompliance.findMany({
      where: { unitId },
    });

    const totalScore = compliances.reduce((sum, c) => sum + (c.score || 0), 0);
    const avgScore = compliances.length > 0 ? totalScore / compliances.length : 0;

    return {
      unitId,
      averageScore: Math.round(avgScore * 100) / 100,
      totalItems: compliances.length,
      compliantItems: compliances.filter(c => c.status === 'COMPLIANT').length,
      nonCompliantItems: compliances.filter(c => c.status === 'NON_COMPLIANT').length,
    };
  }
}
