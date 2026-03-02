import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudentService } from '../student.service';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    student: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    unit: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

// Mock Password utility
vi.mock('@/lib/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed_password'),
}));

describe('StudentService', () => {
  let service: StudentService;

  beforeEach(() => {
    service = new StudentService();
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated students filtered by unit for admin', async () => {
      const mockStudents = [
        { id: '1', name: 'Student 1', enrollments: [] },
        { id: '2', name: 'Student 2', enrollments: [] },
      ];

      (prisma.student.findMany as any).mockResolvedValue(mockStudents);
      (prisma.student.count as any).mockResolvedValue(2);

      // Use a known UserRole if ADMIN is not available in the enum, or cast as any if testing logic agnostic to exact enum
      const result = await service.findAll(
        { page: 1, limit: 10, unitId: 'unit-1' },
        { role: 'UNIT_ADMIN' as UserRole, unitId: 'unit-1' }
      );

      expect(prisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            unitId: 'unit-1',
          }),
          skip: 0,
          take: 10,
        })
      );

      expect(result.students).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should allow SUPER_ADMIN to view all units', async () => {
      (prisma.student.findMany as any).mockResolvedValue([]);
      (prisma.student.count as any).mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10 }, { role: UserRole.SUPER_ADMIN, unitId: null });

      // Verify unitId is NOT enforced in where clause
      expect(prisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            unitId: expect.anything(), // Should check what 'where' actually contains
          }),
        })
      );
    });
  });

  describe('create', () => {
    const mockInput = {
      name: 'New Student',
      nis: '12345',
      gender: 'MALE' as const,
      birthDate: new Date('2010-01-01'),
      birthPlace: 'Jakarta',
      address: 'Test Address',
      parentName: 'Parent',
      parentPhone: '08123456789',
      unitId: 'unit-1',
    };

    it('should create student and user successfully', async () => {
      // Setup mocks
      (prisma.student.findFirst as any).mockResolvedValue(null); // No existing NIS
      (prisma.user.findFirst as any).mockResolvedValue(null); // No existing Email
      (prisma.unit.findFirst as any).mockResolvedValue({ id: 'unit-1' }); // Unit exists

      const mockCreatedUser = { id: 'user-1', email: '12345@student.cipansor.local' };
      const mockCreatedStudent = { id: 'student-1', userId: 'user-1', ...mockInput };

      (prisma.user.create as any).mockResolvedValue(mockCreatedUser);
      (prisma.student.create as any).mockResolvedValue(mockCreatedStudent);

      const result = await service.create(mockInput);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: mockInput.name,
            role: UserRole.STUDENT,
          }),
        })
      );
      expect(prisma.student.create).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedStudent);
    });

    it('should throw error if NIS already exists', async () => {
      (prisma.student.findFirst as any).mockResolvedValue({ id: 'existing' });

      await expect(service.create(mockInput)).rejects.toThrow('NIS already exists');
    });
  });
});
