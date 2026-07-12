import { z } from 'zod';

export const SocialServiceType = z.enum(['FUNERAL', 'AMBULANCE', 'DISASTER_RELIEF', 'OTHER']);

export const createSocialServiceOrderSchema = z.object({
  unitId: z.string().uuid(),
  type: SocialServiceType,
  requesterName: z.string().min(2),
  requesterPhone: z.string().min(10),
  address: z.string(),
  scheduledAt: z.string().datetime(),
  notes: z.string().optional(),
  totalCost: z.number().optional(),
  isSubsidized: z.boolean().optional(),
});

export const assignTeamSchema = z.object({
  orderId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.string().optional(),
});

export const addMaterialSchema = z.object({
  orderId: z.string().uuid(),
  assetId: z.string().uuid(),
  quantity: z.number().min(1),
  notes: z.string().optional(),
});
