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
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, (UserRole as any).YAYASAN_ADMIN),
  marketingController.getStats
);
router.get(
  '/leads/recent',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, (UserRole as any).YAYASAN_ADMIN),
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
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, (UserRole as any).YAYASAN_ADMIN),
  marketingController.getCampaigns
);
router.get(
  '/campaigns/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, (UserRole as any).YAYASAN_ADMIN),
  marketingController.getCampaignById
);
router.patch(
  '/campaigns/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  marketingController.updateCampaign
);

// Interactions
router.post(
  '/interactions',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER, UserRole.STAFF),
  marketingController.logInteraction
);
router.get(
  '/interactions/:registrantId',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER, UserRole.STAFF),
  marketingController.getInteractions
);

export default router;
