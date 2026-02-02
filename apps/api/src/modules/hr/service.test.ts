import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createEmployee } from './service';
import { prisma } from '../../lib/prisma';
import bcrypt from 'bcryptjs';

// Mock dependencies
vi.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    teacher: {
      create: vi.fn(),
    },
    staff: {
      create: vi.fn(),
    },
    employeeSalary: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
  },
}));

describe('HR Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createEmployee', () => {
    it('should create a teacher with bank info saved to teacher table', async () => {
      const input = {
        name: 'Guru Test',
        email: 'guru@test.com',
        role: 'TEACHER' as const,
        unitId: 'unit-1',
        nip: '12345',
        bankName: 'BCA',
        bankAccountNumber: '1234567890',
        bankAccountName: 'Guru Test',
        address: 'Jl. Test',
        rt: '01',
        rw: '02',
      };

      // Mock findUnique (email check)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      // Mock user creation
      vi.mocked(prisma.user.create).mockResolvedValue({ id: 'user-1', ...input } as any);

      await createEmployee(input);

      expect(prisma.teacher.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          bankName: 'BCA',
          bankAccountNumber: '1234567890',
          bankAccountName: 'Guru Test',
          rt: '01',
          rw: '02',
        }),
      });

      // Ensure EmployeeSalary is NOT created for teacher
      expect(prisma.employeeSalary.create).not.toHaveBeenCalled();
    });

    it('should create a staff with bank info saved to employeeSalary table', async () => {
      const input = {
        name: 'Staff Test',
        email: 'staff@test.com',
        role: 'STAFF' as const,
        unitId: 'unit-1',
        nip: '67890',
        position: 'Admin',
        bankName: 'Mandiri',
        bankAccountNumber: '0987654321',
        bankAccountName: 'Staff Test',
      };

      // Mock findUnique (email check)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      // Mock user creation
      vi.mocked(prisma.user.create).mockResolvedValue({ id: 'user-2', ...input } as any);
      // Mock staff creation
      vi.mocked(prisma.staff.create).mockResolvedValue({ id: 'staff-1', userId: 'user-2' } as any);

      await createEmployee(input);

      expect(prisma.staff.create).toHaveBeenCalled();

      // Ensure EmployeeSalary IS created for staff
      expect(prisma.employeeSalary.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          staffId: 'staff-1',
          bankName: 'Mandiri',
          bankAccount: '0987654321',
          bankHolder: 'Staff Test',
        }),
      });
    });
  });
});
