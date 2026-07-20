import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. Define hoisted mocks first
const prismaMock = vi.hoisted(() => {
  const sharedMocks = {
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    updateMany: vi.fn(),
    createMany: vi.fn(),
  };

  return {
    permit: sharedMocks,
    classEnrollment: sharedMocks,
    attendance: sharedMocks,
    $transaction: vi.fn((callback) =>
      callback({
        permit: sharedMocks,
        classEnrollment: sharedMocks,
        attendance: sharedMocks,
      })
    ),
  };
});

// 2. Mock prisma using the hoisted object
vi.mock('../../../../src/lib/prisma', () => ({
  prisma: prismaMock,
}));

// 3. Mock notifications service
vi.mock('../../../../src/modules/notifications/notifications.service', () => ({
  createNotification: vi.fn(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50)); // 50ms delay
  }),
}));

// 4. Mock Prisma Client Enums
vi.mock('@prisma/client', () => ({
  PermitType: {
    SAKIT: 'SAKIT',
    IZIN: 'IZIN',
  },
  PermitStatus: {
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    PENDING: 'PENDING',
  },
  NotificationType: {
    INFO: 'INFO',
  },
  AttendanceStatus: {
    SICK: 'SICK',
    EXCUSED: 'EXCUSED',
  },
  UserRole: {
    STUDENT: 'STUDENT',
  },
}));

import { updatePermitStatus } from '../../../../src/modules/permits/permits.service';
import { PermitStatus, PermitType } from '@prisma/client';
import { createNotification } from '../../../../src/modules/notifications/notifications.service';

describe('Permit Service Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPermitId = 'permit-perf-123';
  const mockStudentId = 'student-perf-123';

  // Create 5 parents
  const mockParents = Array.from({ length: 5 }, (_, i) => ({
    parentId: `parent-${i}`,
    parent: { id: `parent-${i}` },
  }));

  const mockPermit = {
    id: mockPermitId,
    code: 'PMT-PERF',
    type: PermitType.SAKIT,
    status: PermitStatus.APPROVED,
    startDate: new Date(),
    endDate: new Date(),
    studentId: mockStudentId,
    student: {
      user: { name: 'Perf Student' },
      parents: mockParents,
    },
  };

  it('updatePermitStatus performance benchmark', async () => {
    // Setup
    prismaMock.permit.update.mockResolvedValue(mockPermit as any);
    // Mock class enrollment to null to skip attendance logic for simplicity
    prismaMock.classEnrollment.findFirst.mockResolvedValue(null);

    const start = Date.now();

    await updatePermitStatus(mockPermitId, { status: PermitStatus.APPROVED }, 'approver-1');

    const duration = Date.now() - start;

    console.log(`[BENCHMARK] Duration with 5 parents: ${duration}ms`);

    // We expect the notifications to be called 5 times
    expect(createNotification).toHaveBeenCalledTimes(5);
  });
});
