import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    performanceAgreement: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    pKIndicator: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { pkService } from './pk.service';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
    },
    performanceAgreement: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    pKIndicator: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

const mocked = prisma as unknown as {
  user: Record<string, ReturnType<typeof vi.fn>>;
  performanceAgreement: Record<string, ReturnType<typeof vi.fn>>;
  pKIndicator: Record<string, ReturnType<typeof vi.fn>>;
};

describe('PerformanceAgreementService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getSupervisors unit scoping', () => {
    it('restricts results to caller unitId for unit-pinned roles', async () => {
      mocked.user.findMany.mockResolvedValue([]);
      await pkService.getSupervisors({ roleCode: 'SDIT_GURU', unitId: 'unit-sdit' });

      expect(mocked.user.findMany).toHaveBeenCalledTimes(1);
      const queryWhere = mocked.user.findMany.mock.calls[0][0].where;
      expect(queryWhere.unitId).toBe('unit-sdit');
    });

    it('allows cross-unit / foundation roles to query supervisors across units', async () => {
      mocked.user.findMany.mockResolvedValue([]);
      await pkService.getSupervisors({ roleCode: 'YAYASAN_KETUA', unitId: 'unit-sdit' });

      expect(mocked.user.findMany).toHaveBeenCalledTimes(1);
      const queryWhere = mocked.user.findMany.mock.calls[0][0].where;
      expect(queryWhere.unitId).toBeUndefined();
    });
  });

  describe('createPK cascading rule', () => {
    it('rejects a subordinate PK when the supervisor has no approved PK for the period', async () => {
      mocked.performanceAgreement.findFirst.mockResolvedValue(null);

      await expect(
        pkService.createPK({
          userId: 'u-staff',
          supervisorId: 'u-boss',
          periodStart: '2026-01-01T00:00:00.000Z',
          periodEnd: '2026-12-31T00:00:00.000Z',
        })
      ).rejects.toThrow(/approved PK/i);
      expect(mocked.performanceAgreement.create).not.toHaveBeenCalled();
    });

    it('links the subordinate PK to the supervisor PK when one exists', async () => {
      mocked.performanceAgreement.findFirst.mockResolvedValue({ id: 'pk-boss' });
      mocked.performanceAgreement.create.mockResolvedValue({ id: 'pk-new' });

      await pkService.createPK({
        userId: 'u-staff',
        supervisorId: 'u-boss',
        periodStart: '2026-01-01T00:00:00.000Z',
        periodEnd: '2026-12-31T00:00:00.000Z',
      });

      const args = mocked.performanceAgreement.create.mock.calls[0][0];
      expect(args.data.supervisorPk).toEqual({ connect: { id: 'pk-boss' } });
    });
  });

  describe('proposePK', () => {
    it('requires indicator weights to total 100', async () => {
      mocked.performanceAgreement.findUnique.mockResolvedValue({
        id: 'pk-1',
        userId: 'u-1',
        supervisorId: null,
        status: 'DRAFT',
        indicators: [{ weight: 60 }, { weight: 20 }],
      });

      await expect(pkService.proposePK('pk-1', 'u-1', false)).rejects.toThrow(/100/);
    });

    it('rejects a non-owner proposing someone else’s PK', async () => {
      mocked.performanceAgreement.findUnique.mockResolvedValue({
        id: 'pk-1',
        userId: 'u-1',
        supervisorId: 'u-2',
        status: 'DRAFT',
        indicators: [{ weight: 100 }],
      });

      await expect(pkService.proposePK('pk-1', 'u-intruder', false)).rejects.toThrow();
      // Even the supervisor cannot propose on the owner's behalf.
      await expect(pkService.proposePK('pk-1', 'u-2', false)).rejects.toThrow();
    });

    it('proposes a valid DRAFT PK', async () => {
      mocked.performanceAgreement.findUnique.mockResolvedValue({
        id: 'pk-1',
        userId: 'u-1',
        supervisorId: null,
        status: 'DRAFT',
        indicators: [{ weight: 70 }, { weight: 30 }],
      });
      mocked.performanceAgreement.update.mockResolvedValue({ id: 'pk-1', status: 'PROPOSED' });

      const result = await pkService.proposePK('pk-1', 'u-1', false);
      expect(result.status).toBe('PROPOSED');
    });
  });

  describe('approvePK', () => {
    it('only the assigned supervisor may approve', async () => {
      mocked.performanceAgreement.findUnique.mockResolvedValue({
        id: 'pk-1',
        userId: 'u-1',
        supervisorId: 'u-boss',
        status: 'PROPOSED',
      });

      await expect(pkService.approvePK('pk-1', 'u-1', false)).rejects.toThrow();
      await expect(pkService.approvePK('pk-1', 'u-random', false)).rejects.toThrow();
      expect(mocked.performanceAgreement.update).not.toHaveBeenCalled();
    });

    it('rejects approval of a PK that is not PROPOSED', async () => {
      mocked.performanceAgreement.findUnique.mockResolvedValue({
        id: 'pk-1',
        userId: 'u-1',
        supervisorId: 'u-boss',
        status: 'DRAFT',
      });

      await expect(pkService.approvePK('pk-1', 'u-boss', false)).rejects.toThrow(/PROPOSED/);
    });

    it('supervisor approves a PROPOSED PK', async () => {
      mocked.performanceAgreement.findUnique.mockResolvedValue({
        id: 'pk-1',
        userId: 'u-1',
        supervisorId: 'u-boss',
        status: 'PROPOSED',
      });
      mocked.performanceAgreement.update.mockResolvedValue({ id: 'pk-1', status: 'APPROVED' });

      const result = await pkService.approvePK('pk-1', 'u-boss', false);
      expect(result.status).toBe('APPROVED');
      const updateArgs = mocked.performanceAgreement.update.mock.calls[0][0];
      expect(updateArgs.data.status).toBe('APPROVED');
      expect(updateArgs.data.approvedAt).toBeInstanceOf(Date);
    });
  });

  describe('indicators', () => {
    it('blocks indicator changes on an APPROVED PK', async () => {
      mocked.pKIndicator.findUnique.mockResolvedValue({ id: 'ind-1', pkId: 'pk-1' });
      mocked.performanceAgreement.findUnique.mockResolvedValue({
        id: 'pk-1',
        userId: 'u-1',
        supervisorId: null,
        status: 'APPROVED',
      });

      await expect(
        pkService.updateIndicator('ind-1', 'u-1', false, { weight: 50 })
      ).rejects.toThrow(/approved/i);
      expect(mocked.pKIndicator.update).not.toHaveBeenCalled();
    });

    it('requires cascading indicators to reference a superior indicator', async () => {
      mocked.performanceAgreement.findUnique.mockResolvedValue({
        id: 'pk-1',
        userId: 'u-1',
        supervisorId: null,
        status: 'DRAFT',
      });

      await expect(
        pkService.createIndicator('u-1', false, {
          pkId: 'pk-1',
          title: 'Turunan kinerja atasan',
          target: 10,
          unit: 'dokumen',
          weight: 40,
          category: 'DIRECT' as never,
        })
      ).rejects.toThrow(/reference/i);
    });
  });
});
