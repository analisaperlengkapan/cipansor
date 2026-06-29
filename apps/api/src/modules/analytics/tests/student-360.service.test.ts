import { describe, it, expect, vi, beforeEach } from 'vitest';
import { student360Service } from '../student-360.service';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    student: {
      findUniqueOrThrow: vi.fn(),
    },
    grade: {
      findMany: vi.fn(),
    },
    tahfidzRecord: {
      findMany: vi.fn(),
    },
    attendance: {
      findMany: vi.fn(),
    },
    counselingSession: {
      findMany: vi.fn(),
    },
    medicalRecord: {
      findMany: vi.fn(),
    },
    growthRecord: {
      findMany: vi.fn(),
    },
    invoice: {
      findMany: vi.fn(),
    },
  },
}));

describe('Student360Service', () => {
  const mockStudentId = 'student-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should aggregate student data correctly', async () => {
    const mockStudent = {
      id: mockStudentId,
      nis: '2024001',
      user: { name: 'John Doe', email: 'john@example.com' },
      unit: { name: 'SMA Al-Quran' },
      enrollments: [{ class: { name: '10A' } }],
    };

    (prisma.student.findUniqueOrThrow as any).mockResolvedValue(mockStudent);
    (prisma.grade.findMany as any).mockResolvedValue([{ score: 80 }, { score: 90 }]);
    (prisma.tahfidzRecord.findMany as any).mockResolvedValue([{ juz: 1 }, { juz: 2 }]);
    (prisma.attendance.findMany as any).mockResolvedValue([{ status: 'PRESENT' }]);
    (prisma.counselingSession.findMany as any).mockResolvedValue([]);
    (prisma.medicalRecord.findMany as any).mockResolvedValue([]);
    (prisma.growthRecord.findMany as any).mockResolvedValue([]);
    (prisma.invoice.findMany as any).mockResolvedValue([]);

    const result = await student360Service.getStudent360(mockStudentId);

    expect(result.profile.name).toBe('John Doe');
    expect(result.academic.averageScore).toBe(85);
    expect(result.tahfidz.totalJuz).toBe(2);
    expect(result.attendance.summary.present).toBe(1);
    expect(prisma.student.findUniqueOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: mockStudentId } })
    );
  });
});
