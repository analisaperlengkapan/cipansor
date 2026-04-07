import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../lib/prisma';
import { talentaService } from './talenta.service';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    talentProfile: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('Talenta Service Enhancement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Talent Analytics', () => {
    it('should calculate correct distribution and percentages', async () => {
      const mockProfiles = [
        { category: 'HIGH_POTENTIAL' },
        { category: 'HIGH_POTENTIAL' },
        { category: 'KEY_TALENT' },
        { category: 'EMERGING' },
        { category: 'SOLID_PERFORMER' },
        { category: 'NEEDS_DEVELOPMENT' },
        { category: 'INVALID' }, // Should be ignored
      ];

      vi.mocked(prisma.talentProfile.findMany).mockResolvedValue(mockProfiles as any);

      const result = await talentaService.getTalentAnalytics('unit-1');

      expect(result.total).toBe(7);
      expect(result.distribution.HIGH_POTENTIAL).toBe(2);
      expect(result.distribution.KEY_TALENT).toBe(1);
      expect(result.percentages.HIGH_POTENTIAL).toBe(29); // 2/7 * 100
      expect(result.percentages.NEEDS_DEVELOPMENT).toBe(14); // 1/7 * 100
    });

    it('should handle empty profiles', async () => {
      vi.mocked(prisma.talentProfile.findMany).mockResolvedValue([]);

      const result = await talentaService.getTalentAnalytics('unit-1');

      expect(result.total).toBe(0);
      expect(result.distribution.HIGH_POTENTIAL).toBe(0);
      expect(result.percentages.HIGH_POTENTIAL).toBe(0);
    });
  });
});
