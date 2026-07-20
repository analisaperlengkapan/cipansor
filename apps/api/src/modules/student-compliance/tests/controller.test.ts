import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../student-compliance.service', () => ({
  getComplianceByStudent: vi.fn(),
  findStudentById: vi.fn(),
  isNisnTaken: vi.fn(),
  isNikTaken: vi.fn(),
  updateCompliance: vi.fn(),
  getCompletenessReport: vi.fn(),
  getDapodikReady: vi.fn(),
  bulkUpdate: vi.fn(),
}));

import * as controller from '../student-compliance.controller';
import * as service from '../student-compliance.service';

function mockReqRes(overrides: Partial<Request> = {}) {
  const req = { query: {}, params: {}, body: {}, ...overrides } as unknown as Request;
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

describe('student-compliance controller', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getByStudent: 404 when the student does not exist', async () => {
    (service.getComplianceByStudent as any).mockResolvedValue(null);
    const { req, res } = mockReqRes({ params: { studentId: 'x' } as any });
    await run(controller.getByStudent, req, res);
    expect((res as any).statusCode).toBe(404);
  });

  it('update: 400 when the new NISN belongs to another student', async () => {
    (service.findStudentById as any).mockResolvedValue({ id: 's1', nisn: 'old', nik: 'k' });
    (service.isNisnTaken as any).mockResolvedValue(true);
    const { req, res } = mockReqRes({ params: { studentId: 's1' } as any, body: { nisn: 'dupe' } as any });
    await run(controller.update, req, res);
    expect((res as any).statusCode).toBe(400);
    expect((res as any).jsonPayload.message).toBe('NISN already exists');
    expect(service.updateCompliance).not.toHaveBeenCalled();
  });

  it('update: persists and echoes the updated record', async () => {
    (service.findStudentById as any).mockResolvedValue({ id: 's1', nisn: 'n', nik: 'k' });
    (service.updateCompliance as any).mockResolvedValue({ id: 's1', religion: 'Islam' });
    const { req, res } = mockReqRes({ params: { studentId: 's1' } as any, body: { religion: 'Islam' } as any });
    await run(controller.update, req, res);
    expect(service.updateCompliance).toHaveBeenCalledWith('s1', { religion: 'Islam' });
    expect((res as any).jsonPayload.data).toEqual({ id: 's1', religion: 'Islam' });
  });

  it('bulkUpdate: 400 when the updates array is empty', async () => {
    const { req, res } = mockReqRes({ body: { updates: [] } as any });
    await run(controller.bulkUpdate, req, res);
    expect((res as any).statusCode).toBe(400);
    expect(service.bulkUpdate).not.toHaveBeenCalled();
  });
});
