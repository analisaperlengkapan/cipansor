import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdmissionStatus, Gender } from '@prisma/client';

// Define the mock factory
const mockPrisma = vi.hoisted(() => ({
  registrant: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  class: {
    findUnique: vi.fn(),
  },
  room: {
    findUnique: vi.fn(),
  },
  halaqoh: {
    findUnique: vi.fn(),
  },
  user: {
    create: vi.fn(),
  },
  student: {
    create: vi.fn(),
  },
  classEnrollment: {
    create: vi.fn(),
  },
  roomAssignment: {
    create: vi.fn(),
  },
  takhosusEnrollment: {
    create: vi.fn(),
  },
  // $transaction implementation that executes the callback
  $transaction: vi.fn(async (callback) => {
    // Pass a fake tx object that mimics the prisma client for the mocked methods used inside transaction
    return callback(mockPrisma);
  }),
}));

// Mock using the alias
vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

import * as service from '../../../../src/modules/psb/service';

describe('PSB Service - enrollRegistrant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validRegistrantId = 'reg-123';
  const validRegistrant = {
    id: validRegistrantId,
    name: 'Test Student',
    email: 'test@student.com',
    gender: Gender.MALE,
    birthPlace: 'City',
    birthDate: new Date(),
    address: 'Address',
    parentName: 'Parent',
    parentPhone: '08123456789',
    parentEmail: 'parent@test.com',
    status: AdmissionStatus.ACCEPTED,
    admissionPeriod: {
      unitId: 'unit-123',
      unit: { id: 'unit-123', name: 'Test Unit' }
    }
  };

  const enrollInput = {
    nis: '123456',
    nisn: '000123456',
    classId: 'class-1',
    roomId: 'room-1',
    halaqohId: 'halaqoh-1',
  };

  it('should successfully enroll a registrant with all optional enrollments', async () => {
    // Setup mocks
    mockPrisma.registrant.findUnique.mockResolvedValue(validRegistrant);
    mockPrisma.class.findUnique.mockResolvedValue({ id: 'class-1' });
    mockPrisma.room.findUnique.mockResolvedValue({ id: 'room-1' });
    mockPrisma.halaqoh.findUnique.mockResolvedValue({ id: 'halaqoh-1' });

    mockPrisma.user.create.mockResolvedValue({ id: 'user-1' });
    mockPrisma.student.create.mockResolvedValue({ id: 'student-1' });

    // Execute
    await service.enrollRegistrant(validRegistrantId, enrollInput);

    // Assertions
    expect(mockPrisma.registrant.findUnique).toHaveBeenCalledWith({
      where: { id: validRegistrantId },
      include: { admissionPeriod: { include: { unit: true } } },
    });

    // Verify entity checks
    expect(mockPrisma.class.findUnique).toHaveBeenCalledWith({ where: { id: 'class-1' } });
    expect(mockPrisma.room.findUnique).toHaveBeenCalledWith({ where: { id: 'room-1' } });
    expect(mockPrisma.halaqoh.findUnique).toHaveBeenCalledWith({ where: { id: 'halaqoh-1' } });

    // Verify Transaction Calls
    expect(mockPrisma.user.create).toHaveBeenCalled();
    expect(mockPrisma.student.create).toHaveBeenCalled();

    // Check specific enrollments
    expect(mockPrisma.classEnrollment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        studentId: 'student-1',
        classId: 'class-1',
        status: 'active',
      })
    });

    expect(mockPrisma.roomAssignment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        studentId: 'student-1',
        roomId: 'room-1',
        isActive: true,
      })
    });

    expect(mockPrisma.takhosusEnrollment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        studentId: 'student-1',
        halaqohId: 'halaqoh-1',
        status: 'active',
      })
    });

    expect(mockPrisma.registrant.update).toHaveBeenCalledWith({
      where: { id: validRegistrantId },
      data: expect.objectContaining({
        status: AdmissionStatus.ENROLLED,
        studentId: 'student-1',
      })
    });
  });

  it('should throw error if registrant is not found', async () => {
    mockPrisma.registrant.findUnique.mockResolvedValue(null);
    await expect(service.enrollRegistrant('invalid-id', enrollInput))
      .rejects.toThrow('Registrant not found');
  });

  it('should throw error if registrant is not ACCEPTED', async () => {
    mockPrisma.registrant.findUnique.mockResolvedValue({
      ...validRegistrant,
      status: AdmissionStatus.SUBMITTED
    });
    await expect(service.enrollRegistrant(validRegistrantId, enrollInput))
      .rejects.toThrow('Registrant must be accepted before enrollment');
  });

  it('should throw error if halaqoh is not found', async () => {
    mockPrisma.registrant.findUnique.mockResolvedValue(validRegistrant);
    mockPrisma.class.findUnique.mockResolvedValue({ id: 'class-1' });
    mockPrisma.room.findUnique.mockResolvedValue({ id: 'room-1' });
    mockPrisma.halaqoh.findUnique.mockResolvedValue(null); // Halaqoh Missing

    await expect(service.enrollRegistrant(validRegistrantId, enrollInput))
      .rejects.toThrow('Halaqoh not found');
  });
});
