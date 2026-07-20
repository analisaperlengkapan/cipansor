import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../../../src/lib/prisma';
import { batchGraduateStudents } from '../../../../src/modules/alumni/alumni.service';

vi.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    student: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    alumni: {
      count: vi.fn(),
      create: vi.fn(),
    },
    classEnrollment: {
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}));

describe('Alumni Service - batchGraduateStudents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockStudent = {
    id: 'student-1',
    unitId: 'unit-id',
    gender: 'MALE',
    user: { name: 'Student 1', email: 's1@example.com' },
    birthPlace: 'City',
    birthDate: new Date(),
    parentPhone: '08123',
    address: 'Address',
    enrollments: [{ class: { name: 'Class 6' } }],
  };

  it('should batch graduate students', async () => {
    vi.mocked(prisma.student.findUnique).mockResolvedValue(mockStudent as any);
    vi.mocked(prisma.alumni.count).mockResolvedValue(0);
    vi.mocked(prisma.alumni.create).mockResolvedValue({ id: 'alm-1' } as any);

    const input = {
      studentIds: ['student-1'],
      graduationDate: new Date().toISOString(),
      graduationYear: 2024,
      notes: 'Good job',
    };

    await batchGraduateStudents(input);

    expect(prisma.alumni.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          studentId: 'student-1',
          registrationNo: 'ALM-2024-0001',
          graduationYear: 2024,
        }),
      })
    );

    expect(prisma.student.update).toHaveBeenCalledWith({
      where: { id: 'student-1' },
      data: { status: 'alumni', graduateYear: 2024 },
    });

    expect(prisma.classEnrollment.updateMany).toHaveBeenCalledWith({
      where: { studentId: 'student-1', status: 'active' },
      data: { status: 'completed' },
    });
  });
});
