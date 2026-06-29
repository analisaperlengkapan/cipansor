import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateRaporPesantren } from '../rapor-pesantren.service';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    student: {
      findUnique: vi.fn(),
    },
    academicYear: {
      findUnique: vi.fn(),
    },
    setting: {
      findUnique: vi.fn(),
    },
    tahfidzRecord: {
      findMany: vi.fn(),
    },
    takhosusEnrollment: {
      findMany: vi.fn(),
    },
    simaanExam: {
      count: vi.fn(),
    },
    dailyIbadahRecord: {
      findMany: vi.fn(),
    },
    muhadhoroh: {
      findMany: vi.fn(),
    },
    muhadatsah: {
      findMany: vi.fn(),
    },
    kitabProgress: {
      findMany: vi.fn(),
    },
    violation: {
      findMany: vi.fn(),
    },
    reward: {
      findMany: vi.fn(),
    },
    attendance: {
      findMany: vi.fn(),
    },
    grade: {
      findMany: vi.fn(),
    },
    raporPesantren: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('RaporPesantren Aggregator', () => {
  const mockStudent = {
    id: 'student-1',
    name: 'Test Student',
    nis: '12345',
    unitId: 'unit-1',
    gender: 'MALE',
    birthDate: new Date(),
    user: { name: 'Test Student' },
    enrollments: [],
    roomAssignments: [],
  };

  const mockAcademicYear = {
    id: 'year-1',
    name: '2024/2025',
    startDate: new Date('2024-07-01'),
    endDate: new Date('2025-06-30'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should aggregate all components and calculate overall score', async () => {
    (prisma.student.findUnique as any).mockResolvedValue(mockStudent);
    (prisma.academicYear.findUnique as any).mockResolvedValue(mockAcademicYear);
    (prisma.setting.findUnique as any).mockResolvedValue(null);

    (prisma.tahfidzRecord.findMany as any).mockResolvedValue([]);
    (prisma.takhosusEnrollment.findMany as any).mockResolvedValue([]);
    (prisma.simaanExam.count as any).mockResolvedValue(0);
    (prisma.dailyIbadahRecord.findMany as any).mockResolvedValue([]);
    (prisma.muhadhoroh.findMany as any).mockResolvedValue([]);
    (prisma.muhadatsah.findMany as any).mockResolvedValue([]);
    (prisma.kitabProgress.findMany as any).mockResolvedValue([]);
    (prisma.violation.findMany as any).mockResolvedValue([]);
    (prisma.reward.findMany as any).mockResolvedValue([]);
    (prisma.attendance.findMany as any).mockResolvedValue([]);
    (prisma.grade.findMany as any).mockResolvedValue([]);
    (prisma.raporPesantren.findFirst as any).mockResolvedValue(null);
    (prisma.raporPesantren.create as any).mockImplementation((args: any) => ({
      ...args.data,
      id: 'rapor-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await generateRaporPesantren({
      studentId: 'student-1',
      academicYearId: 'year-1',
      semester: 1,
    });

    expect(result).toBeDefined();
    expect(result.academic).toBeDefined();
    expect(result.academic?.averageScore).toBe(0);
  });

  it('should include academic trends in the result', async () => {
    (prisma.student.findUnique as any).mockResolvedValue(mockStudent);
    (prisma.academicYear.findUnique as any).mockResolvedValue(mockAcademicYear);

    const mockGrades = [
      {
        id: 'g1',
        score: 80,
        subjectId: 's1',
        subject: { name: 'Math', passingScore: 70 },
        gradedAt: new Date('2024-08-10'),
      },
      {
        id: 'g2',
        score: 90,
        subjectId: 's1',
        subject: { name: 'Math', passingScore: 70 },
        gradedAt: new Date('2024-09-10'),
      }
    ];

    (prisma.grade.findMany as any).mockResolvedValue(mockGrades);
    (prisma.tahfidzRecord.findMany as any).mockResolvedValue([]);
    (prisma.takhosusEnrollment.findMany as any).mockResolvedValue([]);
    (prisma.simaanExam.count as any).mockResolvedValue(0);
    (prisma.dailyIbadahRecord.findMany as any).mockResolvedValue([]);
    (prisma.muhadhoroh.findMany as any).mockResolvedValue([]);
    (prisma.muhadatsah.findMany as any).mockResolvedValue([]);
    (prisma.kitabProgress.findMany as any).mockResolvedValue([]);
    (prisma.violation.findMany as any).mockResolvedValue([]);
    (prisma.reward.findMany as any).mockResolvedValue([]);
    (prisma.attendance.findMany as any).mockResolvedValue([]);
    (prisma.raporPesantren.findFirst as any).mockResolvedValue(null);
    (prisma.raporPesantren.create as any).mockImplementation((args: any) => ({
      ...args.data,
      id: 'rapor-2',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await generateRaporPesantren({
      studentId: 'student-1',
      academicYearId: 'year-1',
      semester: 1,
    });

    expect(result.academic?.averageScore).toBe(85);
    expect(result.academic?.trends).toHaveLength(2);
  });
});
