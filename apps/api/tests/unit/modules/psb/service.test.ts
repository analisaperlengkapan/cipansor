import { describe, it, expect, vi, beforeEach } from 'vitest';

// Define mocks first using vi.hoisted to ensure they are available before imports
const { prismaMock } = vi.hoisted(() => {
  return {
    prismaMock: {
      registrant: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      student: {
        create: vi.fn(),
        update: vi.fn(),
      },
      classEnrollment: {
        create: vi.fn(),
        updateMany: vi.fn(),
      },
      roomAssignment: {
        create: vi.fn(),
        updateMany: vi.fn(),
      },
      $transaction: vi.fn(),
    }
  };
});

vi.mock('../../../../src/lib/prisma', () => ({
  prisma: prismaMock,
}));

vi.mock('@prisma/client', () => ({
  AdmissionStatus: {
    ACCEPTED: 'ACCEPTED',
    ENROLLED: 'ENROLLED',
  },
  Gender: {
    MALE: 'MALE',
    FEMALE: 'FEMALE',
  },
  Prisma: {
    Decimal: class { constructor(val: any) { return val; } }
  },
  PrismaClient: class {
    constructor() {
      return prismaMock;
    }
  },
}));

import * as psbService from '../../../../src/modules/psb/service';
import { prisma } from '../../../../src/lib/prisma';
import { AdmissionStatus, Gender } from '@prisma/client';

describe('PSB Service - enrollRegistrant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.$transaction as any).mockImplementation(async (callback: any) => {
      return callback(prisma);
    });
  });

  const mockRegistrant = {
    id: 'reg-id',
    name: 'New Student',
    email: 'newstudent@example.com',
    status: AdmissionStatus.ACCEPTED,
    gender: Gender.MALE,
    birthPlace: 'City',
    birthDate: new Date(),
    address: 'Address',
    parentName: 'Parent',
    parentPhone: '08123456789',
    admissionPeriod: {
      unit: { id: 'unit-id' },
      unitId: 'unit-id',
    },
  };

  const studentData = {
    nis: '123456',
    classId: 'class-id',
  };

  it('should enroll new student successfully', async () => {
    (prisma.registrant.findUnique as any).mockResolvedValue(mockRegistrant);
    (prisma.user.findUnique as any).mockResolvedValue(null); // No existing user
    (prisma.user.create as any).mockResolvedValue({ id: 'new-user-id', name: mockRegistrant.name });
    (prisma.student.create as any).mockResolvedValue({ id: 'new-student-id' });

    await psbService.enrollRegistrant('reg-id', studentData);

    expect(prisma.user.create).toHaveBeenCalled();
    expect(prisma.student.create).toHaveBeenCalled();
    expect(prisma.classEnrollment.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: 'active',
      })
    }));
    expect(prisma.registrant.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'reg-id' },
      data: expect.objectContaining({ status: AdmissionStatus.ENROLLED }),
    }));
  });

  it('should handle internal track (existing user) correctly', async () => {
    (prisma.registrant.findUnique as any).mockResolvedValue(mockRegistrant);

    // Existing user with student profile (Alumni scenario)
    const existingUser = {
      id: 'existing-user-id',
      email: mockRegistrant.email,
      student: { id: 'existing-student-id', nisn: '987654321' },
    };
    (prisma.user.findUnique as any).mockResolvedValue(existingUser);
    (prisma.student.update as any).mockResolvedValue({ id: 'existing-student-id' });

    await psbService.enrollRegistrant('reg-id', studentData);

    // Should NOT create new user or student
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.student.create).not.toHaveBeenCalled();

    // Should UPDATE existing student
    expect(prisma.student.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'existing-student-id' },
      data: expect.objectContaining({
        status: 'active',
        unitId: 'unit-id',
        nis: studentData.nis,
        graduateYear: null,
      }),
    }));

    // Should handle class enrollment
    expect(prisma.classEnrollment.updateMany).toHaveBeenCalled(); // Close old
    expect(prisma.classEnrollment.create).toHaveBeenCalled(); // Create new
  });
});
