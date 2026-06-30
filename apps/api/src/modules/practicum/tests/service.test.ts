import { describe, it, expect, vi, beforeEach } from 'vitest';
import { practicumService } from '../service';
import { prisma } from '../../../lib/prisma';

vi.mock('../../../lib/prisma', () => ({
  prisma: {
    practicumLessonPlan: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
    practicumSchedule: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    practicumEvaluation: {
      create: vi.fn(),
    },
  },
}));

describe('PracticumService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createLessonPlan', () => {
    it('should create a lesson plan with DRAFT status', async () => {
      const mockData = { subject: 'Arabic', topic: 'Nahwu', method: 'Direct', materials: 'Book', objectives: 'Understand', steps: {} };
      const mockResult = { id: 'lp1', ...mockData, studentId: 's1', status: 'DRAFT' };
      (prisma.practicumLessonPlan.create as any).mockResolvedValue(mockResult);

      const result = await practicumService.createLessonPlan('s1', mockData);

      expect(prisma.practicumLessonPlan.create).toHaveBeenCalledWith({
        data: { ...mockData, studentId: 's1', status: 'DRAFT' },
      });
      expect(result).toEqual(mockResult);
    });
  });
});
