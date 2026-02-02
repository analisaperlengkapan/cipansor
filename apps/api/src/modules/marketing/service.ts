import { prisma } from '@/lib/prisma';
import { CreateCampaignInput, LogInteractionInput, UpdateCampaignInput } from './schema';
import { Prisma } from '@prisma/client';

export const createCampaign = async (data: CreateCampaignInput, userId: string) => {
  const { unitId, ...rest } = data;
  // Ensure required fields are present and cast to correct type if needed
  return prisma.marketingCampaign.create({
    data: {
      name: rest.name,
      code: rest.code,
      description: rest.description,
      startDate: rest.startDate,
      endDate: rest.endDate,
      budget: rest.budget,
      unit: unitId ? { connect: { id: unitId } } : undefined,
      createdBy: { connect: { id: userId } },
    },
  });
};

export const updateCampaign = async (id: string, data: UpdateCampaignInput) => {
  return prisma.marketingCampaign.update({
    where: { id },
    data,
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
        select: { registrants: true },
      },
    },
  });
};

export const getCampaignById = async (id: string) => {
  return prisma.marketingCampaign.findUnique({
    where: { id },
    include: {
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
        select: { registrants: true },
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

export const logInteraction = async (data: LogInteractionInput, userId: string) => {
  const { registrantId, ...rest } = data;
  return prisma.marketingInteraction.create({
    data: {
      ...rest,
      registrant: { connect: { id: registrantId } },
      recordedBy: { connect: { id: userId } },
    },
  });
};

export const getInteractionsByRegistrant = async (registrantId: string) => {
  return prisma.marketingInteraction.findMany({
    where: { registrantId },
    orderBy: { date: 'desc' },
    include: {
      recordedBy: {
        select: { name: true },
      },
    },
  });
};

export const getDashboardStats = async (unitId?: string) => {
  const whereRegistrant: Prisma.RegistrantWhereInput = {};

  // 1. Sources Distribution
  const sources = await prisma.registrant.groupBy({
    by: ['source'],
    where: {
      ...whereRegistrant,
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
      _count: {
        select: { registrants: true },
      },
    },
    take: 5,
    orderBy: {
      registrants: {
        _count: 'desc',
      },
    },
  });

  // 3. Conversion Rates (Registered vs Accepted) by Source
  // This is complex, simplified here

  return {
    sources: sources.map((s) => ({ source: s.source, count: s._count._all })),
    topCampaigns: campaigns.map((c) => ({
      name: c.name,
      code: c.code,
      registrants: c._count.registrants,
      budget: c.budget,
    })),
  };
};

export const getRecentLeads = async (unitId?: string, limit: number = 5) => {
  const where: Prisma.RegistrantWhereInput = {};
  if (unitId) {
    where.admissionPeriod = { unitId };
  }

  return prisma.registrant.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      fullName: true,
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
  const whereRegistrant: Prisma.RegistrantWhereInput = {};
  if (unitId) {
    whereRegistrant.admissionPeriod = { unitId };
  }

  return prisma.marketingInteraction.findMany({
    where: {
      nextActionDate: { gte: new Date() },
      registrant: whereRegistrant,
    },
    orderBy: { nextActionDate: 'asc' },
    take: limit,
    include: {
      registrant: {
        select: {
          id: true,
          fullName: true,
          parentPhone: true,
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
  logInteraction,
  getInteractionsByRegistrant,
  getDashboardStats,
  getRecentLeads,
  getUpcomingFollowUps,
};
