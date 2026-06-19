import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { Errors } from '@/middleware/error';
import { UserRole, Prisma } from '@prisma/client';
import type { ListUsersQuery, CreateUserInput, UpdateUserInput } from './user.schema';

export class UserService {
  /**
   * Get all users with pagination and filters
   */
  async findAll(query: ListUsersQuery, currentUser: { role: string; unitId: string | null }) {
    const { page, limit, search, role, unitId } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    // Filter by unit for non-super-admin
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      where.unitId = currentUser.unitId;
    } else if (unitId) {
      where.unitId = unitId;
    }

    if (role) {
      where.role = role as UserRole;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Execute queries
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          unitId: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          unit: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          userRoles: {
            where: { isActive: true },
            orderBy: { isPrimary: 'desc' },
            select: {
              id: true,
              isPrimary: true,
              role: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  realm: true,
                  description: true,
                },
              },
              unit: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID
   */
  async findById(id: string) {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        unit: true,
        student: true,
        userRoles: {
          where: { isActive: true },
          orderBy: { isPrimary: 'desc' },
          include: {
            role: {
              select: {
                id: true,
                code: true,
                name: true,
                realm: true,
                description: true,
              },
            },
            unit: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
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
   * Create new user
   */
  async create(input: CreateUserInput, creatorRole: UserRole) {
    // Only Super Admin can create Super Admin
    if (input.role === 'SUPER_ADMIN' && creatorRole !== UserRole.SUPER_ADMIN) {
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
    if (input.role !== 'SUPER_ADMIN' && !input.unitId) {
      throw Errors.badRequest('Unit is required for this role');
    }

    // If unit provided, check it exists
    if (input.unitId) {
      const unit = await prisma.unit.findFirst({
        where: { id: input.unitId, deletedAt: null },
      });
      if (!unit) {
        throw Errors.notFound('Unit');
      }
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
        unitId: input.unitId || null,
        isActive: true,
      },
      include: { unit: true },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Update user
   */
  async update(id: string, input: UpdateUserInput, currentUser: { role: string; sub: string }) {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw Errors.notFound('User');
    }

    // Only Super Admin can update role
    if (input.role && currentUser.role !== UserRole.SUPER_ADMIN) {
      throw Errors.forbidden('Only Super Admin can change roles');
    }

    // Check email uniqueness if changing
    if (input.email && input.email !== user.email) {
      const existing = await prisma.user.findFirst({
        where: { email: input.email, id: { not: id } },
      });
      if (existing) {
        throw Errors.conflict('Email already in use');
      }
    }

    // Update user
    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: input.name,
        email: input.email,
        role: input.role as UserRole | undefined,
        unitId: input.unitId,
        isActive: input.isActive,
      },
      include: { unit: true },
    });

    const { passwordHash, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }

  /**
   * Delete user (soft delete)
   */
  async delete(id: string) {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw Errors.notFound('User');
    }

    // Soft delete
    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Also delete refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { userId: id },
    });

    return { message: 'User deleted successfully' };
  }
}

export const userService = new UserService();
