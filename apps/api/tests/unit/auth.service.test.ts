/**
 * Auth Service Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRole, RoleCode } from '@prisma/client';

// Use vi.hoisted to define mocks that will be available in vi.mock factories
const {
  mockPrisma,
  mockComparePassword,
  mockHashPassword,
  mockGenerateTokenPair,
  mockVerifyToken,
  mockGetExpirationDate,
  mockUserRole,
  mockRoleCode,
} = vi.hoisted(() => {
  return {
    mockPrisma: {
      user: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      academicYear: {
        findFirst: vi.fn(),
      },
      refreshToken: {
        create: vi.fn(),
        findFirst: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
      },
      unit: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
      },
      role: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
      },
      userRoleAssignment: {
        create: vi.fn(),
      },
      // register() runs user + role-assignment creation in a transaction.
      $transaction: vi.fn(),
    },
    mockComparePassword: vi.fn(),
    mockHashPassword: vi.fn().mockResolvedValue('hashed-password'),
    mockGenerateTokenPair: vi.fn().mockReturnValue({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    }),
    mockVerifyToken: vi.fn(),
    mockGetExpirationDate: vi.fn().mockReturnValue(new Date(Date.now() + 86400000)),
    mockUserRole: {
      SUPER_ADMIN: 'SUPER_ADMIN',
      UNIT_ADMIN: 'UNIT_ADMIN',
      TEACHER: 'TEACHER',
      STAFF: 'STAFF',
      STUDENT: 'STUDENT',
      PARENT: 'PARENT',
    },
    mockRoleCode: {
      SUPER_ADMIN: 'SUPER_ADMIN',
      YAYASAN_ADMIN: 'YAYASAN_ADMIN',
      TKQ_ADMIN: 'TKQ_ADMIN',
      SDIT_ADMIN: 'SDIT_ADMIN',
      SMPIT_ADMIN: 'SMPIT_ADMIN',
      SMAQ_ADMIN: 'SMAQ_ADMIN',
      UNIT_ADMIN: 'UNIT_ADMIN',
    },
  };
});

// Mock modules after hoisted definitions
vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

// NOTE: @prisma/client is intentionally NOT mocked — the real generated enums
// (UserRole/RoleCode/UnitType) are needed so the RoleCode legacy mapping in
// middleware/auth resolves correctly.

vi.mock('@/lib/password', () => ({
  hashPassword: mockHashPassword,
  comparePassword: mockComparePassword,
}));

vi.mock('@/lib/jwt', () => ({
  generateTokenPair: mockGenerateTokenPair,
  verifyToken: mockVerifyToken,
  getExpirationDate: mockGetExpirationDate,
}));

vi.mock('@/config', () => ({
  config: {
    env: 'test',
    port: 3001,
    jwt: {
      secret: 'test-secret',
      expiresIn: '7d',
      refreshExpiresIn: '7d',
    },
    bcrypt: {
      saltRounds: 10,
    },
    cors: {
      origin: 'http://localhost:3000',
    },
    rateLimit: {
      windowMs: 60000,
      maxRequests: 100,
    },
    log: {
      level: 'error',
    },
  },
}));

// Import after mocking
import { AuthService } from '@/modules/auth/auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService();
    // The register() transaction simply runs its callback against the mock client.
    (mockPrisma.$transaction as any).mockImplementation(async (cb: any) => cb(mockPrisma));
  });

  describe('login', () => {
    const validLoginInput = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hashed-password',
      role: UserRole.STUDENT,
      unitId: 'unit-1',
      isActive: true,
      unit: { id: 'unit-1', name: 'Test Unit' },
      userRoles: [
        {
          id: 'role-1',
          roleId: 'role-id-1',
          isPrimary: true,
          isActive: true,
          role: { id: 'role-id-1', name: 'Student', code: 'STUDENT' },
          unit: { id: 'unit-1', name: 'Test Unit' },
        },
      ],
    };

    it('should successfully login with valid credentials', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.academicYear.findFirst.mockResolvedValue({ id: 'ay-1' });
      mockComparePassword.mockResolvedValue(true);
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const result = await authService.login(validLoginInput);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user).toHaveProperty('academicYearId', 'ay-1');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should throw error for non-existent email', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(authService.login(validLoginInput)).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for deactivated account', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(authService.login(validLoginInput)).rejects.toThrow('Account is deactivated');
    });

    it('should throw error for incorrect password', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockComparePassword.mockResolvedValue(false);

      await expect(authService.login(validLoginInput)).rejects.toThrow('Invalid email or password');
    });
  });

  describe('register', () => {
    const baseInput = {
      name: 'New User',
      email: 'newuser@example.com',
      password: 'password123',
    };

    // Common happy-path lookups: the target unit and the requested role exist.
    const setupLookups = (code: RoleCode) => {
      (mockPrisma.unit.findUnique as any).mockResolvedValue({ type: 'SD_IT' });
      (mockPrisma.role.findFirst as any).mockResolvedValue({
        id: 'role-1',
        code,
        isActive: true,
        permissions: [],
      });
    };

    it('should successfully register a new user', async () => {
      setupLookups(RoleCode.SDIT_GURU);
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-user-id',
        name: baseInput.name,
        email: baseInput.email,
        role: UserRole.TEACHER,
        unitId: 'unit-1',
        passwordHash: 'hashed-password',
        isActive: true,
      });
      (mockPrisma.userRoleAssignment.create as any).mockResolvedValue({ id: 'ura-1' });
      mockPrisma.academicYear.findFirst.mockResolvedValue({ id: 'ay-1' });

      const result = await authService.register(
        { ...baseInput, roleCode: RoleCode.SDIT_GURU, unitId: 'unit-1' },
        RoleCode.SUPER_ADMIN
      );

      expect(result).toHaveProperty('id');
      expect(result.email).toBe('newuser@example.com');
      expect(result).not.toHaveProperty('passwordHash');
      expect(mockHashPassword).toHaveBeenCalledWith('password123');
    });

    it('should throw error when email already exists', async () => {
      setupLookups(RoleCode.SDIT_GURU);
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'existing-user' });

      await expect(
        authService.register(
          { ...baseInput, roleCode: RoleCode.SDIT_GURU, unitId: 'unit-1' },
          RoleCode.SUPER_ADMIN
        )
      ).rejects.toThrow('Email already registered');
    });

    it('should prevent non-super-admin from creating super-admin', async () => {
      (mockPrisma.role.findFirst as any).mockResolvedValue({
        id: 'role-sa',
        code: RoleCode.SUPER_ADMIN,
        isActive: true,
        permissions: [],
      });

      await expect(
        authService.register({ ...baseInput, roleCode: RoleCode.SUPER_ADMIN }, RoleCode.SDIT_ADMIN)
      ).rejects.toThrow('Only Super Admin can create Super Admin');
    });

    it('should require unit for non-super-admin roles', async () => {
      setupLookups(RoleCode.SDIT_GURU);
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        authService.register({ ...baseInput, roleCode: RoleCode.SDIT_GURU }, RoleCode.SUPER_ADMIN)
      ).rejects.toThrow('Unit is required for this role');
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const mockStoredToken = {
        id: 'token-1',
        token: 'valid-refresh-token',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 86400000),
        user: {
          id: 'user-1',
          email: 'test@example.com',
          role: UserRole.SUPER_ADMIN,
          unitId: 'unit-1',
          isActive: true,
          // refreshToken() reads the primary role assignment to mint new tokens.
          userRoles: [
            {
              isPrimary: true,
              roleId: 'role-1',
              unitId: 'unit-1',
              role: { code: RoleCode.SUPER_ADMIN, permissions: [] },
            },
          ],
        },
      };

      mockVerifyToken.mockReturnValue({
        sub: 'user-1',
        type: 'refresh',
      });
      mockPrisma.refreshToken.findFirst.mockResolvedValue(mockStoredToken);
      mockPrisma.refreshToken.delete.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await authService.refreshToken('valid-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw error for invalid token type', async () => {
      mockVerifyToken.mockReturnValue({
        sub: 'user-1',
        type: 'access',
      });

      await expect(authService.refreshToken('invalid-type-token')).rejects.toThrow(
        'Invalid token type'
      );
    });
  });

  describe('logout', () => {
    it('should delete specific refresh token when provided', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await authService.logout('user-1', 'specific-token');

      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          token: 'specific-token',
        },
      });
    });

    it('should delete all refresh tokens when no specific token provided', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 3 });

      await authService.logout('user-1');

      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });

  describe('getCurrentUser', () => {
    it('should return user without password hash', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed-password',
        role: UserRole.SUPER_ADMIN,
        unitId: 'unit-1',
        unit: { id: 'unit-1', name: 'Test Unit' },
        student: null,
        userRoles: [],
      };
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.academicYear.findFirst.mockResolvedValue({ id: 'ay-1' });

      const result = await authService.getCurrentUser('user-1');

      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('academicYearId', 'ay-1');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw error for non-existent user', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(authService.getCurrentUser('invalid-user')).rejects.toThrow();
    });
  });

  describe('changePassword', () => {
    const changePasswordInput = {
      currentPassword: 'old-password',
      newPassword: 'new-password',
    };

    it('should successfully change password', async () => {
      const mockUser = {
        id: 'user-1',
        passwordHash: 'old-hash',
      };
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockComparePassword.mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({});

      const result = await authService.changePassword('user-1', changePasswordInput);

      expect(result.message).toBe('Password changed successfully');
      expect(mockHashPassword).toHaveBeenCalledWith('new-password');
    });

    it('should throw error for incorrect current password', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-1', passwordHash: 'hash' });
      mockComparePassword.mockResolvedValue(false);

      await expect(authService.changePassword('user-1', changePasswordInput)).rejects.toThrow(
        'Current password is incorrect'
      );
    });
  });
});
