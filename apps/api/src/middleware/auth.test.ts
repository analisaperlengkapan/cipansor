import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { RoleCode, UserRole } from '@prisma/client';

// Mock infra so importing the middleware has no side effects (no DB/redis/jwt).
vi.mock('@/lib/jwt', () => ({ verifyToken: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ prisma: { role: { findUnique: vi.fn() } } }));
vi.mock('@/lib/redis', () => ({ redis: { get: vi.fn(), setex: vi.fn() } }));

import {
  authorize,
  isAdmin,
  isSuperAdmin,
  isTeacherOrAbove,
  sameUnit,
  deriveLegacyRole,
  isAdminRoleCode,
  isGovernanceRoleCode,
} from './auth';

// Minimal express mocks
const makeRes = () => ({}) as Response;
const makeReq = (user?: Record<string, unknown>, extra?: Partial<Request>) =>
  ({ user, params: {}, body: {}, query: {}, ...extra }) as unknown as Request;

const lastError = (next: ReturnType<typeof vi.fn>) => next.mock.calls[0]?.[0];

describe('middleware/auth RBAC', () => {
  let next: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    next = vi.fn();
  });

  describe('pure role helpers', () => {
    it('deriveLegacyRole maps granular RoleCodes to legacy UserRole', () => {
      expect(deriveLegacyRole(RoleCode.SDIT_ADMIN)).toBe('UNIT_ADMIN');
      expect(deriveLegacyRole(RoleCode.SDIT_GURU)).toBe('TEACHER');
      expect(deriveLegacyRole(RoleCode.SUPER_ADMIN)).toBe('SUPER_ADMIN');
      // Test new roles
      expect(deriveLegacyRole(RoleCode.SMPIT_WAKASEK)).toBe('TEACHER');
      expect(deriveLegacyRole(RoleCode.PT_REKTOR)).toBe('TEACHER');
      expect(deriveLegacyRole(RoleCode.BUSINESS_MANAGER)).toBe('STAFF');
    });

    it('isAdminRoleCode recognises per-unit admins but not teachers/governance', () => {
      expect(isAdminRoleCode(RoleCode.SUPER_ADMIN)).toBe(true);
      expect(isAdminRoleCode(RoleCode.SDIT_ADMIN)).toBe(true);
      expect(isAdminRoleCode(RoleCode.PT_TATA_USAHA)).toBe(true);
      expect(isAdminRoleCode(RoleCode.BUSINESS_MANAGER)).toBe(true);
      expect(isAdminRoleCode(RoleCode.SDIT_GURU)).toBe(false);
      expect(isAdminRoleCode(RoleCode.YAYASAN_PEMBINA)).toBe(false);
    });

    it('isGovernanceRoleCode recognises Yayasan governance roles', () => {
      expect(isGovernanceRoleCode(RoleCode.YAYASAN_PEMBINA)).toBe(true);
      expect(isGovernanceRoleCode(RoleCode.YAYASAN_PENGAWAS)).toBe(true);
      expect(isGovernanceRoleCode(RoleCode.SDIT_ADMIN)).toBe(false);
    });
  });

  describe('authorize() bidirectional legacy expansion', () => {
    it('allows an exact RoleCode match', () => {
      authorize(RoleCode.SDIT_ADMIN)(makeReq({ roleCode: RoleCode.SDIT_ADMIN }), makeRes(), next as unknown as NextFunction);
      expect(next).toHaveBeenCalledWith();
    });

    it('forward-expands a legacy role: authorize(UNIT_ADMIN) admits a per-unit admin', () => {
      authorize(UserRole.UNIT_ADMIN)(makeReq({ roleCode: RoleCode.SDIT_ADMIN }), makeRes(), next as unknown as NextFunction);
      expect(next).toHaveBeenCalledWith();
    });

    it('reverse-expands: authorize(SDIT_ADMIN) admits a pre-migration UNIT_ADMIN token', () => {
      authorize(RoleCode.SDIT_ADMIN)(makeReq({ roleCode: 'UNIT_ADMIN' }), makeRes(), next as unknown as NextFunction);
      expect(next).toHaveBeenCalledWith();
    });

    it('denies an insufficient role with FORBIDDEN', () => {
      authorize(RoleCode.SDIT_ADMIN)(makeReq({ roleCode: RoleCode.SDIT_GURU }), makeRes(), next as unknown as NextFunction);
      expect(lastError(next)).toBeDefined();
      expect(lastError(next).statusCode).toBe(403);
    });

    it('rejects an unauthenticated request with UNAUTHORIZED', () => {
      authorize(RoleCode.SDIT_ADMIN)(makeReq(undefined), makeRes(), next as unknown as NextFunction);
      expect(lastError(next).statusCode).toBe(401);
    });
  });

  describe('role-level guards', () => {
    it('isSuperAdmin only admits SUPER_ADMIN', () => {
      isSuperAdmin(makeReq({ roleCode: RoleCode.SUPER_ADMIN }), makeRes(), next as unknown as NextFunction);
      expect(next).toHaveBeenCalledWith();
      const n2 = vi.fn();
      isSuperAdmin(makeReq({ roleCode: RoleCode.SDIT_ADMIN }), makeRes(), n2 as unknown as NextFunction);
      expect(n2.mock.calls[0][0].statusCode).toBe(403);
    });

    it('isAdmin admits admin-level roles but not teachers', () => {
      isAdmin(makeReq({ roleCode: RoleCode.SDIT_ADMIN }), makeRes(), next as unknown as NextFunction);
      expect(next).toHaveBeenCalledWith();
      const n2 = vi.fn();
      isAdmin(makeReq({ roleCode: RoleCode.SDIT_GURU }), makeRes(), n2 as unknown as NextFunction);
      expect(n2.mock.calls[0][0].statusCode).toBe(403);
    });

    it('isTeacherOrAbove admits teachers and admins, denies students', () => {
      isTeacherOrAbove(makeReq({ roleCode: RoleCode.SDIT_GURU }), makeRes(), next as unknown as NextFunction);
      expect(next).toHaveBeenCalledWith();

      const n2 = vi.fn();
      isTeacherOrAbove(makeReq({ roleCode: RoleCode.SMPIT_WAKASEK }), makeRes(), n2 as unknown as NextFunction);
      expect(n2).toHaveBeenCalledWith();

      const n3 = vi.fn();
      isTeacherOrAbove(makeReq({ roleCode: RoleCode.PT_REKTOR }), makeRes(), n3 as unknown as NextFunction);
      expect(n3).toHaveBeenCalledWith();

      const n4 = vi.fn();
      isTeacherOrAbove(makeReq({ roleCode: RoleCode.SDIT_SISWA }), makeRes(), n4 as unknown as NextFunction);
      expect(n4.mock.calls[0][0].statusCode).toBe(403);
    });
  });

  describe('sameUnit()', () => {
    it('lets SUPER_ADMIN access any unit', () => {
      sameUnit('unitId')(
        makeReq({ roleCode: RoleCode.SUPER_ADMIN, unitId: 'unit-a' }, { params: { unitId: 'unit-b' } as any }),
        makeRes(),
        next as unknown as NextFunction
      );
      expect(next).toHaveBeenCalledWith();
    });

    it('blocks access to a different unit', () => {
      sameUnit('unitId')(
        makeReq({ roleCode: RoleCode.SDIT_ADMIN, unitId: 'unit-a' }, { params: { unitId: 'unit-b' } as any }),
        makeRes(),
        next as unknown as NextFunction
      );
      expect(lastError(next).statusCode).toBe(403);
    });

    it('allows access to the user own unit', () => {
      sameUnit('unitId')(
        makeReq({ roleCode: RoleCode.SDIT_ADMIN, unitId: 'unit-a' }, { params: { unitId: 'unit-a' } as any }),
        makeRes(),
        next as unknown as NextFunction
      );
      expect(next).toHaveBeenCalledWith();
    });
  });
});
