import { prisma } from '@/lib/prisma';
import {
  CreateCampaignInput,
  LogInteractionInput,
  UpdateCampaignInput,
  CreateLeadInput,
  UpdateLeadInput,
  QueryLeadInput,
  ConvertLeadInput,
} from './schema';
import { Prisma, LeadStatus } from '@prisma/client';
import { createRegistrant } from '../psb/service';

// =====================================
// CAMPAIGNS
// =====================================

export const createCampaign = async (data: CreateCampaignInput, userId: string) => {
  return prisma.marketingCampaign.create({
    data: {
      unitId: data.unitId,
      name: data.name,
      code: data.code,
      description: data.description,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      budget: data.budget ? new Prisma.Decimal(data.budget) : undefined,
      targetLeads: data.targetLeads,
      createdById: userId,
    },
  });
};

export const updateCampaign = async (id: string, data: UpdateCampaignInput) => {
  return prisma.marketingCampaign.update({
    where: { id },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      budget: data.budget ? new Prisma.Decimal(data.budget) : undefined,
    },
  });
};

export const getCampaigns = async (unitId?: string) => {
  const where: Prisma.MarketingCampaignWhereInput = {};
  if (unitId) {
    where.unitId = unitId;
  }
  return prisma.marketingCampaign.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { registrants: true, leads: true },
      },
    },
  });
};

export const getCampaignById = async (id: string) => {
  return prisma.marketingCampaign.findUnique({
    where: { id },
    include: {
      leads: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
      registrants: {
        select: {
          id: true,
          fullName: true,
          status: true,
          createdAt: true,
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: { registrants: true, leads: true },
      },
    },
  });
};

export const getCampaignByCode = async (code: string) => {
  return prisma.marketingCampaign.findFirst({
    where: {
      code: {
        equals: code,
        mode: 'insensitive',
      },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
    },
  });
};

// =====================================
// LEADS
// =====================================

export const createLead = async (data: CreateLeadInput, userId: string) => {
  return prisma.lead.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email,
      source: data.source,
      interest: data.interest,
      campaignId: data.campaignId,
      notes: data.notes,
      status: LeadStatus.NEW,
      createdById: userId,
    },
  });
};

export const getLeads = async (params: QueryLeadInput, unitId?: string) => {
  const { page, limit, status, campaignId, search } = params;
  const skip = (page - 1) * limit;
  const where: Prisma.LeadWhereInput = {};

  if (unitId) {
    where.campaign = { unitId };
  }

  if (status) where.status = status;
  if (campaignId) where.campaignId = campaignId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        campaign: { select: { id: true, name: true, code: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    }),
    prisma.lead.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getLeadById = async (id: string) => {
  return prisma.lead.findUnique({
    where: { id },
    include: {
      campaign: true,
      interactions: {
        orderBy: { date: 'desc' },
        include: { recordedBy: { select: { name: true } } },
      },
      registrant: { select: { id: true, registrationNo: true, status: true } },
    },
  });
};

export const updateLead = async (id: string, data: UpdateLeadInput) => {
  return prisma.lead.update({
    where: { id },
    data,
  });
};

export const convertLeadToRegistrant = async (
  leadId: string,
  registrantData: ConvertLeadInput,
  userId: string // eslint-disable-line @typescript-eslint/no-unused-vars
) => {
  return prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new Error('Lead not found');
    if (lead.registrantId) throw new Error('Lead already converted');

    // Use values from lead if not provided, though validation schema might enforce them.
    // source should default to lead.source or LEAD_CONVERSION
    const dataToCreate = {
      ...registrantData,
      source: lead.source || registrantData.source || 'LEAD_CONVERSION',
      campaignId: lead.campaignId || registrantData.campaignId,
    };

    const registrant = await createRegistrant(dataToCreate as any, tx);

    await tx.lead.update({
      where: { id: leadId },
      data: {
        status: LeadStatus.CONVERTED,
        registrantId: registrant.id,
      },
    });

    return registrant;
  });
};

// =====================================
// INTERACTIONS
// =====================================

