import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extracurricularService } from '../../../../src/modules/extracurricular/extracurricular.service';
import { prisma } from '../../../../src/lib/prisma';

// Mock UserRole
const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  UNIT_ADMIN: 'UNIT_ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
  PARENT: 'PARENT',
};

// Mock Prisma
vi.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    extracurricular: {
      findUnique: vi.fn(),
    },
    extracurricularEnrollment: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    extracurricularAttendance: {
      upsert: vi.fn(),
      deleteMany: vi.fn(), // For benchmark script cleanup if it was running, but here irrelevant
    },
  },
}));

describe('ExtracurricularService Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should demonstrate N+1 issue in recordAttendance', async () => {
    const studentCount = 100;
    const extracurricularId = 'ex-1';
    const attendances = Array.from({ length: studentCount }, (_, i) => ({
      studentId: `student-${i}`,
      status: 'PRESENT',
      notes: 'test',
    }));

    // Mock findById for extracurricular
    (prisma.extracurricular.findUnique as any).mockResolvedValue({
      id: extracurricularId,
      unitId: 'unit-1',
    });

    // Mock findUnique for enrollment (always active)
    (prisma.extracurricularEnrollment.findUnique as any).mockResolvedValue({
      id: 'enrollment-id',
      status: 'ACTIVE',
    });

    // Mock findMany for optimized version
    const mockEnrollments = attendances.map((a) => ({ studentId: a.studentId }));
    (prisma.extracurricularEnrollment.findMany as any).mockResolvedValue(mockEnrollments);

    // Mock upsert
    (prisma.extracurricularAttendance.upsert as any).mockResolvedValue({
      id: 'att-id',
    });

    const currentUser = { sub: 'user-1', role: UserRole.SUPER_ADMIN, unitId: null };

    await extracurricularService.recordAttendance(
      {
        extracurricularId,
        date: new Date(),
        attendances: attendances as any,
      },
      currentUser
    );

    // Verify Optimization: findMany should be called once, and findUnique 0 times
    expect(prisma.extracurricularEnrollment.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.extracurricularEnrollment.findUnique).toHaveBeenCalledTimes(0);
  });
});
