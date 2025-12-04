import { prisma } from '@/lib/prisma';
import { Errors } from '@/middleware/error';
import { Realm, RoleCode } from '@prisma/client';

export class RolesService {
  /**
   * Get all roles
   */
  async getAllRoles(realm?: Realm) {
    const where = realm ? { realm, isActive: true } : { isActive: true };
    
    return prisma.role.findMany({
      where,
      orderBy: [{ realm: 'asc' }, { code: 'asc' }],
    });
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: string) {
    const role = await prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw Errors.notFound('Role');
    }

    return role;
  }

  /**
   * Get role by code
   */
  async getRoleByCode(code: RoleCode) {
    const role = await prisma.role.findUnique({
      where: { code },
    });

    if (!role) {
      throw Errors.notFound('Role');
    }

    return role;
  }

  /**
   * Get user's role assignments
   */
  async getUserRoles(userId: string) {
    return prisma.userRoleAssignment.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        role: true,
        unit: true,
      },
      orderBy: { isPrimary: 'desc' },
    });
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(
    userId: string,
    roleId: string,
    unitId?: string,
    isPrimary = false
  ) {
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw Errors.notFound('User');
    }

    // Check if role exists
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw Errors.notFound('Role');
    }

    // Check if assignment already exists
    const existing = await prisma.userRoleAssignment.findFirst({
      where: {
        userId,
        roleId,
        unitId: unitId || null,
      },
    });

    if (existing) {
      throw Errors.conflict('User already has this role');
    }

    // If this is primary, unset other primary roles
    if (isPrimary) {
      await prisma.userRoleAssignment.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return prisma.userRoleAssignment.create({
      data: {
        userId,
        roleId,
        unitId,
        isPrimary,
        isActive: true,
      },
      include: {
        role: true,
        unit: true,
      },
    });
  }

  /**
   * Remove role assignment
   */
  async removeRoleAssignment(assignmentId: string) {
    const assignment = await prisma.userRoleAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw Errors.notFound('Role assignment');
    }

    return prisma.userRoleAssignment.delete({
      where: { id: assignmentId },
    });
  }

  /**
   * Set primary role for user
   */
  async setPrimaryRole(userId: string, assignmentId: string) {
    // Check if assignment exists and belongs to user
    const assignment = await prisma.userRoleAssignment.findFirst({
      where: { id: assignmentId, userId },
    });

    if (!assignment) {
      throw Errors.notFound('Role assignment');
    }

    // Unset all primary roles for user
    await prisma.userRoleAssignment.updateMany({
      where: { userId, isPrimary: true },
      data: { isPrimary: false },
    });

    // Set new primary role
    return prisma.userRoleAssignment.update({
      where: { id: assignmentId },
      data: { isPrimary: true },
      include: {
        role: true,
        unit: true,
      },
    });
  }

  /**
   * Switch active role (for frontend role switcher)
   * This sets the primary role and returns new tokens
   */
  async switchRole(userId: string, roleAssignmentId: string) {
    const assignment = await prisma.userRoleAssignment.findFirst({
      where: {
        id: roleAssignmentId,
        userId,
        isActive: true,
      },
      include: {
        role: true,
        unit: true,
        user: true,
      },
    });

    if (!assignment) {
      throw Errors.notFound('Role assignment');
    }

    // Update primary role
    await prisma.userRoleAssignment.updateMany({
      where: { userId, isPrimary: true },
      data: { isPrimary: false },
    });

    await prisma.userRoleAssignment.update({
      where: { id: roleAssignmentId },
      data: { isPrimary: true },
    });

    return {
      activeRole: assignment,
      user: assignment.user,
    };
  }
}

export const rolesService = new RolesService();