export const logInteraction = async (data: LogInteractionInput, userId: string) => {
  return prisma.marketingInteraction.create({
    data: {
      registrantId: data.registrantId,
      leadId: data.leadId,
      type: data.type,
      notes: data.notes,
      date: new Date(data.date),
      nextActionDate: data.nextActionDate ? new Date(data.nextActionDate) : undefined,
      recordedById: userId,
    },
  });
};

export const getInteractions = async (entityType: 'registrant' | 'lead', entityId: string) => {
  const where: Prisma.MarketingInteractionWhereInput = {};
  if (entityType === 'registrant') {
    where.registrantId = entityId;
  } else {
    where.leadId = entityId;
  }

  return prisma.marketingInteraction.findMany({
    where,
    orderBy: { date: 'desc' },
    include: {
      recordedBy: {
        select: { name: true },
      },
    },
  });
};

// =====================================
// STATS & DASHBOARD
// =====================================

export const getDashboardStats = async (unitId?: string) => {
  const whereLead: Prisma.LeadWhereInput = {};
  if (unitId) {
    whereLead.campaign = { unitId };
  }

  // 1. Sources Distribution (from Leads)
  const sources = await prisma.lead.groupBy({
    by: ['source'],
    where: {
      ...whereLead,
      source: { not: null },
    },
    _count: {
      _all: true,
    },
  });

  // 2. Campaign Performance
  const campaigns = await prisma.marketingCampaign.findMany({
    where: unitId ? { unitId } : {},
    select: {
      id: true,
      name: true,
      code: true,
      budget: true,
      targetLeads: true,
      _count: {
        select: { leads: true, registrants: true },
      },
    },
    take: 5,
    orderBy: {
      leads: {
        _count: 'desc',
      },
    },
  });

  // 3. Lead Funnel
  const funnel = await prisma.lead.groupBy({
    by: ['status'],
    where: whereLead,
    _count: { _all: true },
  });

  return {
    sources: sources.map((s) => ({ source: s.source, count: s._count._all })),
    topCampaigns: campaigns.map((c) => ({
      name: c.name,
      code: c.code,
      leads: c._count.leads,
      registrants: c._count.registrants,
      conversionRate: c._count.leads > 0 ? (c._count.registrants / c._count.leads) * 100 : 0,
      budget: c.budget,
    })),
    funnel: funnel.reduce((acc, curr) => ({ ...acc, [curr.status]: curr._count._all }), {} as Record<string, number>),
  };
};

// Deprecated or Aliased for Backward Compatibility?
// getRecentLeads used to return Registrants. Now we should return Leads for the Leads dashboard.
// But if other parts use it, it might break.
// The name "getRecentLeads" implies Leads. Registrants are Applicants.
// I will change it to return Leads.

export const getRecentLeads = async (unitId?: string, limit: number = 5) => {
  const where: Prisma.LeadWhereInput = {};
  if (unitId) {
    where.campaign = { unitId };
  }

  return prisma.lead.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      name: true,
      createdAt: true,
      status: true,
      source: true,
      campaign: {
        select: { name: true, code: true },
      },
    },
  });
};

export const getUpcomingFollowUps = async (unitId?: string, limit: number = 5) => {
  const whereLead: Prisma.LeadWhereInput = {};
  if (unitId) {
    whereLead.campaign = { unitId };
  }

  // Fetch interactions linked to Leads primarily
  return prisma.marketingInteraction.findMany({
    where: {
      nextActionDate: { gte: new Date() },
      lead: whereLead,
    },
    orderBy: { nextActionDate: 'asc' },
    take: limit,
    include: {
      lead: {
        select: {
          id: true,
          name: true,
          phone: true,
          status: true,
        },
      },
    },
  });
};

export default {
  createCampaign,
  updateCampaign,
  getCampaigns,
  getCampaignById,
  getCampaignByCode,
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  convertLeadToRegistrant,
  logInteraction,
  getInteractions,
  getDashboardStats,
  getRecentLeads,
  getUpcomingFollowUps,
};
