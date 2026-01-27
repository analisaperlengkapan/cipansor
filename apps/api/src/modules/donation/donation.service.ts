import { prisma } from '@/lib/prisma';
import {
  PublicDonationType,
  DonationStatus,
  DonationPaymentMethod,
  CampaignStatus,
} from '@prisma/client';
import { AccountType, JournalReferenceType } from '@cipansor/shared';
import {
  CreateCampaignInput,
  UpdateCampaignInput,
  CreateDonationInput,
  VerifyDonationInput,
  UpdateDonationInput,
} from './donation.schema';

// =====================================
// CAMPAIGN SERVICE
// =====================================

export const campaignService = {
  /**
   * Get all campaigns with pagination
   */
  async findAll(params: { page: number; limit: number; status?: string; unitId?: string }) {
    const { page, limit, status, unitId } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      ...(status && { status: status as CampaignStatus }),
      ...(unitId && { unitId }),
    };

    const [data, total] = await Promise.all([
      prisma.donationCampaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          unit: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
      prisma.donationCampaign.count({ where }),
    ]);

    // Add progress percentage
    const campaignsWithProgress = data.map((campaign) => ({
      ...campaign,
      progressPercentage: campaign.targetAmount
        ? Math.min(
            100,
            Math.round((Number(campaign.collectedAmount) / Number(campaign.targetAmount)) * 100)
          )
        : null,
    }));

    return {
      data: campaignsWithProgress,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get public campaigns (for public page)
   */
  async findPublic() {
    const now = new Date();

    const campaigns = await prisma.donationCampaign.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        unit: { select: { id: true, name: true } },
      },
    });

    return campaigns.map((campaign) => ({
      id: campaign.id,
      title: campaign.title,
      slug: campaign.slug,
      description: campaign.description,
      imageUrl: campaign.imageUrl,
      targetAmount: campaign.targetAmount,
      collectedAmount: campaign.collectedAmount,
      donorCount: campaign.donorCount,
      progressPercentage: campaign.targetAmount
        ? Math.min(
            100,
            Math.round((Number(campaign.collectedAmount) / Number(campaign.targetAmount)) * 100)
          )
        : null,
      endDate: campaign.endDate,
      unit: campaign.unit,
    }));
  },

  /**
   * Get campaign by ID
   */
  async findById(id: string) {
    const campaign = await prisma.donationCampaign.findUnique({
      where: { id },
      include: {
        unit: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        donations: {
          where: { status: 'VERIFIED' },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            donorName: true,
            amount: true,
            message: true,
            isAnonymous: true,
            createdAt: true,
          },
        },
      },
    });

    if (!campaign) return null;

    return {
      ...campaign,
      progressPercentage: campaign.targetAmount
        ? Math.min(
            100,
            Math.round((Number(campaign.collectedAmount) / Number(campaign.targetAmount)) * 100)
          )
        : null,
      recentDonations: campaign.donations.map((d) => ({
        ...d,
        donorName: d.isAnonymous ? 'Hamba Allah' : d.donorName,
      })),
    };
  },

  /**
   * Get campaign by slug (for public)
   */
  async findBySlug(slug: string) {
    const campaign = await prisma.donationCampaign.findUnique({
      where: { slug },
    });

    if (!campaign) return null;

    return this.findById(campaign.id);
  },

  /**
   * Create campaign
   */
  async create(input: CreateCampaignInput, createdById: string) {
    return prisma.donationCampaign.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        ...input,
        createdById,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
      } as any,
      include: {
        unit: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
  },

  /**
   * Update campaign
   */
  async update(id: string, input: UpdateCampaignInput) {
    const data: any = { ...input };
    if (input.startDate) data.startDate = new Date(input.startDate);
    if (input.endDate) data.endDate = new Date(input.endDate);

    return prisma.donationCampaign.update({
      where: { id },
      data,
      include: {
        unit: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
  },

  /**
   * Soft delete campaign
   */
  async delete(id: string) {
    return prisma.donationCampaign.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'CLOSED' },
    });
  },
};

// =====================================
// DONATION SERVICE
// =====================================

