import { Request, Response, NextFunction } from 'express';
import * as marketingService from './service';
import {
  createCampaignSchema,
  logInteractionSchema,
  updateCampaignSchema,
  getCampaignByCodeSchema,
  createLeadSchema,
  updateLeadSchema,
  queryLeadSchema,
  convertLeadSchema
} from './schema';

// Campaigns
export const createCampaign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createCampaignSchema.parse(req.body);
    const userId = (req as any).user.id;
    const campaign = await marketingService.createCampaign(data, userId);
    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
};

export const updateCampaign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateCampaignSchema.parse(req.body);
    const campaign = await marketingService.updateCampaign(id, data);
    res.json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
};

export const getCampaigns = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { unitId } = req.query;
    const campaigns = await marketingService.getCampaigns(unitId as string);
    res.json({ success: true, data: campaigns });
  } catch (error) {
    next(error);
  }
};

export const getCampaignById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const campaign = await marketingService.getCampaignById(id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }
    res.json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
};

export const getCampaignByCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = getCampaignByCodeSchema.parse(req.params);
    const campaign = await marketingService.getCampaignByCode(code);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }
    res.json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
};

// Leads
export const createLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createLeadSchema.parse(req.body);
    const userId = (req as any).user.id;
    const lead = await marketingService.createLead(data, userId);
    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

export const getLeads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = queryLeadSchema.parse(req.query);
    const { unitId } = req.query; // unitId might not be in queryLeadSchema but passed by frontend
    const result = await marketingService.getLeads(query, unitId as string);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getLeadById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const lead = await marketingService.getLeadById(id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    res.json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

export const updateLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateLeadSchema.parse(req.body);
    const lead = await marketingService.updateLead(id, data);
    res.json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

export const convertLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = convertLeadSchema.parse(req.body);
    const userId = (req as any).user.id;
    const registrant = await marketingService.convertLeadToRegistrant(id, data, userId);
    res.json({ success: true, data: registrant });
  } catch (error) {
    next(error);
  }
};

// Interactions & Dashboard
export const logInteraction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = logInteractionSchema.parse(req.body);
    const userId = (req as any).user.id;
    const interaction = await marketingService.logInteraction(data, userId);
    res.status(201).json({ success: true, data: interaction });
  } catch (error) {
    next(error);
  }
};

export const getInteractions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { registrantId, leadId } = req.query;
    if (registrantId) {
        const interactions = await marketingService.getInteractions('registrant', registrantId as string);
        return res.json({ success: true, data: interactions });
    }
    if (leadId) {
        const interactions = await marketingService.getInteractions('lead', leadId as string);
        return res.json({ success: true, data: interactions });
    }
    res.status(400).json({ success: false, message: 'Missing registrantId or leadId' });
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { unitId } = req.query;
    const stats = await marketingService.getDashboardStats(unitId as string);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

export const getRecentLeads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { unitId, limit } = req.query;
    const leads = await marketingService.getRecentLeads(
      unitId as string,
      limit ? parseInt(limit as string) : 5
    );
    res.json({ success: true, data: leads });
  } catch (error) {
    next(error);
  }
};

export const getUpcomingFollowUps = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { unitId, limit } = req.query;
    const tasks = await marketingService.getUpcomingFollowUps(
      unitId as string,
      limit ? parseInt(limit as string) : 5
    );
    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
};
