
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
  };
}

export interface MarketingInteraction {
  id: string;
  registrantId: string;
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
}

export interface UpdateCampaignInput extends Partial<CreateCampaignInput> {
  isActive?: boolean;
}

export interface LogInteractionInput {
  registrantId: string;
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
    budget?: number | null;
  }[];
}
