import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoleCode } from '@prisma/client';
import type { Request, Response } from 'express';

vi.mock('@/lib/prisma', () => ({ prisma: {} }));
vi.mock('@/lib/redis', () => ({ redis: {} }));

const getStats = vi.fn();
vi.mock('./reception.service', () => ({
  getStats: (...args: unknown[]) => getStats(...args),
}));

import * as controller from './reception.controller';

/**
 * Regression guard for a cross-unit read.
 *
 * The unit scope used to be `req.user?.unitId || req.query.unitId ||
 * req.body.unitId`, on the assumption that only super admin and the yayasan
 * board carry a JWT without a unitId. Production disagrees: BUSINESS_MANAGER
 * and BUSINESS_STAFF are active accounts with no unit and no foundation remit,
 * so they could name any unit they liked and read its guest book and santri
 * visits.
 *
 * These pin the rule, not the implementation: a caller may only choose its own
 * scope when its role actually spans the foundation.
 */
function callGetStats(user: Record<string, unknown> | undefined, query = {}) {
  const req = { user, query, body: {} } as unknown as Request;
  const res = { json: vi.fn() } as unknown as Response;
  const next = vi.fn();
  return { promise: controller.getStats(req, res, next), next, res };
}

describe('reception unit scoping', () => {
  beforeEach(() => {
    getStats.mockReset().mockResolvedValue({});
  });

  it('uses the JWT unit and ignores a mismatched ?unitId=', async () => {
    const { promise } = callGetStats(
      { unitId: 'unit-own', roleCode: RoleCode.SMPIT_TATA_USAHA },
      { unitId: 'unit-lain' }
    );
    await promise;

    expect(getStats).toHaveBeenCalledWith('unit-own');
  });

  it('lets a foundation role name the unit it wants', async () => {
    const { promise } = callGetStats(
      { unitId: null, roleCode: RoleCode.YAYASAN_KETUA },
      { unitId: 'unit-lain' }
    );
    await promise;

    expect(getStats).toHaveBeenCalledWith('unit-lain');
  });

  // The case that was open: no unit of its own, no foundation remit.
  it('refuses a unit-less non-foundation role that names a unit', async () => {
    const { promise, next } = callGetStats(
      { unitId: null, roleCode: RoleCode.BUSINESS_MANAGER },
      { unitId: 'unit-lain' }
    );
    await promise;

    expect(getStats).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0] as { statusCode?: number };
    expect(err.statusCode).toBe(403);
  });

  it('still answers 400, not 401, when a foundation role names no unit', async () => {
    const { promise, next } = callGetStats({
      unitId: null,
      roleCode: RoleCode.YAYASAN_KETUA,
    });
    await promise;

    const err = next.mock.calls[0][0] as { statusCode?: number };
    expect(err.statusCode).toBe(400);
  });
});
