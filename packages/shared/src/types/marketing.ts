export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  CONVERTED = 'CONVERTED',
  LOST = 'LOST',
  JUNK = 'JUNK',
}

export interface MarketingCampaign {
  id: string;
  unitId?: string | null;
  name: string;
  code: string;
  description?: string | null;
  startDate: string; // ISO Date
  endDate?: string | null; // ISO Date
  budget?: number | null; // Decimal in DB, number in JS
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Relations
  _count?: {
    registrants: number;
    leads: number;
  };
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  source?: string | null;
  status: LeadStatus;
  interest?: string | null;
  notes?: string | null;
  campaignId?: string | null;
  registrantId?: string | null;
  createdById: string;
  assignedToId?: string | null;
  createdAt: string;
  updatedAt: string;
  // Relations
  campaign?: {
    id: string;
    name: string;
    code: string;
  } | null;
  assignedTo?: {
    id: string;
    name: string;
  } | null;
  interactions?: MarketingInteraction[];
}

export interface MarketingInteraction {
  id: string;
  registrantId?: string | null;
  leadId?: string | null;
  date: string;
  type: string; // CALL, WA, VISIT, etc.
  notes?: string | null;
  nextActionDate?: string | null;
  recordedById: string;
  createdAt: string;
  updatedAt: string;
  recordedBy?: {
    name: string;
  };
}

export interface CreateCampaignInput {
  unitId?: string;
  name: string;
  code: string;
  description?: string;
  startDate: string;
  endDate?: string;
  budget?: number;
  targetLeads?: number;
}

export interface UpdateCampaignInput extends Partial<CreateCampaignInput> {
  isActive?: boolean;
}

export interface CreateLeadInput {
  name: string;
  phone: string;
  email?: string;
  source?: string;
  interest?: string;
  campaignId?: string;
  notes?: string;
}

export interface UpdateLeadInput extends Partial<CreateLeadInput> {
  status?: LeadStatus;
  assignedToId?: string;
}

export interface LogInteractionInput {
  registrantId?: string;
  leadId?: string;
  date: string;
  type: string;
  notes?: string;
  nextActionDate?: string;
}

export interface MarketingStats {
  sources: { source: string; count: number }[];
  topCampaigns: {
    name: string;
    code: string;
    registrants: number;
    leads: number;
    conversionRate: number;
    budget?: number | null;
  }[];
  funnel: Record<string, number>;
}
