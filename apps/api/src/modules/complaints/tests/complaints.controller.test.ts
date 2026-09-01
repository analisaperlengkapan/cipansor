import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { complaintsController } from '../complaints.controller';
import { complaintsService } from '../complaints.service';
import { prisma } from '@/lib/prisma';
import { RoleCode } from '@prisma/client';

vi.mock('../complaints.service', () => ({
  complaintsService: {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    updateStatus: vi.fn(),
    assignHandler: vi.fn(),
    addComment: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    complaint: {
      findUnique: vi.fn(),
    },
  },
}));

function mockRequest(body = {}, userOverriding = {}): Request {
  const req = {
    body,
    user: {
      sub: 'user-uuid-1',
      role: RoleCode.SDIT_TATA_USAHA,
      roleCode: RoleCode.SDIT_TATA_USAHA,
      unitId: 'unit-uuid-1',
      ...userOverriding,
    },
    params: {},
    query: {},
  } as unknown as Request;
  return req;
}

function mockResponse() {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('complaintsController - validation issue responses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('returns 400 with message "Validation error" and Zod issues on invalid payload', async () => {
      const req = mockRequest({
        // Missing category, subject, description
      });
      const res = mockResponse();

      await complaintsController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(httpStatus.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation error',
          errors: expect.arrayContaining([
            expect.objectContaining({
              code: expect.any(String),
              message: expect.any(String),
              path: expect.any(Array),
            }),
          ]),
        })
      );
    });
  });

  describe('updateStatus', () => {
    it('returns 400 with message "Validation error" and Zod issues on invalid payload', async () => {
      const req = mockRequest({
        status: 'INVALID_STATUS',
      });
      req.params = { id: 'complaint-1' };
      const res = mockResponse();

      await complaintsController.updateStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(httpStatus.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation error',
          errors: expect.arrayContaining([
            expect.objectContaining({
              code: expect.any(String),
              message: expect.any(String),
              path: expect.any(Array),
            }),
          ]),
        })
      );
    });
  });

  describe('assignHandler', () => {
    it('returns 400 with message "Validation error" and Zod issues on invalid payload', async () => {
      const req = mockRequest({
        handlerId: 'invalid-uuid-format',
      });
      req.params = { id: 'complaint-1' };
      const res = mockResponse();

      await complaintsController.assignHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(httpStatus.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation error',
          errors: expect.arrayContaining([
            expect.objectContaining({
              code: expect.any(String),
              message: expect.any(String),
              path: expect.any(Array),
            }),
          ]),
        })
      );
    });
  });

  describe('addComment', () => {
    it('returns 400 with message "Validation error" and Zod issues on invalid payload', async () => {
      const req = mockRequest({
        content: '', // Empty content violates min(1) constraint
      });
      req.params = { id: 'complaint-1' };
      const res = mockResponse();

      await complaintsController.addComment(req, res);

      expect(res.status).toHaveBeenCalledWith(httpStatus.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation error',
          errors: expect.arrayContaining([
            expect.objectContaining({
              code: expect.any(String),
              message: expect.any(String),
              path: expect.any(Array),
            }),
          ]),
        })
      );
    });
  });
});