export const donationService = {
  /**
   * Get all donations with pagination
   */
  async findAll(params: {
    page: number;
    limit: number;
    campaignId?: string;
    unitId?: string;
    status?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    isAnonymous?: boolean;
  }) {
    const { page, limit, campaignId, unitId, status, type, startDate, endDate, isAnonymous } =
      params;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(campaignId && { campaignId }),
      ...(unitId && { unitId }),
      ...(status && { status: status as DonationStatus }),
      ...(type && { type: type as PublicDonationType }),
      ...(isAnonymous !== undefined && { isAnonymous }),
    };

    if (startDate || endDate) {
      where.donatedAt = {};
      if (startDate) where.donatedAt.gte = new Date(startDate);
      if (endDate) where.donatedAt.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      prisma.donation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { donatedAt: 'desc' },
        include: {
          campaign: { select: { id: true, title: true, slug: true } },
          unit: { select: { id: true, name: true } },
          verifiedBy: { select: { id: true, name: true } },
        },
      }),
      prisma.donation.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get donation by ID
   */
  async findById(id: string) {
    return prisma.donation.findUnique({
      where: { id },
      include: {
        campaign: { select: { id: true, title: true, slug: true } },
        unit: { select: { id: true, name: true } },
        verifiedBy: { select: { id: true, name: true } },
      },
    });
  },

  /**
   * Create donation (admin)
   */
  async create(input: CreateDonationInput) {
    const donation = await prisma.donation.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        ...input,
        type: input.type as PublicDonationType,
        paymentMethod: input.paymentMethod as DonationPaymentMethod,
        status: 'PENDING',
      } as any,
      include: {
        campaign: { select: { id: true, title: true, slug: true } },
      },
    });

    return donation;
  },

  /**
   * Create public donation
   */
  async createPublic(input: CreateDonationInput) {
    return prisma.donation.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        ...input,
        type: input.type as PublicDonationType,
        paymentMethod: input.paymentMethod as DonationPaymentMethod,
        status: 'PENDING',
      } as any,
    });
  },

  /**
   * Verify donation and update campaign totals
   */
  async verify(id: string, verifiedById: string, input: VerifyDonationInput) {
    return prisma.$transaction(async (tx) => {
      const donation = await tx.donation.findUnique({
        where: { id },
        include: {
          campaign: true
        }
      });

      if (!donation) {
        throw new Error('Donation not found');
      }

      const updatedDonation = await tx.donation.update({
        where: { id },
        data: {
          status: input.status as DonationStatus,
          verifiedById,
          verifiedAt: new Date(),
          ...(input.notes && { notes: input.notes }),
        },
        include: {
          campaign: { select: { id: true, title: true, slug: true } },
          verifiedBy: { select: { id: true, name: true } },
        },
      });

      // If verified, update campaign totals
      if (input.status === 'VERIFIED' && donation.campaignId) {
        await tx.donationCampaign.update({
          where: { id: donation.campaignId },
          data: {
            collectedAmount: { increment: donation.amount },
            donorCount: { increment: 1 },
          },
        });
      }

      // =================================================================
      // INTEGRATION: Create Journal Entry for Accounting
      // =================================================================
      if (input.status === 'VERIFIED') {
        const unitId = donation.unitId || donation.campaign?.unitId;

        if (unitId) {
          // 1. Determine Debit Account (Asset: Bank/Cash)
          let assetAccount = await tx.accountCode.findFirst({
            where: {
              name: {
                contains: ['BANK_TRANSFER', 'QRIS', 'EWALLET'].includes(
                  donation.paymentMethod
                )
                  ? 'Bank'
                  : 'Kas',
                mode: 'insensitive',
              },
              type: AccountType.ASSET,
              isActive: true,
            },
          });

          // Fallback if not found
          if (!assetAccount) {
             assetAccount = await tx.accountCode.findFirst({
               where: {
                 type: AccountType.ASSET,
                 code: { startsWith: '1' }
               }
             });
          }

          // 2. Determine Credit Account (Revenue: Pendapatan Donasi)
          // Map DonationType to Account Keywords
          const revenueKeywords: Record<string, string> = {
            INFAK: 'Infak',
            ZAKAT: 'Zakat',
            WAKAF: 'Wakaf',
            BEASISWA: 'Beasiswa',
            PEMBANGUNAN: 'Pembangunan'
          };

          const keyword = Object.keys(revenueKeywords).find(k => donation.type.includes(k))
            ? revenueKeywords[Object.keys(revenueKeywords).find(k => donation.type.includes(k))!]
            : 'Donasi';

          let revenueAccount = await tx.accountCode.findFirst({
            where: {
              name: { contains: keyword, mode: 'insensitive' },
              type: AccountType.REVENUE,
              isActive: true,
            },
          });

          // Fallback to generic donation revenue
          if (!revenueAccount) {
            revenueAccount = await tx.accountCode.findFirst({
              where: {
                name: { contains: 'Donasi', mode: 'insensitive' },
                type: AccountType.REVENUE,
                isActive: true,
              },
            });
          }

          // Last Resort Fallback
          if (!revenueAccount) {
             revenueAccount = await tx.accountCode.findFirst({
               where: {
                 type: AccountType.REVENUE,
                 code: { startsWith: '4' }
               }
             });
          }

          if (assetAccount && revenueAccount) {
            const description = `Penerimaan Donasi ${donation.type} dari ${donation.isAnonymous ? 'Hamba Allah' : donation.donorName}`;

            // Create Debit Entry (Asset)
            await tx.journalEntry.create({
              data: {
                unitId,
                accountId: assetAccount.id,
                date: new Date(),
                description: `${description} (${donation.paymentMethod})`,
                debit: donation.amount,
                credit: 0,
                reference: donation.id,
                referenceType: 'DONATION',
                createdById: verifiedById,
              },
            });

            // Create Credit Entry (Revenue)
            await tx.journalEntry.create({
              data: {
                unitId,
                accountId: revenueAccount.id,
                date: new Date(),
                description: description,
                debit: 0,
                credit: donation.amount,
                reference: donation.id,
                referenceType: 'DONATION',
                createdById: verifiedById,
              },
            });
          } else {
            console.warn(`Accounting Integration Skipped for Donation ${id}: Accounts not found. Asset: ${assetAccount?.name}, Revenue: ${revenueAccount?.name}`);
          }
        }
      }

      return updatedDonation;
    });
  },

  /**
   * Update donation
   */
  async update(id: string, input: UpdateDonationInput) {
    return prisma.donation.update({
      where: { id },
      data: input,
      include: {
        campaign: { select: { id: true, title: true, slug: true } },
      },
    });
  },

  /**
   * Delete donation
   */
  async delete(id: string) {
    return prisma.donation.delete({
      where: { id },
    });
  },

  /**
   * Get donation statistics
   */
  async getStats(params: {
    campaignId?: string;
    unitId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { campaignId, unitId, type, startDate, endDate } = params;

    const where: any = {
      status: 'VERIFIED',
      ...(campaignId && { campaignId }),
      ...(unitId && { unitId }),
      ...(type && { type: type as PublicDonationType }),
    };

    if (startDate || endDate) {
      where.donatedAt = {};
      if (startDate) where.donatedAt.gte = new Date(startDate);
      if (endDate) where.donatedAt.lte = new Date(endDate);
    }

    const [totalDonations, totalAmount, byType, byPaymentMethod, pendingCount] = await Promise.all([
      prisma.donation.count({ where }),
      prisma.donation.aggregate({ where, _sum: { amount: true } }),
      prisma.donation.groupBy({
        by: ['type'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
      prisma.donation.groupBy({
        by: ['paymentMethod'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
      prisma.donation.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      totalDonations,
      totalAmount: totalAmount._sum.amount || 0,
      pendingVerification: pendingCount,
      byType: byType.map((t) => ({
        type: t.type,
        count: t._count,
        amount: t._sum.amount || 0,
      })),
      byPaymentMethod: byPaymentMethod.map((p) => ({
        method: p.paymentMethod,
        count: p._count,
        amount: p._sum.amount || 0,
      })),
    };
  },

  /**
   * Get monthly donation report
   */
  async getMonthlyReport(year: number) {
    const donations = await prisma.donation.findMany({
      where: {
        status: 'VERIFIED',
        donatedAt: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
      select: {
        amount: true,
        type: true,
        donatedAt: true,
      },
    });

    // Group by month
    const monthlyData: Record<number, { total: number; byType: Record<string, number> }> = {};

    for (let i = 0; i < 12; i++) {
      monthlyData[i] = { total: 0, byType: {} };
    }

    donations.forEach((d) => {
      const month = d.donatedAt.getMonth();
      monthlyData[month].total += Number(d.amount);
      monthlyData[month].byType[d.type] =
        (monthlyData[month].byType[d.type] || 0) + Number(d.amount);
    });

    return {
      year,
      months: Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        monthName: new Date(year, i).toLocaleString('id-ID', { month: 'long' }),
        total: monthlyData[i].total,
        byType: monthlyData[i].byType,
      })),
      yearTotal: donations.reduce((sum, d) => sum + Number(d.amount), 0),
    };
  },

  /**
   * Get recent donations for dashboard
   */
  async getRecent(limit: number = 10) {
    return prisma.donation.findMany({
      where: { status: 'VERIFIED' },
      orderBy: { donatedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        donorName: true,
        amount: true,
        type: true,
        isAnonymous: true,
        donatedAt: true,
        campaign: { select: { id: true, title: true, slug: true } },
      },
    });
  },
};

export default {
  campaign: campaignService,
  donation: donationService,
};
