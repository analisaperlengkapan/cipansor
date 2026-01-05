import { describe, it, expect, vi, beforeEach } from 'vitest';
import { classService } from '../../../../src/modules/classes/class.service';
import { prisma } from '../../../../src/lib/prisma';
import { Gender } from '@prisma/client';

// Mock Prisma
vi.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    classEnrollment: {
      findMany: vi.fn(),
    },
  },
}));

describe('Class Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEnrollments', () => {
    it('should return enrollments with student details', async () => {
      const classId = 'class-id';
      const mockEnrollments = [
        {
          id: 'enrollment-id',
          studentId: 'student-id',
          classId: 'class-id',
          status: 'active',
          student: {
            id: 'student-id',
            nis: '12345',
            gender: Gender.MALE,
            user: {
              id: 'user-id',
              name: 'Student Name',
              email: 'student@example.com',
            },
          },
          enrolledAt: new Date(),
        },
      ];

      (prisma.classEnrollment.findMany as any).mockResolvedValue(mockEnrollments);

      const result = await classService.getEnrollments(classId);

      expect(prisma.classEnrollment.findMany).toHaveBeenCalledWith({
        where: {
          classId,
          status: 'active',
          student: { deletedAt: null },
        },
        include: {
          student: {
            select: {
              id: true,
              nis: true,
              gender: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
            student: {
              user: {
                name: 'asc',
              },
            },
          },
      });

      expect(result).toEqual(mockEnrollments);
    });
  });
});
