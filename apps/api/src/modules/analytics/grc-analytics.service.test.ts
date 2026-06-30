import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getGRCStats } from './grc-analytics.service';
import { prisma } from '../../lib/prisma';
import { RiskLevel, PlanStatus, ComplianceStatus } from '@prisma/client';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    strategicPlan: { findMany: vi.fn() },
    risk: { findMany: vi.fn(), aggregate: vi.fn() },
    auditFinding: { count: vi.fn() },
    shariaCompliance: { findMany: vi.fn(), aggregate: vi.fn() },
    notification: { create: vi.fn() },
    user: { findMany: vi.fn() },
    internalAudit: { findFirst: vi.fn(), create: vi.fn() },
    budget: { findMany: vi.fn() },
    journalEntry: { groupBy: vi.fn() },
  },
}));

// Mock the suggestion engine to avoid N+1 dependencies in unit test
vi.mock('../pengawasan/pengawasan.service', () => ({
  pengawasanService: {
    suggestAuditSchedules: vi.fn().mockResolvedValue([]),
  },
}));

describe('GRC Analytics Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate Org Health Score correctly', async () => {
    (prisma.strategicPlan.findMany as any).mockResolvedValue([{ progress: 80 }]);
    (prisma.risk.findMany as any).mockResolvedValue([
        { riskLevel: 'LOW' },
        { riskLevel: 'MEDIUM' }
    ]);
    (prisma.auditFinding.count as any).mockResolvedValue(10); // total
    (prisma.auditFinding.count as any).mockImplementation(({ where }: any) => {
        if (where.followUps) return Promise.resolve(7); // resolved
        return Promise.resolve(10); // total
    });
    (prisma.shariaCompliance.findMany as any).mockResolvedValue([
        { score: 90, status: 'COMPLIANT', category: 'MUAMALAH' }
    ]);

    // Trend mocks
    (prisma.risk.aggregate as any).mockResolvedValue({ _avg: { riskScore: 5 } });
    (prisma.shariaCompliance.aggregate as any).mockResolvedValue({ _avg: { score: 85 } });

    const stats = await getGRCStats();

    expect(stats.orgHealthScore).toBeGreaterThan(0);
    expect(stats.audits.resolutionRate).toBe(70);
    expect(stats.sharia.complianceRate).toBe(90);
    expect(stats.trend).toHaveLength(6);
  });
});
