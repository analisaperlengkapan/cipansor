import { describe, it, expect, vi, beforeEach } from 'vitest';
import { courseService } from '../../../../src/modules/non-formal/service';
import { prisma } from '../../../../src/lib/prisma';

vi.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    course: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    courseEnrollment: {
      create: vi.fn(),
      update: vi.fn(),
    },
    paymentType: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    invoice: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}));

describe('CourseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should find all published courses', async () => {
    const mockCourses = [{ id: '1', name: 'Course 1', status: 'PUBLISHED' }];
    (prisma.course.findMany as any).mockResolvedValue(mockCourses);

    const result = await courseService.findAll();

    expect(result).toEqual(mockCourses);
    expect(prisma.course.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'PUBLISHED' }
    }));
  });

  it('should create a new course', async () => {
    const courseData = {
      unitId: 'unit-1',
      name: 'New Course',
      code: 'NC01',
      category: 'Tech',
      price: 100000,
    };
    (prisma.course.create as any).mockResolvedValue({ id: 'new-id', ...courseData });

    const result = await courseService.create(courseData as any);

    expect(result.id).toBe('new-id');
    expect(prisma.course.create).toHaveBeenCalled();
  });
});
