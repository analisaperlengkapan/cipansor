import { prisma } from '@/lib/prisma';
import { hashPassword, comparePassword } from '@/lib/password';
import { generateTokenPair, verifyToken, getExpirationDate } from '@/lib/jwt';
import { Errors } from '@/middleware/error';
import { config } from '@/config';
import type { LoginInput, RegisterInput, ChangePasswordInput } from './auth.schema';
import { UserRole } from '@prisma/client';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';

export class AuthService {
  /**
   * Login user
   */
  async login(input: LoginInput) {
    const user = await prisma.user.findFirst({
      where: {
        email: input.email,
        deletedAt: null,
      },
      include: {
        unit: true,
        userRoles: {
          where: { isActive: true },
          include: {
            role: true,
            unit: true,
          },
          orderBy: { isPrimary: 'desc' },
        },
      },
    });

    if (!user) {
      throw Errors.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw Errors.unauthorized('Account is deactivated');
    }

    const isValid = await comparePassword(input.password, user.passwordHash);

    if (!isValid) {
      throw Errors.unauthorized('Invalid email or password');
    }

    // Determine active role (primary or first role)
    const primaryRole = user.userRoles.find((r) => r.isPrimary) || user.userRoles[0];

    // Check for 2FA
    if (user.isTwoFactorEnabled) {
      // Return temporary token for 2FA verification
      const tempToken = generateTokenPair({
        sub: user.id,
        email: user.email,
        role: user.role,
        unitId: user.unitId,
        roleId: primaryRole?.roleId,
        isTemp: true, // Marker for temp token
      }).accessToken; // We reuse access token as temp token but verify it differently or check payload

      return {
        requiresTwoFactor: true,
        tempToken,
      };
    }

    // Force 2FA setup for Admin/Super Admin
    if (
      (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.UNIT_ADMIN || primaryRole?.role.code === 'SUPER_ADMIN' || primaryRole?.role.code.includes('ADMIN')) &&
      !user.isTwoFactorEnabled
    ) {
        const tempToken = generateTokenPair({
            sub: user.id,
            email: user.email,
            role: user.role,
            unitId: user.unitId,
            roleId: primaryRole?.roleId,
            isTemp: true,
        }).accessToken;

        return {
            requiresTwoFactorSetup: true,
            tempToken,
        };
    }

    // Generate tokens with roleId
    const tokens = generateTokenPair({
      sub: user.id,
      email: user.email,
      role: user.role,
      unitId: user.unitId,
      roleId: primaryRole?.roleId,
    });

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: getExpirationDate(config.jwt.refreshExpiresIn),
      },
    });

    // Update last login
    const [_, __, activeAcademicYearId] = await Promise.all([
      prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
      // Store refresh token is already awaited before this, can't easily parallelize because tokens depend on user
      // But we can parallelize the update and the academic year fetch
      Promise.resolve(), // placeholder to keep structure or I can just await the academic year
      this.getActiveAcademicYearId(),
    ]);

    // Get active academic year
    const academicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    });

    // Return user without password
    const { passwordHash, twoFactorSecret, twoFactorRecoveryCodes, ...userWithoutPassword } = user;

    return {
      user: {
        ...userWithoutPassword,
        academicYearId: activeAcademicYearId,
      },
      ...tokens,
    };
  }

  /**
   * Register new user (by admin)
   */
  async register(input: RegisterInput, creatorRole: UserRole) {
    // Only Super Admin can create Super Admin
    if (input.role === UserRole.SUPER_ADMIN && creatorRole !== UserRole.SUPER_ADMIN) {
      throw Errors.forbidden('Only Super Admin can create Super Admin');
    }

    // Check if email exists
    const existing = await prisma.user.findFirst({
      where: { email: input.email },
    });

    if (existing) {
      throw Errors.conflict('Email already registered');
    }

    // Validate unit for non-super-admin
    if (input.role !== UserRole.SUPER_ADMIN && !input.unitId) {
      throw Errors.badRequest('Unit is required for this role');
    }

    // Hash password
    const passwordHash = await hashPassword(input.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role as UserRole,
        unitId: input.unitId,
        isActive: true,
      },
    });

    // Return without password
    const { passwordHash: _, ...userWithoutPassword } = user;

    const activeAcademicYearId = await this.getActiveAcademicYearId();

    return {
      ...userWithoutPassword,
      academicYearId: activeAcademicYearId,
    };
  }

  /**
   * Refresh tokens
   */
  async refreshToken(refreshToken: string) {
    // Verify token
    let payload;
    try {
      payload = verifyToken(refreshToken);
    } catch {
      throw Errors.unauthorized('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw Errors.unauthorized('Invalid token type');
    }

    // Check if token exists in database
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId: payload.sub,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!storedToken) {
      throw Errors.unauthorized('Refresh token not found or expired');
    }

    if (!storedToken.user.isActive) {
      throw Errors.unauthorized('Account is deactivated');
    }

    // Delete old refresh token
    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    // Generate new tokens
    const tokens = generateTokenPair({
      sub: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
      unitId: storedToken.user.unitId,
    });

    // Store new refresh token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: storedToken.user.id,
        expiresAt: getExpirationDate(config.jwt.refreshExpiresIn),
      },
    });

    return tokens;
  }

  /**
   * Logout (invalidate refresh token)
   */
  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      // Delete specific token
      await prisma.refreshToken.deleteMany({
        where: {
          userId,
          token: refreshToken,
        },
      });
    } else {
      // Delete all refresh tokens for user
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(userId: string) {
    const [user, activeAcademicYearId] = await Promise.all([
      prisma.user.findFirst({
        where: {
          id: userId,
          deletedAt: null,
        },
        include: {
          unit: true,
          student: true,
          userRoles: {
            where: { isActive: true },
            include: {
              role: true,
              unit: true,
            },
            orderBy: { isPrimary: 'desc' },
          },
        },
      }),
      this.getActiveAcademicYearId(),
    ]);

    if (!user) {
      throw Errors.notFound('User');
    }

    // Get active academic year
    const academicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    });

    const { passwordHash, twoFactorSecret, twoFactorRecoveryCodes, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      academicYearId: activeAcademicYearId,
    };
  }

  /**
   * Helper to get active academic year ID
   */
  private async getActiveAcademicYearId(): Promise<string | undefined> {
    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true, deletedAt: null },
      select: { id: true },
    });
    return activeAcademicYear?.id;
  }

  /**
   * Change password
   */
  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw Errors.notFound('User');
    }

    const isValid = await comparePassword(input.currentPassword, user.passwordHash);

    if (!isValid) {
      throw Errors.badRequest('Current password is incorrect');
    }

    const newHash = await hashPassword(input.newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return { message: 'Password changed successfully' };
  }

  // ==========================================
  // 2FA Methods
  // ==========================================

  /**
   * Generate 2FA Secret
   */
  async generateTwoFactorSecret(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw Errors.notFound('User');

    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, 'Cipansor App', secret);
    const qrCodeUrl = await qrcode.toDataURL(otpauth);

    return {
      secret,
      qrCodeUrl,
    };
  }

  /**
   * Enable 2FA
   */
  async enableTwoFactor(userId: string, token: string, secret: string) {
    const isValid = authenticator.verify({ token, secret });

    if (!isValid) {
      throw Errors.badRequest('Invalid OTP code');
    }

    const recoveryCodes = this.generateRecoveryCodes();

    await prisma.user.update({
      where: { id: userId },
      data: {
        isTwoFactorEnabled: true,
        twoFactorSecret: secret,
        twoFactorRecoveryCodes: recoveryCodes,
      },
    });

    return { recoveryCodes };
  }

  /**
   * Verify 2FA Login
   */
  async verifyTwoFactorLogin(userId: string, token: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        unit: true,
        userRoles: {
          where: { isActive: true },
          include: {
            role: true,
            unit: true,
          },
          orderBy: { isPrimary: 'desc' },
        },
      },
    });

    if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
      throw Errors.unauthorized('2FA is not enabled for this user');
    }

    let isValid = authenticator.verify({ token, secret: user.twoFactorSecret });

    // Check recovery codes if OTP failed
    if (!isValid) {
      const recoveryCodeIndex = user.twoFactorRecoveryCodes.indexOf(token);
      if (recoveryCodeIndex !== -1) {
        isValid = true;
        // Remove used recovery code
        const updatedRecoveryCodes = [...user.twoFactorRecoveryCodes];
        updatedRecoveryCodes.splice(recoveryCodeIndex, 1);
        await prisma.user.update({
          where: { id: userId },
          data: { twoFactorRecoveryCodes: updatedRecoveryCodes },
        });
      }
    }

    if (!isValid) {
      throw Errors.unauthorized('Invalid OTP code');
    }

    // Generate tokens
    const primaryRole = user.userRoles.find((r) => r.isPrimary) || user.userRoles[0];
    const tokens = generateTokenPair({
      sub: user.id,
      email: user.email,
      role: user.role,
      unitId: user.unitId,
      roleId: primaryRole?.roleId,
    });

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: getExpirationDate(config.jwt.refreshExpiresIn),
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const activeAcademicYearId = await this.getActiveAcademicYearId();
    const { passwordHash, twoFactorSecret, twoFactorRecoveryCodes, ...userWithoutPassword } = user;

    return {
      user: {
        ...userWithoutPassword,
        academicYearId: activeAcademicYearId,
      },
      ...tokens,
    };
  }

  /**
   * Disable 2FA
   */
  async disableTwoFactor(userId: string, token: string, adminId?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw Errors.notFound('User');

    // Admin/Super Admin cannot disable their own 2FA (if enforcing policy)
    // But for now let's stick to prompt: "tidak bisa di nonaktifkan (untuk admin dan super admin)"
    // This implies they CANNOT disable it at all.
    // "untuk admin dan super admin ketika login pertama kali WAJIB aktifkan 2fa (karena tingkat bahayanya) dan tidak bisa di nonaktifkan (untuk admin dan super admin)"

    // We need to check if target user is admin/super admin
    // We can check role
    const isTargetAdmin = user.role === UserRole.SUPER_ADMIN || user.role === UserRole.UNIT_ADMIN; // Or check specific RoleCode

    if (isTargetAdmin) {
       // If admin tries to disable their own 2FA, prevent it?
       // The prompt says "tidak bisa di nonaktifkan".
       // But wait, "cara kedua yaitu oleh admin atau super admin ... lalu klik tombol non aktifkan 2fa untuk user yang bersangkutan"
       // This implies admin can disable for OTHERS.
       // "untuk admin dan super admin ... tidak bisa di nonaktifkan (untuk admin dan super admin)"
       // This likely means Admin cannot disable 2FA for THEMSELVES or OTHER ADMINS.

       throw Errors.forbidden('2FA cannot be disabled for Admin/Super Admin accounts');
    }

    if (adminId) {
        // Admin disabling for another user
        const admin = await prisma.user.findUnique({ where: { id: adminId } });
        if (!admin || !admin.isTwoFactorEnabled || !admin.twoFactorSecret) {
            throw Errors.unauthorized('Admin must have 2FA enabled to perform this action');
        }

        if (admin.role !== UserRole.SUPER_ADMIN && admin.role !== UserRole.UNIT_ADMIN) {
            throw Errors.forbidden('Only Admins can disable 2FA for other users');
        }

        // Verify ADMIN's OTP
        const isValid = authenticator.verify({ token, secret: admin.twoFactorSecret });
        if (!isValid) throw Errors.unauthorized('Invalid Admin OTP');

    } else {
        // User disabling their own
        if (!user.isTwoFactorEnabled || !user.twoFactorSecret) {
            throw Errors.badRequest('2FA is not enabled');
        }
        // Verify USER's OTP
        const isValid = authenticator.verify({ token, secret: user.twoFactorSecret });
        if (!isValid) throw Errors.unauthorized('Invalid OTP');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        isTwoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorRecoveryCodes: [],
      },
    });

    return { message: '2FA disabled successfully' };
  }

  /**
   * Get 2FA Status
   */
  async getTwoFactorStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isTwoFactorEnabled: true },
    });

    if (!user) throw Errors.notFound('User');

    return { isEnabled: user.isTwoFactorEnabled };
  }

  private generateRecoveryCodes(): string[] {
    return Array.from({ length: 10 }, () =>
      Math.random().toString(36).substr(2, 10).toUpperCase()
    );
  }
}

export const authService = new AuthService();
