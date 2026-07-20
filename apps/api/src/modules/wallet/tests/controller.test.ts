import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../wallet.service', () => ({
  walletService: {
    listWallets: vi.fn(),
    getSummary: vi.fn(),
    listTransactions: vi.fn(),
    getWalletByStudent: vi.fn(),
    topUp: vi.fn(),
    bulkTopUp: vi.fn(),
    deduct: vi.fn(),
    transfer: vi.fn(),
    refund: vi.fn(),
  },
}));

import * as controller from '../wallet.controller';
import { walletService } from '../wallet.service';

function mockReqRes(overrides: Partial<Request> = {}) {
  const req = {
    query: {},
    params: {},
    body: {},
    user: { sub: 'user-1' },
    ...overrides,
  } as unknown as Request;

  const res = {
    statusCode: 200,
    jsonPayload: undefined as unknown,
    status(code: number) {
      (this as any).statusCode = code;
      return this;
    },
    json(payload: unknown) {
      (this as any).jsonPayload = payload;
      return this;
    },
  } as unknown as Response & { statusCode: number; jsonPayload: any };

  return { req, res };
}

async function run(handler: any, req: Request, res: Response) {
  await handler(req, res, vi.fn());
}

describe('wallet controller', () => {
  beforeEach(() => vi.clearAllMocks());

  it('list: returns the paginated envelope from the service', async () => {
    (walletService.listWallets as any).mockResolvedValue({
      data: [{ id: 'w1' }],
      meta: { total: 1 },
    });
    const { req, res } = mockReqRes();

    await run(controller.list, req, res);

    expect(walletService.listWallets).toHaveBeenCalled();
    // ApiResponse.success surfaces the 3rd arg under `pagination`.
    expect((res as any).jsonPayload).toMatchObject({
      success: true,
      data: [{ id: 'w1' }],
      pagination: { total: 1 },
    });
  });

  it('topUp: uses the authenticated user id and returns 201', async () => {
    (walletService.topUp as any).mockResolvedValue({ id: 'tx1' });
    const { req, res } = mockReqRes({ body: { studentId: 's1', amount: 1000 } as any });

    await run(controller.topUp, req, res);

    expect(walletService.topUp).toHaveBeenCalledWith({ studentId: 's1', amount: 1000 }, 'user-1');
    expect((res as any).statusCode).toBe(201);
    expect((res as any).jsonPayload.success).toBe(true);
  });

  it('getByStudent: delegates to the service with the path param', async () => {
    (walletService.getWalletByStudent as any).mockResolvedValue({ id: 'w1', balance: 500 });
    const { req, res } = mockReqRes({ params: { studentId: 's1' } as any });

    await run(controller.getByStudent, req, res);

    expect(walletService.getWalletByStudent).toHaveBeenCalledWith('s1');
    expect((res as any).jsonPayload.data).toEqual({ id: 'w1', balance: 500 });
  });
});
