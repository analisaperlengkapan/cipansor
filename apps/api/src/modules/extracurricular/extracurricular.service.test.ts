import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExtracurricularService } from './extracurricular.service';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    extracurricular: {
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    student: {
      findUnique: vi.fn(),
    },
    extracurricularEnrollment: {
      findUnique: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('ExtracurricularService', () => {
  let service: ExtracurricularService;

  beforeEach(() => {
    service = new ExtracurricularService();
    vi.clearAllMocks();
  });

  describe('enrollStudent', () => {
    it('should enroll a student successfully', async () => {
      const mockExtracurricular = { id: 'ex-1', unitId: 'unit-1', maxParticipants: 20 };
      const mockStudent = { id: 'st-1', unitId: 'unit-1' };
      const mockEnrollment = { id: 'en-1', status: 'ACTIVE' };

      vi.mocked(prisma.extracurricular.findUnique).mockResolvedValue(mockExtracurricular as any);
      vi.mocked(prisma.student.findUnique).mockResolvedValue(mockStudent as any);
      vi.mocked(prisma.extracurricularEnrollment.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.extracurricularEnrollment.count).mockResolvedValue(10);
      vi.mocked(prisma.extracurricularEnrollment.create).mockResolvedValue(mockEnrollment as any);

      const result = await service.enrollStudent(
        { extracurricularId: 'ex-1', studentId: 'st-1' },
        { role: UserRole.TEACHER, unitId: 'unit-1', sub: 'user-1' } as any
      );

      expect(prisma.extracurricularEnrollment.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          extracurricularId: 'ex-1',
          studentId: 'st-1',
          status: 'ACTIVE',
        })
      }));
      expect(result).toEqual(mockEnrollment);
    });

    it('should throw error if student is from different unit', async () => {
      const mockExtracurricular = { id: 'ex-1', unitId: 'unit-1' };
      const mockStudent = { id: 'st-1', unitId: 'unit-2' };

      vi.mocked(prisma.extracurricular.findUnique).mockResolvedValue(mockExtracurricular as any);
      vi.mocked(prisma.student.findUnique).mockResolvedValue(mockStudent as any);

      await expect(service.enrollStudent(
        { extracurricularId: 'ex-1', studentId: 'st-1' },
        { role: UserRole.TEACHER, unitId: 'unit-1', sub: 'user-1' } as any
      )).rejects.toThrow('Student is not from the same unit');
    });
  });
});
