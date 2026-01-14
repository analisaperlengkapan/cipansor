import { describe, it, expect, vi, beforeEach } from 'vitest';

const prismaMock = {
  student: {
    findMany: vi.fn(),
    update: vi.fn(),
  },
  alumni: {
    count: vi.fn(),
    create: vi.fn(),
  },
  classEnrollment: {
    updateMany: vi.fn(),
  },
  $transaction: vi.fn(),
};

vi.mock('../../../../src/lib/prisma', () => ({
  prisma: prismaMock,
}));

vi.mock('@prisma/client', () => ({
  Gender: { MALE: 'MALE', FEMALE: 'FEMALE' },
  PrismaClient: class {
    constructor() {
      return prismaMock;
    }
  },
}));

import { batchGraduateStudents } from '../../../../src/modules/alumni/service';
import { prisma } from '../../../../src/lib/prisma';
import { Gender } from '@prisma/client';

describe('Alumni Service - batchGraduateStudents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.$transaction as any).mockImplementation(async (callback: any) => {
      return callback(prisma);
    });
  });

  const mockStudents = [
    {
      id: 'student-1',
      unitId: 'unit-id',
      gender: Gender.MALE,
      user: { name: 'Student 1', email: 's1@example.com' },
      birthPlace: 'City',
      birthDate: new Date(),
      parentPhone: '08123',
      address: 'Address',
      enrollments: [{ class: { name: 'Class 6' } }],
    },
  ];

  it('should batch graduate students', async () => {
    (prisma.student.findMany as any).mockResolvedValue(mockStudents);
    (prisma.alumni.count as any).mockResolvedValue(0);

    const input = {
      studentIds: ['student-1'],
      graduationDate: new Date().toISOString(),
      graduationYear: 2024,
      notes: 'Good job',
    };

    await batchGraduateStudents(input);

    // Should create alumni record
    expect(prisma.alumni.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        studentId: 'student-1',
        registrationNo: 'ALM-2024-0001',
        graduationYear: 2024,
      })
    }));

    // Should update student status
    expect(prisma.student.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'student-1' },
      data: expect.objectContaining({
        status: 'alumni',
        graduateYear: 2024,
      }),
    }));

    // Should close enrollments
    expect(prisma.classEnrollment.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { studentId: 'student-1', status: 'active' },
      data: { status: 'completed' },
    }));
  });
});
