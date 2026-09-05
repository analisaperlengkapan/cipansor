import { describe, it, expect, vi, beforeEach } from 'vitest';

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
      delete: vi.fn(),
    },
    pKEvaluation: {
      findUnique: vi.fn(),
    },
    pKIndicator: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import { pkService } from '../pk.service';

const mocked = prisma as unknown as {
  user: Record<string, ReturnType<typeof vi.fn>>;
  performanceAgreement: Record<string, ReturnType<typeof vi.fn>>;
  pKEvaluation: Record<string, ReturnType<typeof vi.fn>>;
  pKIndicator: Record<string, ReturnType<typeof vi.fn>>;
  $transaction: ReturnType<typeof vi.fn>;
};

describe('PerformanceAgreementService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getSupervisors unit scoping', () => {
    it('filters userRoles by caller unitId for unit-pinned roles regardless of User.unitId', async () => {
      mocked.user.findMany.mockResolvedValue([]);
      await pkService.getSupervisors({ roleCode: 'SDIT_GURU', unitId: 'unit-sdit' });

      expect(mocked.user.findMany).toHaveBeenCalledTimes(1);
      const queryWhere = mocked.user.findMany.mock.calls[0][0].where;
      // Top-level User.unitId is NOT filtered; filtering is on userRoles.some.unitId
      expect(queryWhere.unitId).toBeUndefined();
      expect(queryWhere.userRoles.some.unitId).toBe('unit-sdit');
    });

    it('forces userRoles.some.unitId to "none" for unassigned non-global callers', async () => {
      mocked.user.findMany.mockResolvedValue([]);
      await pkService.getSupervisors({ roleCode: 'SDIT_GURU', unitId: undefined });

      expect(mocked.user.findMany).toHaveBeenCalledTimes(1);
      const queryWhere = mocked.user.findMany.mock.calls[0][0].where;
      expect(queryWhere.unitId).toBeUndefined();
      expect(queryWhere.userRoles.some.unitId).toBe('none');
    });

    it('allows cross-unit / foundation roles to query supervisors across all role unit assignments', async () => {
      mocked.user.findMany.mockResolvedValue([]);
      await pkService.getSupervisors({ roleCode: 'YAYASAN_KETUA', unitId: 'unit-sdit' });

      expect(mocked.user.findMany).toHaveBeenCalledTimes(1);
      const queryWhere = mocked.user.findMany.mock.calls[0][0].where;
      expect(queryWhere.unitId).toBeUndefined();
      expect(queryWhere.userRoles.some.unitId).toBeUndefined();
    });
  });

  describe('deletePK', () => {
    let mockQueryRaw: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockQueryRaw = vi.fn().mockResolvedValue([]);
      mocked.$transaction.mockImplementation(async (cb: any) =>
        cb({
          ...prisma,
          $queryRaw: mockQueryRaw,
        })
      );
    });

    it('successfully deletes a DRAFT PK by its owner after acquiring row lock', async () => {
      const callOrder: string[] = [];
      mockQueryRaw.mockImplementation(async () => {
        callOrder.push('$queryRaw');
        return [];
      });
      mocked.performanceAgreement.findUnique.mockImplementation(async () => {
        callOrder.push('findUnique');
        return {
          id: 'pk-1',
          userId: 'u-owner',
          status: 'DRAFT',
        };
      });
      mocked.performanceAgreement.delete.mockResolvedValue({ id: 'pk-1' });

      await pkService.deletePK('pk-1', 'u-owner', false);

      expect(mockQueryRaw).toHaveBeenCalledTimes(1);
      const sqlStrings = mockQueryRaw.mock.calls[0][0];
      expect(sqlStrings.join('')).toContain('SELECT id FROM "performance_agreements" WHERE id =');
      expect(sqlStrings.join('')).toContain('FOR UPDATE');
      expect(callOrder).toEqual(['$queryRaw', 'findUnique']);
      expect(mocked.performanceAgreement.delete).toHaveBeenCalledWith({ where: { id: 'pk-1' } });
    });

    it('rejects deletion if PK is not found', async () => {
      mocked.performanceAgreement.findUnique.mockResolvedValue(null);

      await expect(pkService.deletePK('pk-nonexistent', 'u-owner', false)).rejects.toThrow(/not found/i);
      expect(mocked.performanceAgreement.delete).not.toHaveBeenCalled();
    });

    it('rejects deletion if caller is neither owner nor admin', async () => {
      mocked.performanceAgreement.findUnique.mockResolvedValue({
        id: 'pk-1',
        userId: 'u-owner',
        status: 'DRAFT',
      });

      await expect(pkService.deletePK('pk-1', 'u-stranger', false)).rejects.toThrow();
      expect(mocked.performanceAgreement.delete).not.toHaveBeenCalled();
    });

    it('rejects deletion with 409 Conflict when PK is already APPROVED', async () => {
      mocked.performanceAgreement.findUnique.mockResolvedValueOnce({
        id: 'pk-1',
        userId: 'u-owner',
        status: 'APPROVED',
        user: { id: 'u-owner', unitId: 'unit-sdit' },
      });

      await expect(pkService.deletePK('pk-1', { id: 'u-owner' })).rejects.toThrow(/draft/i);
      expect(mockQueryRaw).toHaveBeenCalledTimes(1);
      expect(mocked.performanceAgreement.delete).not.toHaveBeenCalled();
    });

    it('rejects deletion with 409 Conflict when PK is PROPOSED', async () => {
      mocked.performanceAgreement.findUnique.mockResolvedValueOnce({
        id: 'pk-1',
        userId: 'u-owner',
        status: 'PROPOSED',
        user: { id: 'u-owner', unitId: 'unit-sdit' },
      });

      await expect(pkService.deletePK('pk-1', { id: 'u-owner' })).rejects.toThrow(/draft/i);
      expect(mocked.performanceAgreement.delete).not.toHaveBeenCalled();
    });

    it('blocks unit admin from deleting PK belonging to an employee in another unit (403 Forbidden)', async () => {
      mocked.performanceAgreement.findUnique.mockResolvedValueOnce({
        id: 'pk-1',
        userId: 'u-smpit-employee',
        status: 'DRAFT',
        user: { id: 'u-smpit-employee', unitId: 'unit-smpit' },
      });

      await expect(
        pkService.deletePK('pk-1', {
          id: 'admin-sdit',
          isAdmin: true,
          roleCode: 'SDIT_ADMIN',
          unitId: 'unit-sdit',
        })
      ).rejects.toThrow(/permission|forbidden/i);
      expect(mocked.performanceAgreement.delete).not.toHaveBeenCalled();
    });

    it('allows unit admin to delete DRAFT PK belonging to an employee in the same unit', async () => {
      mocked.performanceAgreement.findUnique.mockResolvedValueOnce({
        id: 'pk-1',
        userId: 'u-sdit-employee',
        status: 'DRAFT',
        user: { id: 'u-sdit-employee', unitId: 'unit-sdit' },
      });
      mocked.performanceAgreement.delete.mockResolvedValueOnce({ id: 'pk-1' });

      await pkService.deletePK('pk-1', {
        id: 'admin-sdit',
        isAdmin: true,
        roleCode: 'SDIT_ADMIN',
        unitId: 'unit-sdit',
      });

      expect(mocked.performanceAgreement.delete).toHaveBeenCalledWith({ where: { id: 'pk-1' } });
    });

    it('allows SUPER_ADMIN to delete DRAFT PK from any unit', async () => {
      mocked.performanceAgreement.findUnique.mockResolvedValueOnce({
        id: 'pk-1',
        userId: 'u-smpit-employee',
        status: 'DRAFT',
        user: { id: 'u-smpit-employee', unitId: 'unit-smpit' },
      });
      mocked.performanceAgreement.delete.mockResolvedValueOnce({ id: 'pk-1' });

      await pkService.deletePK('pk-1', {
        id: 'superadmin',
        isAdmin: true,
        roleCode: 'SUPER_ADMIN',
        unitId: null,
      });

      expect(mocked.performanceAgreement.delete).toHaveBeenCalledWith({ where: { id: 'pk-1' } });
    });

    it('rejects deletion when PK becomes APPROVED after acquiring row lock (concurrent approval race)', async () => {
      // In deletePK, $queryRaw FOR UPDATE locks the row first, then findUnique reads the latest status under lock.
      // If a concurrent approval completes before or during lock acquisition, findUnique reads status: APPROVED.
      mocked.performanceAgreement.findUnique.mockResolvedValueOnce({
        id: 'pk-1',
        userId: 'u-owner',
        status: 'APPROVED',
        user: { id: 'u-owner', unitId: 'unit-sdit' },
      });

      await expect(pkService.deletePK('pk-1', 'u-owner', false)).rejects.toThrow(/draft/i);

      expect(mockQueryRaw).toHaveBeenCalledTimes(1);
      const sqlStrings = mockQueryRaw.mock.calls[0][0];
      expect(sqlStrings.join('')).toContain('SELECT id FROM "performance_agreements" WHERE id =');
      expect(sqlStrings.join('')).toContain('FOR UPDATE');
      expect(mocked.performanceAgreement.delete).not.toHaveBeenCalled();
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

  describe('assertUnitScope', () => {
    // Lubang yang ditutup: assertAccess mulai dengan `if (isAdmin) return;`,
    // dan isAdmin benar untuk TKQ/SDIT/SMPIT/SMAQ_ADMIN. Tanpa penjaga ini
    // seorang SDIT_ADMIN bisa membaca, menyunting, menyetujui, dan menolak PK
    // milik SMP IT. Dulu hanya deletePK yang memeriksa unit — satu rute aman,
    // tujuh lainnya terbuka.
    it('menolak admin unit yang menyentuh PK milik unit lain', async () => {
      mocked.performanceAgreement.findUnique.mockResolvedValue({
        user: { unitId: 'unit-smpit' },
      });

      await expect(
        pkService.assertUnitScope({ pkId: 'pk-smpit' }, {
          roleCode: 'SDIT_ADMIN',
          unitId: 'unit-sdit',
        })
      ).rejects.toThrow(/unit lain/i);
    });

    it('mengizinkan admin unit pada PK di unitnya sendiri', async () => {
      mocked.performanceAgreement.findUnique.mockResolvedValue({
        user: { unitId: 'unit-sdit' },
      });

      await expect(
        pkService.assertUnitScope({ pkId: 'pk-sdit' }, {
          roleCode: 'SDIT_ADMIN',
          unitId: 'unit-sdit',
        })
      ).resolves.toBeUndefined();
    });

    it('melepaskan peran yang memang lintas unit tanpa menyentuh basis data', async () => {
      // Pengurus yayasan, pengasuh dan direktur pesantren, super admin.
      // Kalau ini salah, mereka justru terkunci dari unit yang mereka asuh.
      for (const roleCode of [
        'SUPER_ADMIN',
        'YAYASAN_KETUA',
        'PESANTREN_PENGASUH',
        'PESANTREN_DIREKTUR',
      ]) {
        await expect(
          pkService.assertUnitScope({ pkId: 'pk-mana-pun' }, { roleCode, unitId: null })
        ).resolves.toBeUndefined();
      }
      expect(mocked.performanceAgreement.findUnique).not.toHaveBeenCalled();
    });

    it('menolak pemanggil tanpa unit sama sekali', async () => {
      mocked.performanceAgreement.findUnique.mockResolvedValue({
        user: { unitId: 'unit-sdit' },
      });

      await expect(
        pkService.assertUnitScope({ pkId: 'pk-sdit' }, { roleCode: 'SDIT_GURU', unitId: null })
      ).rejects.toThrow(/unit lain/i);
    });

    it('menelusuri evaluasi sampai ke unit pemilik PK-nya', async () => {
      mocked.pKEvaluation.findUnique.mockResolvedValue({
        pk: { user: { unitId: 'unit-smpit' } },
      });

      await expect(
        pkService.assertUnitScope({ evaluationId: 'ev-1' }, {
          roleCode: 'SDIT_ADMIN',
          unitId: 'unit-sdit',
        })
      ).rejects.toThrow(/unit lain/i);
    });
  });

  describe('proposePK', () => {
    it('requires indicator weights to total 100', async () => {
      mocked.performanceAgreement.findUnique.mockResolvedValue({
        id: 'pk-1',
        userId: 'u-1',
        supervisorId: 'u-2',
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
        supervisorId: 'u-2',
        status: 'DRAFT',
        indicators: [{ weight: 70 }, { weight: 30 }],
      });
      mocked.performanceAgreement.update.mockResolvedValue({ id: 'pk-1', status: 'PROPOSED' });

      const result = await pkService.proposePK('pk-1', 'u-1', false);
      expect(result.status).toBe('PROPOSED');
    });

    it('menolak pengajuan PK yang belum punya atasan penilai', async () => {
      // Bukan formalitas. Tanpa atasan penilai, penilaian perilaku (SAFTI)
      // tidak pernah bisa diisi oleh siapa pun — assertAccess menuntut
      // supervisorId — sehingga behaviorScore tetap 0 dan skor akhir mentok
      // di 60 selamanya, tanpa satu pun pesan yang menjelaskan sebabnya.
      // Ditolak di sini, saat masih bisa diperbaiki.
      mocked.performanceAgreement.findUnique.mockResolvedValue({
        id: 'pk-1',
        userId: 'u-1',
        supervisorId: null,
        status: 'DRAFT',
        indicators: [{ weight: 100 }],
      });

      await expect(pkService.proposePK('pk-1', 'u-1', false)).rejects.toThrow(/atasan penilai/i);
      expect(mocked.performanceAgreement.update).not.toHaveBeenCalled();
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
