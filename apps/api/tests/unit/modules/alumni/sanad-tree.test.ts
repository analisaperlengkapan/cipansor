import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../../../src/lib/prisma';
import { getSanadTree } from '../../../../src/modules/alumni/service';

vi.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    sanadRecord: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Alumni Service - getSanadTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null if no teacher/root found', async () => {
    vi.mocked(prisma.sanadRecord.findFirst).mockResolvedValue(null);
    const result = await getSanadTree();
    expect(result).toBeNull();
  });

  it('should return recursive tree for a teacher', async () => {
    // Root teacher
    const rootId = 'teacher-1';
    vi.mocked(prisma.user.findUnique).mockImplementation((params: any) => {
      if (params.where.id === 'teacher-1') {
        return Promise.resolve({
          id: 'teacher-1',
          name: 'Root Teacher',
          teacher: { specialization: 'Tajwid', joinDate: new Date('2010-01-01') },
          student: null,
        } as any);
      }
      if (params.where.id === 'student-1') {
        return Promise.resolve({
          id: 'student-1',
          name: 'Student Alumnus',
          teacher: null,
          student: {
            graduateYear: 2020,
            unit: { name: 'Unit SMA' },
            takhosusEnrollment: { completedJuz: 30 },
          },
        } as any);
      }
      return Promise.resolve(null);
    });

    vi.mocked(prisma.sanadRecord.findMany).mockImplementation((params: any) => {
      if (params.where.teacherId === 'teacher-1') {
        return Promise.resolve([
          {
            enrollment: {
              student: { userId: 'student-1' }
            }
          }
        ] as any);
      }
      return Promise.resolve([]);
    });

    const result = await getSanadTree(rootId);

    expect(result).not.toBeNull();
    expect(result.name).toBe('Root Teacher');
    expect(result.children).toHaveLength(1);
    expect(result.children[0].name).toBe('Student Alumnus');
    expect(result.children[0].specialty).toBe('30 Juz');
  });
});
