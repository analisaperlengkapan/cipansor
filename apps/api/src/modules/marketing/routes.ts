import { Router } from 'express';
import * as marketingController from './controller';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// Public routes
router.get('/public/campaigns/code/:code', marketingController.getCampaignByCode);

// Protected routes (require auth)
router.use(authenticate);

// Stats
router.get(
  '/stats',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  marketingController.getStats
);
router.get(
  '/leads/recent', // Still used for dashboard widget
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  marketingController.getRecentLeads
);
router.get(
  '/follow-ups',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER, UserRole.STAFF),
  marketingController.getUpcomingFollowUps
);

// Campaigns
router.post(
  '/campaigns',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  marketingController.createCampaign
);
router.get(
  '/campaigns',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  marketingController.getCampaigns
);
router.get(
  '/campaigns/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  marketingController.getCampaignById
);
router.patch(
  '/campaigns/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  marketingController.updateCampaign
);

// Leads
router.post(
  '/leads',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  marketingController.createLead
);
router.get(
  '/leads',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  marketingController.getLeads
);
router.get(
  '/leads/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  marketingController.getLeadById
);
router.patch(
  '/leads/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  marketingController.updateLead
);
router.post(
  '/leads/:id/convert',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  marketingController.convertLead
);

// Interactions
router.post(
  '/interactions',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER, UserRole.STAFF),
  marketingController.logInteraction
);
// New route using query params
router.get(
  '/interactions',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER, UserRole.STAFF),
  marketingController.getInteractions
);

// Deprecated route support (optional, but good for safety if frontend hasn't updated yet for registrants)
// We need a wrapper because controller expects query
router.get(
  '/interactions/:registrantId',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER, UserRole.STAFF),
  (req, res, next) => {
    req.query.registrantId = req.params.registrantId;
    marketingController.getInteractions(req, res, next);
  }
);

export default router;
