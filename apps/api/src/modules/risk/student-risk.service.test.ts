import { describe, it, expect, vi, beforeEach } from 'vitest';
import { studentRiskService } from './student-risk.service';
import { prisma } from '@/lib/prisma';
import { PaymentStatus, AttendanceStatus } from '@prisma/client';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    student: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('StudentRiskService', () => {
  const mockStudentId = 'student-123';
  const mockUnitId = 'unit-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateStudentRisk', () => {
    it('should calculate risk correctly for a high-risk student', async () => {
      // Mock Data Structure matching the "include" query
      const mockStudentData = {
        id: mockStudentId,
        name: 'John Doe',
        enrollments: [{ class: { name: '10-A' } }],
        violations: [{ points: 10 }, { points: 10 }],
        grades: [
          { score: { toNumber: () => 50 } }, // Fail
          { score: { toNumber: () => 60 } }, // Fail
          { score: { toNumber: () => 80 } }, // Pass
        ],
        invoices: [
          { status: PaymentStatus.OVERDUE, amount: 100000, paidAmount: 0 },
          { status: PaymentStatus.OVERDUE, amount: 50000, paidAmount: 0 },
        ],
        attendances: Array(5).fill({ status: AttendanceStatus.ABSENT })
      };

      vi.mocked(prisma.student.findUnique).mockResolvedValue(mockStudentData as any);

      const result = await studentRiskService.calculateStudentRisk(mockStudentId);

      // Behavior: 20 pts (20 * 1)
      // Academic: 20 pts (2 failing * 10)
      // Financial: 10 pts (2 overdue * 5)
      // Attendance: 10 pts (5 absent * 2)
      // Total: 60

      expect(result.riskScore).toBe(60);
      expect(result.riskLevel).toBe('HIGH');
      expect(result.details.behavior.totalPoints).toBe(20);
      expect(result.details.academic.failingSubjects).toBe(2);
      expect(result.details.financial.overdueInvoices).toBe(2);
      expect(result.details.attendance.absenceCount).toBe(5);
    });
  });

  describe('getAtRiskStudents', () => {
     it('should return sorted list of at-risk students', async () => {
        const student1 = {
            id: 's1', name: 'S1', enrollments: [],
            violations: [{ points: 100 }], // High Risk
            grades: [], invoices: [], attendances: []
        };
        const student2 = {
            id: 's2', name: 'S2', enrollments: [],
            violations: [], // Low Risk
            grades: [], invoices: [], attendances: []
        };

        vi.mocked(prisma.student.findMany).mockResolvedValue([student1, student2] as any);

        const results = await studentRiskService.getAtRiskStudents(mockUnitId, 20);

        expect(results.length).toBe(1);
        expect(results[0].studentId).toBe('s1');
     });
  });
});
