import { describe, it, expect, vi, beforeEach } from 'vitest';
import { socialService } from '../../../../src/modules/social-service/social-service.service';
import { prisma } from '../../../../src/lib/prisma';

vi.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    socialServiceOrder: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    socialServiceTeam: {
      create: vi.fn(),
    },
    socialServiceMaterial: {
      create: vi.fn(),
    },
    asset: {
      update: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}));

describe('SocialService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a social service order', async () => {
    const orderData = {
      unitId: 'unit-1',
      type: 'FUNERAL',
      requesterName: 'John Doe',
      requesterPhone: '08123456789',
      address: 'Somewhere',
      scheduledAt: new Date().toISOString(),
    };
    (prisma.socialServiceOrder.create as any).mockResolvedValue({ id: 'order-1', ...orderData });

    const result = await socialService.createOrder(orderData);

    expect(result.id).toBe('order-1');
    expect(prisma.socialServiceOrder.create).toHaveBeenCalled();
  });
});
