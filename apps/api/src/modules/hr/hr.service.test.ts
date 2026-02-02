import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as service from './service';
import { prisma } from '../../lib/prisma';

// Mock @prisma/client Enums
vi.mock('@prisma/client', () => ({
  UserRole: { TEACHER: 'TEACHER', STAFF: 'STAFF' },
  LeaveType: { SICK: 'SICK', ANNUAL: 'ANNUAL' },
  LeaveStatus: { PENDING: 'PENDING', APPROVED: 'APPROVED' },
  StaffAttendanceStatus: { PRESENT: 'PRESENT' },
  Prisma: { Decimal: class Decimal {} },
}));

// Mock Prisma
vi.mock('../../lib/prisma', () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    teacher: { create: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
    staff: { create: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
    leave: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      aggregate: vi.fn(),
      update: vi.fn(),
    },
    leaveBalance: { findUnique: vi.fn(), update: vi.fn() },
    academicYear: { findFirst: vi.fn() },
    staffAttendance: { create: vi.fn(), upsert: vi.fn() },
    $transaction: vi.fn((arg) => {
      if (Array.isArray(arg)) {
        return Promise.resolve(arg);
      }
      if (typeof arg === 'function') {
        return arg(mockPrisma);
      }
      return Promise.resolve(arg);
    }),
  };
  return { prisma: mockPrisma };
});

describe('HR Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createEmployee', () => {
    it('should create a teacher employee', async () => {
      const input = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'TEACHER',
        unitId: 'unit-1',
        nip: '12345',
        phone: '08123456789',
      };

      (prisma.user.findUnique as any).mockResolvedValue(null);
      (prisma.user.create as any).mockResolvedValue({ id: 'user-1', ...input });
      (prisma.teacher.create as any).mockResolvedValue({ id: 'teacher-1' });

      const result = await service.createEmployee(input as any);

      expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          email: input.email,
          role: 'TEACHER',
        }),
      }));
      expect(prisma.teacher.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          nip: input.nip,
        }),
      }));
      expect(result).toHaveProperty('id', 'user-1');
    });

    it('should throw error if email exists', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({ id: 'existing' });

      await expect(service.createEmployee({ email: 'test@example.com' } as any))
        .rejects.toThrow('Email already exists');
    });
  });

  describe('createLeave (Validation)', () => {
    it('should validate overlapping leave', async () => {
      const input = {
        staffId: 'staff-1',
        type: 'SICK',
        startDate: '2024-01-01',
        endDate: '2024-01-03',
        reason: 'Flu',
      };

      // Mock overlapping leave check
      (prisma.leave.findFirst as any).mockResolvedValue({ id: 'existing-leave' });

      await expect(service.createLeave(input as any))
        .rejects.toThrow('Leave request overlaps with an existing request');
    });

    it('should validate annual leave balance', async () => {
      const input = {
        staffId: 'staff-1',
        type: 'ANNUAL',
        startDate: '2024-01-01', // 1 day
        endDate: '2024-01-01',
        reason: 'Holiday',
      };

      (prisma.leave.findFirst as any).mockResolvedValue(null); // No overlap
      (prisma.staff.findUnique as any).mockResolvedValue({ userId: 'user-1' });
      (prisma.academicYear.findFirst as any).mockResolvedValue({ id: 'ay-1', startDate: new Date('2023-07-01'), endDate: new Date('2024-06-30') });

      // Mock Balance: 0 remaining
      (prisma.leave.aggregate as any).mockResolvedValue({ _sum: { totalDays: 0 } }); // 0 pending
      (prisma.leaveBalance.findUnique as any).mockResolvedValue({ remainingDays: 0 });

      await expect(service.createLeave(input as any))
        .rejects.toThrow('Insufficient annual leave balance');
    });
  });

  describe('recordBulkAttendance', () => {
    it('should upsert multiple records', async () => {
      const input = {
        date: '2024-01-01',
        records: [
          { staffId: 's1', status: 'PRESENT' },
          { staffId: 's2', status: 'ABSENT' },
        ],
      };

      (prisma.staffAttendance.upsert as any).mockResolvedValue({});

      await service.recordBulkAttendance(input as any);

      expect(prisma.staffAttendance.upsert).toHaveBeenCalledTimes(2);
    });
  });
});
