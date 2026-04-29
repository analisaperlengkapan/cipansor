import { Request, Response, NextFunction } from 'express';
import * as marketingService from './service';
import { calculateCampaignROI } from './roi.service';
import {
  createCampaignSchema,
  logInteractionSchema,
  updateCampaignSchema,
  getCampaignByCodeSchema,
} from './schema';

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

export const getROIStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { unitId } = req.query;
    const user = (req as any).user;

    // Unit-level authorization: a UNIT_ADMIN must not be able to query
    // another unit's marketing ROI by guessing/knowing its unitId.
    // SUPER_ADMIN and YAYASAN_ADMIN can scope to any (or all) unit(s).
    if (
      user &&
      user.role !== 'SUPER_ADMIN' &&
      user.role !== 'YAYASAN_ADMIN' &&
      unitId &&
      user.unitId !== unitId
    ) {
      return res
        .status(403)
        .json({ success: false, error: 'Access to this unit is not allowed' });
    }

    const stats = await calculateCampaignROI(unitId as string);
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
    const { registrantId } = req.params;
    const interactions = await marketingService.getInteractionsByRegistrant(registrantId);
    res.json({ success: true, data: interactions });
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
