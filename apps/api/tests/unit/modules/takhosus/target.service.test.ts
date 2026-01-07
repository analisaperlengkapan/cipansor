import { describe, it, expect, vi, beforeEach } from 'vitest';
import { targetService } from '../../../../src/modules/takhosus/target.service';
import { prisma } from '../../../../src/lib/prisma';

// Mock dependencies
vi.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    tahfidzTarget: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    academicYear: {
      findFirst: vi.fn(),
    },
    tahfidzRecord: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

describe('TargetService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createOrUpdate', () => {
    const input = {
      studentId: 'student-1',
      academicYearId: 'year-1',
      targetJuz: 30,
      targetAyah: 10,
      notes: 'Test notes',
    };

    it('should create new target if not exists', async () => {
      vi.mocked(prisma.tahfidzTarget.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.tahfidzTarget.create).mockResolvedValue({ id: 'new-target', ...input } as any);

      const result = await targetService.createOrUpdate(input);

      expect(prisma.tahfidzTarget.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'new-target');
    });

    it('should update target if exists', async () => {
      vi.mocked(prisma.tahfidzTarget.findUnique).mockResolvedValue({ id: 'existing-target' } as any);
      vi.mocked(prisma.tahfidzTarget.update).mockResolvedValue({ id: 'existing-target', ...input } as any);

      const result = await targetService.createOrUpdate(input);

      expect(prisma.tahfidzTarget.update).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'existing-target');
    });
  });

  describe('getProgress', () => {
    it('should return null if no active academic year', async () => {
      vi.mocked(prisma.academicYear.findFirst).mockResolvedValue(null);
      const result = await targetService.getProgress('student-1');
      expect(result).toBeNull();
    });

    it('should calculate progress correctly', async () => {
      vi.mocked(prisma.academicYear.findFirst).mockResolvedValue({ id: 'year-1' } as any);
      vi.mocked(prisma.tahfidzTarget.findUnique).mockResolvedValue({ targetJuz: 30 } as any);

      // Mock completed juz count (3 juz completed)
      vi.mocked(prisma.tahfidzRecord.findMany).mockResolvedValue([
          { juz: 1 }, { juz: 2 }, { juz: 30 }
      ] as any);

      // Mock total ayah
      vi.mocked(prisma.tahfidzRecord.aggregate).mockResolvedValue({
          _sum: { totalAyah: 500 }
      } as any);

      const result = await targetService.getProgress('student-1');

      expect(result).toEqual({
        targetJuz: 30,
        completedJuz: 3,
        totalAyahMemorized: 500,
        percentage: 10, // 3/30 * 100
        isOnTrack: false,
      });
    });
  });
});
