import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../lib/prisma';
import { riskService } from './risk.service';

const RiskLikelihood = {
  RARE: 'RARE',
  UNLIKELY: 'UNLIKELY',
  POSSIBLE: 'POSSIBLE',
  LIKELY: 'LIKELY',
  ALMOST_CERTAIN: 'ALMOST_CERTAIN',
};

const RiskImpact = {
  INSIGNIFICANT: 'INSIGNIFICANT',
  MINOR: 'MINOR',
  MODERATE: 'MODERATE',
  MAJOR: 'MAJOR',
  CATASTROPHIC: 'CATASTROPHIC',
};

const RiskLevel = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  EXTREME: 'EXTREME',
};

// Mock all external dependencies
const { mockPrisma } = vi.hoisted(() => {
  const mock = {
    risk: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    internalAudit: {
      create: vi.fn(),
    },
    auditFinding: {
      create: vi.fn(),
    },
    riskMitigation: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    $transaction: vi.fn().mockImplementation((cb: any) => cb(mock)),
  };
  return { mockPrisma: mock };
});

vi.mock('../../lib/prisma', () => ({
  prisma: mockPrisma,
}));

describe('Risk Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createRisk', () => {
    it('should correctly calculate risk score and level and create risk', async () => {
      const dto = {
        unitId: 'unit-1',
        title: 'Network Outage',
        category: 'OPERATIONAL',
        likelihood: RiskLikelihood.LIKELY, // 4
        impact: RiskImpact.MAJOR, // 4 -> score 16 -> HIGH
        createdById: 'user-1',
      };

      const mockCreated = {
        id: 'risk-1',
        ...dto,
        riskScore: 16,
        riskLevel: RiskLevel.HIGH,
      };

      vi.mocked(prisma.risk.create).mockResolvedValue(mockCreated as any);

      const result = await riskService.createRisk(dto as any);

      expect(prisma.risk.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          riskScore: 16,
          riskLevel: RiskLevel.HIGH,
        },
      });
      expect(result).toEqual(mockCreated);
    });

    it('should calculate EXTREME risk level for max stats', async () => {
      const dto = {
        unitId: 'unit-1',
        title: 'Total System Failure',
        likelihood: RiskLikelihood.ALMOST_CERTAIN, // 5
        impact: RiskImpact.CATASTROPHIC, // 5 -> score 25 -> EXTREME
        createdById: 'user-1',
      };

      vi.mocked(prisma.risk.create).mockResolvedValue({} as any);
      vi.mocked(prisma.user.findMany).mockResolvedValue([] as any);
      await riskService.createRisk(dto as any);

      expect(prisma.risk.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          riskScore: 25,
          riskLevel: RiskLevel.EXTREME,
        }),
      });
    });
  });

  describe('updateRisk', () => {
    it('should recalculate score when likelihood/impact changes', async () => {
      const id = 'risk-1';
      const existingRisk = {
        id,
        likelihood: RiskLikelihood.POSSIBLE, // 3
        impact: RiskImpact.MODERATE, // 3 -> score 9 -> MEDIUM
      };

      const dto = {
        likelihood: RiskLikelihood.LIKELY, // 4 -> score 12 -> HIGH
      };

      // First findUnique: read current risk inside transaction
      // Second findUnique: called by recalculateResidualRisk (with mitigations)
      vi.mocked(prisma.risk.findUnique)
        .mockResolvedValueOnce(existingRisk as any)
        .mockResolvedValueOnce({ ...existingRisk, mitigations: [] } as any);
      vi.mocked(prisma.risk.update).mockResolvedValue({} as any);
      vi.mocked((prisma.risk as any).findUniqueOrThrow).mockResolvedValue({
        ...existingRisk,
        ...dto,
        riskScore: 12,
        riskLevel: RiskLevel.HIGH,
      } as any);

      const result = await riskService.updateRisk(id, dto as any);

      expect(prisma.risk.update).toHaveBeenCalledWith({
        where: { id },
        data: expect.objectContaining({
          likelihood: RiskLikelihood.LIKELY,
          riskScore: 12,
          riskLevel: RiskLevel.HIGH,
        }),
      });
      expect(result.riskScore).toBe(12);
      expect(result.riskLevel).toBe(RiskLevel.HIGH);
    });
  });

  describe('getRisks', () => {
    it('should apply filters when getting risks', async () => {
      vi.mocked(prisma.risk.findMany).mockResolvedValue([] as any);

      await riskService.getRisks('unit-1', {
        category: 'FINANCIAL',
        riskLevel: 'HIGH',
      });

      expect(prisma.risk.findMany).toHaveBeenCalledWith({
        where: {
          unitId: 'unit-1',
          category: 'FINANCIAL',
          riskLevel: 'HIGH',
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter risks by strategicPlanId', async () => {
      vi.mocked(prisma.risk.findMany).mockResolvedValue([] as any);

      await riskService.getRisks('unit-1', {
        strategicPlanId: 'plan-123',
      });

      expect(prisma.risk.findMany).toHaveBeenCalledWith({
        where: {
          unitId: 'unit-1',
          strategicPlanId: 'plan-123',
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('Mitigation', () => {
    it('should create mitigation and recalculate residual risk', async () => {
      const dto = {
        riskId: 'risk-1',
        description: 'New firewall',
        picId: 'user-1',
        targetDate: new Date(),
        createdById: 'user-2',
      };

      vi.mocked(prisma.riskMitigation.create).mockResolvedValue(dto as any);
      // recalculateResidualRisk reads the risk with mitigations
      vi.mocked(prisma.risk.findUnique).mockResolvedValue({
        id: 'risk-1',
        likelihood: RiskLikelihood.POSSIBLE,
        impact: RiskImpact.MODERATE,
        mitigations: [{ ...dto, progress: 0 }],
      } as any);
      vi.mocked(prisma.risk.update).mockResolvedValue({} as any);

      await riskService.createMitigation(dto as any);

      expect(prisma.riskMitigation.create).toHaveBeenCalledWith({
        data: dto,
      });
      // Verify residual risk recalculation was triggered
      expect(prisma.risk.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'risk-1' } })
      );
    });
  });
});
