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
        { id: '1', category: 'HIGH_POTENTIAL', currentRole: 'Teacher', user: { id: 'u1', name: 'User 1' }, assessments: [{ performanceRating: 'OUTSTANDING', potentialRating: 'OUTSTANDING', overallScore: 100 }] },
        { id: '2', category: 'HIGH_POTENTIAL', currentRole: 'Teacher', user: { id: 'u2', name: 'User 2' }, assessments: [{ performanceRating: 'EXCEEDS', potentialRating: 'EXCEEDS', overallScore: 80 }] },
        { id: '3', category: 'KEY_TALENT', currentRole: 'Staff', user: { id: 'u3', name: 'User 3' }, assessments: [] },
        { id: '4', category: 'EMERGING', currentRole: 'Staff', user: { id: 'u4', name: 'User 4' }, assessments: [] },
        { id: '5', category: 'SOLID_PERFORMER', currentRole: 'Admin', user: { id: 'u5', name: 'User 5' }, assessments: [] },
        { id: '6', category: 'NEEDS_DEVELOPMENT', currentRole: 'Admin', user: { id: 'u6', name: 'User 6' }, assessments: [] },
        { id: '7', category: 'INVALID', currentRole: 'Other', user: { id: 'u7', name: 'User 7' }, assessments: [] }, // Should be ignored
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
