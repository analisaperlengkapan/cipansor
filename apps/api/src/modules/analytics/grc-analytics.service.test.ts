import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getGRCStats } from './grc-analytics.service';
import { prisma } from '../../lib/prisma';

// Mock Prisma Client Enums
vi.mock('@prisma/client', () => ({
  RiskLevel: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    EXTREME: 'EXTREME',
  },
  PlanStatus: {
    PROPOSED: 'PROPOSED',
    APPROVED: 'APPROVED',
    IN_PROGRESS: 'IN_PROGRESS',
  },
  ComplianceStatus: {
    COMPLIANT: 'COMPLIANT',
    PARTIALLY: 'PARTIALLY',
    NON_COMPLIANT: 'NON_COMPLIANT',
    UNDER_REVIEW: 'UNDER_REVIEW',
    NOT_APPLICABLE: 'NOT_APPLICABLE',
  },
}));

vi.mock('../../lib/prisma', () => ({
  prisma: {
    strategicPlan: { findMany: vi.fn() },
    risk: { findMany: vi.fn() },
    auditFinding: { count: vi.fn() },
    shariaCompliance: { findMany: vi.fn() },
  },
}));

describe('GRCAnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should aggregate GRC metrics correctly', async () => {
    (prisma.strategicPlan.findMany as any).mockResolvedValue([
      { progress: 50 },
      { progress: 100 },
    ]);
    (prisma.risk.findMany as any).mockResolvedValue([
      { riskLevel: 'HIGH' },
      { riskLevel: 'EXTREME' },
      { riskLevel: 'LOW' },
    ]);
    (prisma.auditFinding.count as any)
      .mockResolvedValueOnce(10)  // total findings
      .mockResolvedValueOnce(4);  // resolved findings (with verified follow-ups)
    (prisma.shariaCompliance.findMany as any).mockResolvedValue([
      { score: 90, status: 'COMPLIANT' },
      { score: 70, status: 'PARTIALLY' },
    ]);

    const stats = await getGRCStats();

    expect(stats.plans.activeCount).toBe(2);
    expect(stats.plans.averageProgress).toBe(75);
    expect(stats.risks.criticalCount).toBe(2);
    expect(stats.audits.resolutionRate).toBe(40);
    expect(stats.sharia.complianceRate).toBe(80);
  });
});
