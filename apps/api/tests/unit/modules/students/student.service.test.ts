import { describe, it, expect, vi, beforeEach } from 'vitest';
import { studentService } from '../../../../src/modules/students/student.service';
import { prisma } from '../../../../src/lib/prisma';
import { Errors } from '../../../../src/middleware/error';

// Mock Prisma
vi.mock('../../../../src/lib/prisma', () => {
  const prismaClient = {
    student: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    unit: {
      findFirst: vi.fn(),
    },
    violation: {
      aggregate: vi.fn(),
    },
    invoice: {
      aggregate: vi.fn(), // Changed from findMany to aggregate
    },
    class: {
      findFirst: vi.fn(),
    },
    classEnrollment: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prismaClient)),
  };
  return { prisma: prismaClient };
});

vi.mock('../../../../src/lib/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed_password'),
}));

describe('StudentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findById', () => {
    it('should return student with summary data', async () => {
      const mockStudent = {
        id: 'student-1',
        name: 'Test Student',
        enrollments: [
          {
            status: 'active',
            class: {
              id: 'class-1',
              name: '10A',
              level: '10',
              academicYear: { name: '2023/2024' },
            },
          },
        ],
        attendances: [],
        tahfidzRecords: [],
        wallet: { balance: 500000 },
        roomAssignments: [
          {
            assignedAt: new Date(),
            room: {
              name: 'Room 101',
              dormitory: { name: 'Dorm A' },
            },
          },
        ],
        violations: [],
        medicalRecords: [],
        invoices: [],
      };

      const mockViolationStats = { _sum: { points: 15 } };
      const mockInvoiceStats = {
        _sum: { amount: 150000, paidAmount: 0 },
        _count: { id: 2 },
      };

      // Ensure mock implementations return promises
      vi.mocked(prisma.student.findFirst).mockResolvedValue(mockStudent as any);
      vi.mocked(prisma.violation.aggregate).mockResolvedValue(mockViolationStats as any);
      vi.mocked(prisma.invoice.aggregate).mockResolvedValue(mockInvoiceStats as any); // Use aggregate

      const result = await studentService.findById('student-1');

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.walletBalance).toBe(500000);
      expect(result.summary.violationPoints).toBe(15);
      expect(result.summary.unpaidInvoices.count).toBe(2);
      expect(result.summary.unpaidInvoices.total).toBe(150000);
      expect(result.summary.boarding.roomName).toBe('Room 101');
    });

    it('should throw error if student not found', async () => {
      vi.mocked(prisma.student.findFirst).mockResolvedValue(null);

      await expect(studentService.findById('invalid-id')).rejects.toThrow(
        Errors.notFound('Student')
      );
    });
  });
});
