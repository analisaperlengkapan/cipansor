import { prisma } from '@/lib/prisma';
import {
  CreateResearchProposalInput,
  UpdateResearchProposalInput,
  CreateResearchOutputInput,
  UpdateResearchOutputInput,
  ResearchStatus
} from '@cipansor/shared';
import { Prisma } from '@prisma/client';

export class ResearchService {
  async createProposal(data: CreateResearchProposalInput, researcherId: string) {
    return prisma.researchProposal.create({
      data: {
        ...data,
        researcherId,
        status: 'DRAFT',
      },
      include: {
        researcher: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        unit: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  }

  async findAllProposals(params: {
    page: number;
    limit: number;
    search?: string;
    unitId?: string;
    academicYearId?: string;
    status?: string;
    category?: string;
    researcherId?: string;
  }) {
    const { page, limit, search, unitId, academicYearId, status, category, researcherId } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ResearchProposalWhereInput = {
      ...(unitId && { unitId }),
      ...(academicYearId && { academicYearId }),
      ...(status && { status: status as any }), // Cast as any because import might be enum vs string
      ...(category && { category: category as any }),
      ...(researcherId && { researcherId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { abstract: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      prisma.researchProposal.count({ where }),
      prisma.researchProposal.findMany({
        where,
        skip,
        take: limit,
        include: {
          researcher: {
            select: {
              id: true,
              name: true,
            }
          },
          unit: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findProposalById(id: string) {
    return prisma.researchProposal.findUnique({
      where: { id },
      include: {
        researcher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        unit: {
          select: {
            id: true,
            name: true
          }
        },
        outputs: true,
        reviewedBy: {
          select: {
            id: true,
            name: true
          }
        },
        approvedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  }

  async updateProposal(id: string, data: UpdateResearchProposalInput) {
    // We need to cast data to any because the generated Prisma types for enums might differ slightly
    // from the shared DTOs which are string unions, causing TS issues.
    return prisma.researchProposal.update({
      where: { id },
      data: data as any,
    });
  }

  async deleteProposal(id: string) {
    return prisma.researchProposal.delete({
      where: { id },
    });
  }

  // --- Research Outputs ---

  async createOutput(data: CreateResearchOutputInput, researcherId: string) {
    return prisma.researchOutput.create({
      data: {
        ...data,
        researcherId,
      } as any, // Cast for proposalId optional handling
    });
  }

  async findAllOutputs(params: {
    page: number;
    limit: number;
    search?: string;
    unitId?: string;
    researcherId?: string;
  }) {
    const { page, limit, search, unitId, researcherId } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ResearchOutputWhereInput = {
      ...(researcherId && { researcherId }),
      ...(unitId && { proposal: { unitId } }), // Filter by unit via proposal
      ...(search && {
        title: { contains: search, mode: 'insensitive' },
      }),
    };

    const [total, data] = await Promise.all([
      prisma.researchOutput.count({ where }),
      prisma.researchOutput.findMany({
        where,
        skip,
        take: limit,
        include: {
          researcher: {
            select: { id: true, name: true }
          },
          proposal: {
            select: { id: true, title: true }
          }
        },
        orderBy: { publicationDate: 'desc' },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateOutput(id: string, data: UpdateResearchOutputInput) {
    return prisma.researchOutput.update({
      where: { id },
      data: data as any,
    });
  }

  async deleteOutput(id: string) {
    return prisma.researchOutput.delete({
      where: { id },
    });
  }
}

export const researchService = new ResearchService();
