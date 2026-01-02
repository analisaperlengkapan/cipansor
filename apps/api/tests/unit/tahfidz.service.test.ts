import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TahfidzService } from '../../src/modules/tahfidz/tahfidz.service';
import { prisma } from '../../src/lib/prisma';
import { UserRole } from '@prisma/client';

// Mock prisma
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    tahfidzRecord: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      groupBy: vi.fn(),
      aggregate: vi.fn(),
      findUnique: vi.fn(),
    },
    student: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    $queryRaw: vi.fn(),
    sql: vi.fn(),
    empty: vi.fn(),
  },
}));

describe('TahfidzService', () => {
  let service: TahfidzService;

  beforeEach(() => {
    service = new TahfidzService();
    vi.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should calculate stats correctly and optimize top students query', async () => {
      // Mock data
      const mockTotalRecords = 100;
      const mockUniqueStudents = [{ studentId: '1' }, { studentId: '2' }];
      const mockRecordsByType = [
        { activityType: 'ZIYADAH', _count: { _all: 50 } },
        { activityType: 'MUROJAAH', _count: { _all: 30 } },
      ];
      const mockMonthlyActivity = [
        { month: 1, type: 'ZIYADAH', count: BigInt(10) },
      ];
      const mockProgressByJuz = [
        { juz: 1, student_count: BigInt(5) },
      ];
      const mockRecordsByGrade = [
        { grade: 'MUMTAZ', count: BigInt(20) },
      ];

      // Top students mocks
      const mockTopStudentsData = [
        { studentId: 's1', _sum: { totalAyah: 100 } },
        { studentId: 's2', _sum: { totalAyah: 80 } },
      ];
      const mockTopStudentDetails = [
        { id: 's1', user: { name: 'Student 1' }, nis: '123' },
        { id: 's2', user: { name: 'Student 2' }, nis: '124' },
      ];
      const mockAllJuzCounts = [
        { studentId: 's1', juz: 1, _count: { juz: 1 } },
        { studentId: 's1', juz: 2, _count: { juz: 1 } },
        { studentId: 's2', juz: 1, _count: { juz: 1 } },
      ];

      // Setup mocks
      (prisma.tahfidzRecord.count as any).mockResolvedValue(mockTotalRecords);
      (prisma.tahfidzRecord.findMany as any).mockResolvedValue(mockUniqueStudents); // reused for recentRecords but keeping simple
      (prisma.tahfidzRecord.groupBy as any)
        .mockResolvedValueOnce(mockRecordsByType) // recordsByType
        .mockResolvedValueOnce(mockTopStudentsData) // topStudentsData
        .mockResolvedValueOnce(mockAllJuzCounts); // allJuzCounts (bulk query)

      (prisma.$queryRaw as any)
        .mockResolvedValueOnce(mockMonthlyActivity)
        .mockResolvedValueOnce(mockProgressByJuz)
        .mockResolvedValueOnce(mockRecordsByGrade);

      (prisma.student.findMany as any).mockResolvedValue(mockTopStudentDetails);

      // Execute
      const result = await service.getDashboardStats({ year: 2023 });

      // Assert
      expect(result.totalRecords).toBe(mockTotalRecords);
      expect(result.totalStudents).toBe(mockUniqueStudents.length);

      // Verify optimized top students logic
      expect(result.topStudents).toHaveLength(2);
      expect(result.topStudents[0]).toEqual({
        studentId: 's1',
        studentName: 'Student 1',
        nis: '123',
        totalAyah: 100,
        completedJuz: 2, // Should count s1 entries in mockAllJuzCounts
      });
      expect(result.topStudents[1]).toEqual({
        studentId: 's2',
        studentName: 'Student 2',
        nis: '124',
        totalAyah: 80,
        completedJuz: 1, // Should count s2 entries
      });

      // Verify that we didn't call findMany inside a loop for top students
      // We expect 1 call for details and 1 call for bulk juz counts
      expect(prisma.student.findMany).toHaveBeenCalledTimes(1);
      // groupBy called for: type stats, top students list, bulk juz counts
      expect(prisma.tahfidzRecord.groupBy).toHaveBeenCalledTimes(3);
    });
  });
});
