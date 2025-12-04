import { prisma } from '@/lib/prisma';
import { hashPassword, comparePassword } from '@/lib/password';
import { generateTokenPair, verifyToken, getExpirationDate } from '@/lib/jwt';
import { Errors } from '@/middleware/error';
import { config } from '@/config';
import type { LoginInput, RegisterInput, ChangePasswordInput } from './auth.schema';
import { UserRole } from '@prisma/client';

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
    const primaryRole = user.userRoles.find(r => r.isPrimary) || user.userRoles[0];
    
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
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Return user without password
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
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
    return userWithoutPassword;
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
    const user = await prisma.user.findFirst({
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
    });

    if (!user) {
      throw Errors.notFound('User');
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
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
}

export const authService = new AuthService();
