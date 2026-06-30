import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as accreditationService from './accreditation.service';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    unit: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    teacher: {
      aggregate: vi.fn(),
      count: vi.fn(),
    },
    student: {
      aggregate: vi.fn(),
    },
    dormitory: {
      findMany: vi.fn(),
    },
    class: {
      count: vi.fn(),
    },
    invoice: {
      aggregate: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe('AccreditationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUnitAccreditationStatus', () => {
    it('should return unit status and statistics', async () => {
      const mockUnit = {
        id: 'unit-1',
        name: 'SMP IT Test',
        accreditation: 'B',
        npsn: '12345678',
      };

      (prisma.unit.findUnique as any).mockResolvedValue(mockUnit);
      (prisma.teacher.aggregate as any).mockResolvedValue({ _count: 20 });
      (prisma.teacher.count as any).mockResolvedValue(15);
      (prisma.student.aggregate as any).mockResolvedValue({ _count: 200 });
      (prisma.dormitory.findMany as any).mockResolvedValue([]);
      (prisma.class.count as any).mockResolvedValue(10);
      (prisma.invoice.aggregate as any).mockResolvedValue({ _sum: { amount: 500000000 } });

      const result = await accreditationService.getUnitAccreditationStatus('unit-1');

      expect(result.unit.name).toBe('SMP IT Test');
      expect(result.statistics.teachers.total).toBe(20);
      expect(result.statistics.teachers.certificationRate).toBe(75);
    });

    it('should throw error if unit not found', async () => {
      (prisma.unit.findUnique as any).mockResolvedValue(null);
      await expect(accreditationService.getUnitAccreditationStatus('invalid')).rejects.toThrow('Unit tidak ditemukan');
    });
  });

  describe('getAccreditationDashboard', () => {
    it('should return dashboard with readiness scores', async () => {
      const mockUnit = {
        id: 'unit-1',
        name: 'SMP IT Test',
        accreditation: 'B',
        npsn: '12345678',
      };

      (prisma.unit.findUnique as any).mockResolvedValue(mockUnit);
      (prisma.teacher.aggregate as any).mockResolvedValue({ _count: 10 });
      (prisma.teacher.count as any).mockResolvedValue(8);
      (prisma.student.aggregate as any).mockResolvedValue({ _count: 100 });
      (prisma.dormitory.findMany as any).mockResolvedValue([]);
      (prisma.class.count as any).mockResolvedValue(5);
      (prisma.invoice.aggregate as any).mockResolvedValue({ _sum: { amount: 1000000 } });

      const result = await accreditationService.getAccreditationDashboard('unit-1');

      expect(result.overallReadiness).toBeGreaterThan(0);
      expect(result.readinessScores.length).toBe(accreditationService.SNP_STANDARDS.length);

      const sptkScore = result.readinessScores.find(s => s.standardCode === 'SPTK');
      expect(sptkScore?.autoScore).toBe(80);
    });
  });
});
