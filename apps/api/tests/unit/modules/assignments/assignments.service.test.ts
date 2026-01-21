import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assignmentsService } from '@/modules/assignments/assignments.service';
import { prisma } from '@/lib/prisma';
import { AssignmentType } from '@cipansor/shared';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    assignment: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    assignmentSubmission: {
        findMany: vi.fn(),
        upsert: vi.fn(),
        update: vi.fn(),
    },
    classEnrollment: {
        findMany: vi.fn(),
    }
  },
}));

describe('AssignmentsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create an assignment', async () => {
      const input = {
        unitId: 'unit-1',
        academicYearId: 'year-1',
        teacherId: 'teacher-1',
        subjectId: 'subject-1',
        classId: 'class-1',
        title: 'Test Assignment',
        type: AssignmentType.INDIVIDUAL,
        dueDate: new Date(),
      };

      (prisma.assignment.create as any).mockResolvedValue({ id: 'assign-1', ...input });

      const result = await assignmentsService.create(input);

      expect(result.id).toBe('assign-1');
      expect(prisma.assignment.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return assignments', async () => {
      (prisma.assignment.findMany as any).mockResolvedValue([{ id: 'assign-1', title: 'Test' }]);
      (prisma.assignment.count as any).mockResolvedValue(1);

      const result = await assignmentsService.findAll({ unitId: 'unit-1' });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });
});
