import { prisma } from '@/lib/prisma';
import {
  CreateQualityEvidenceInput,
  QualityDashboardSummary,
  QualityStandardType,
} from '@cipansor/shared';

export const qualityService = {
  // Get all standards with indicators
  getAllStandards: async () => {
    return prisma.qualityStandard.findMany({
      include: {
        indicators: {
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: {
              select: { evidences: true },
            },
          },
        },
      },
      orderBy: { type: 'asc' },
    });
  },

  // Get standard details with evidence for a specific unit
  getStandardDetails: async (standardId: string, unitId: string, academicYearId: string) => {
    return prisma.qualityStandard.findUnique({
      where: { id: standardId },
      include: {
        indicators: {
          orderBy: { sortOrder: 'asc' },
          include: {
            evidences: {
              where: {
                unitId,
                academicYearId,
              },
              include: {
                uploadedBy: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });
  },

  // Upload evidence
  createEvidence: async (data: CreateQualityEvidenceInput, userId: string) => {
    return prisma.qualityEvidence.create({
      data: {
        unitId: data.unitId,
        indicatorId: data.indicatorId,
        academicYearId: data.academicYearId,
        name: data.name,
        fileUrl: data.fileUrl,
        description: data.description,
        uploadedById: userId,
      },
    });
  },

  // Delete evidence
  deleteEvidence: async (evidenceId: string) => {
    return prisma.qualityEvidence.delete({
      where: { id: evidenceId },
    });
  },

  // Get dashboard summary (compliance per standard)
  getDashboardSummary: async (
    unitId: string,
    academicYearId: string
  ): Promise<QualityDashboardSummary[]> => {
    const standards = await prisma.qualityStandard.findMany({
      include: {
        indicators: {
          include: {
            _count: {
              select: {
                evidences: {
                  where: {
                    unitId,
                    academicYearId,
                  },
                },
              },
            },
          },
        },
      },
    });

    return standards.map((std) => {
      const totalIndicators = std.indicators.length;
      // An indicator is "compliant" if it has at least one evidence uploaded
      const compliantIndicators = std.indicators.filter((ind) => ind._count.evidences > 0).length;

      return {
        id: std.id,
        standardType: std.type as unknown as QualityStandardType,
        standardName: std.name,
        totalIndicators,
        uploadedEvidenceCount: std.indicators.reduce((acc, curr) => acc + curr._count.evidences, 0),
        compliancePercentage:
          totalIndicators > 0 ? (compliantIndicators / totalIndicators) * 100 : 0,
      };
    });
  },
};
