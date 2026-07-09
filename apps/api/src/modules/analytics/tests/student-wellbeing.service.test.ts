import { describe, it, expect, vi, beforeEach } from 'vitest';
import { studentWellbeingService } from '../student-wellbeing.service';
import { prisma } from '../../../lib/prisma';

vi.mock('../../../lib/prisma', () => ({
  prisma: {
    student: {
      findUnique: vi.fn(),
    },
    medicalRecord: {
      findMany: vi.fn(),
    },
    counselingSession: {
      findMany: vi.fn(),
    },
    violation: {
      findMany: vi.fn(),
    },
  },
}));

describe('StudentWellbeingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStudentWellbeingIndex', () => {
    it('should return a 100 score for a student with no records', async () => {
      vi.mocked(prisma.student.findUnique).mockResolvedValue({
        id: 'student-1',
        fullName: 'Test Student',
        unitId: 'unit-1',
      } as any);

      vi.mocked(prisma.medicalRecord.findMany).mockResolvedValue([]);
      vi.mocked(prisma.counselingSession.findMany).mockResolvedValue([]);
      vi.mocked(prisma.violation.findMany).mockResolvedValue([]);

      const result = await studentWellbeingService.getStudentWellbeingIndex('student-1');

      expect(result.index).toBe(100);
      expect(result.status).toBe('EXCELLENT');
    });

    it('should calculate deductions correctly', async () => {
      vi.mocked(prisma.student.findUnique).mockResolvedValue({
        id: 'student-1',
        fullName: 'Test Student',
        unitId: 'unit-1',
      } as any);

      // 2 medical records = -10
      vi.mocked(prisma.medicalRecord.findMany).mockResolvedValue([{}, {}] as any);

      // 1 high priority counseling = -15
      vi.mocked(prisma.counselingSession.findMany).mockResolvedValue([
        { priority: 'HIGH' }
      ] as any);

      // 1 violation with 50 points = -5 (base) - 5 (points/10) = -10
      vi.mocked(prisma.violation.findMany).mockResolvedValue([
        { points: 50 }
      ] as any);

      const result = await studentWellbeingService.getStudentWellbeingIndex('student-1');

      // 100 - 10 - 15 - 10 = 65
      expect(result.index).toBe(65);
      expect(result.status).toBe('CONCERNING');
    });

    it('should handle zero floor for index', async () => {
      vi.mocked(prisma.student.findUnique).mockResolvedValue({
        id: 'student-1',
        fullName: 'Test Student',
        unitId: 'unit-1',
      } as any);

      vi.mocked(prisma.medicalRecord.findMany).mockResolvedValue(new Array(30).fill({})); // -150

      const result = await studentWellbeingService.getStudentWellbeingIndex('student-1');

      expect(result.index).toBe(0);
      expect(result.status).toBe('CRITICAL');
    });
  });
});
