import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../pkg.service', () => ({
  PKG_INDICATORS: [{ code: 'A' }],
  listPeriods: vi.fn(),
  createPeriod: vi.fn(),
  getPeriodById: vi.fn(),
  updatePeriod: vi.fn(),
  deletePeriod: vi.fn(),
  listEvaluations: vi.fn(),
  createEvaluation: vi.fn(),
  createBulkEvaluations: vi.fn(),
  getEvaluation: vi.fn(),
  submitScores: vi.fn(),
  updateEvaluationStatus: vi.fn(),
  addDocument: vi.fn(),
  deleteDocument: vi.fn(),
  getTeacherPKGHistory: vi.fn(),
  getPKGStatistics: vi.fn(),
}));

import * as controller from '../controller';
import * as pkgService from '../pkg.service';

function mockReqRes(overrides: Partial<Request> = {}) {
  const req = { query: {}, params: {}, body: {}, user: { sub: 'user-1' }, ...overrides } as unknown as Request;
  const res = {
    statusCode: 200,
    jsonPayload: undefined as unknown,
    status(code: number) { (this as any).statusCode = code; return this; },
    json(payload: unknown) { (this as any).jsonPayload = payload; return this; },
  } as unknown as Response & { statusCode: number; jsonPayload: any };
  return { req, res };
}

async function run(handler: any, req: Request, res: Response) {
  await handler(req, res, vi.fn());
}

describe('pkg controller', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getIndicators: returns the static indicators', () => {
    const { req, res } = mockReqRes();
    controller.getIndicators(req, res);
    expect((res as any).jsonPayload.data).toEqual([{ code: 'A' }]);
  });

  it('createPeriod: returns 201', async () => {
    (pkgService.createPeriod as any).mockResolvedValue({ id: 'per1' });
    const { req, res } = mockReqRes({ body: { name: 'Sem 1' } as any });
    await run(controller.createPeriod, req, res);
    expect((res as any).statusCode).toBe(201);
  });

  it('bulkCreateEvaluations: reports count and returns 201', async () => {
    (pkgService.createBulkEvaluations as any).mockResolvedValue([{ id: 'e1' }, { id: 'e2' }]);
    const { req, res } = mockReqRes({ body: { periodId: 'p1', teacherIds: ['t1', 't2'] } as any });
    await run(controller.bulkCreateEvaluations, req, res);
    expect(pkgService.createBulkEvaluations).toHaveBeenCalledWith('p1', ['t1', 't2']);
    expect((res as any).statusCode).toBe(201);
    expect((res as any).jsonPayload.message).toBe('2 evaluasi PKG berhasil dibuat');
  });

  it('updateEvaluationStatus: passes the actor id from the token', async () => {
    (pkgService.updateEvaluationStatus as any).mockResolvedValue({ id: 'e1', status: 'DONE' });
    const { req, res } = mockReqRes({ params: { id: 'e1' } as any, body: { status: 'DONE' } as any });
    await run(controller.updateEvaluationStatus, req, res);
    expect(pkgService.updateEvaluationStatus).toHaveBeenCalledWith('e1', 'DONE', 'user-1');
  });
});
