import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PsychologyService } from './psychology.service';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    psychologyTest: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    studentPsychologyRecord: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    student: {
      findUnique: vi.fn(),
    }
  },
}));

describe('PsychologyService', () => {
  let service: PsychologyService;

  beforeEach(() => {
    service = new PsychologyService();
    vi.clearAllMocks();
  });

  const mockUser = {
    sub: 'user-1',
    role: UserRole.SUPER_ADMIN,
    unitId: null,
  };

  describe('getTests', () => {
    it('should return tests', async () => {
      const mockTests = [{ id: '1', name: 'IQ Test' }];
      (prisma.psychologyTest.findMany as any).mockResolvedValue(mockTests);

      const result = await service.getTests(null, mockUser);
      expect(result).toEqual(mockTests);
      expect(prisma.psychologyTest.findMany).toHaveBeenCalled();
    });
  });

  describe('createTest', () => {
    it('should create a test', async () => {
      const input = { name: 'New Test', type: 'IQ' };
      const mockTest = { id: '1', ...input };
      (prisma.psychologyTest.create as any).mockResolvedValue(mockTest);

      const result = await service.createTest(input, mockUser);
      expect(result).toEqual(mockTest);
      expect(prisma.psychologyTest.create).toHaveBeenCalledWith({
        data: {
          unitId: null,
          name: input.name,
          type: input.type,
          description: undefined,
          isActive: true,
        },
      });
    });
  });

  describe('createRecord', () => {
      it('should create a record if student exists', async () => {
          const input = {
              studentId: 'student-1',
              testId: 'test-1',
              testDate: '2024-01-01',
              score: 100
          };

          (prisma.student.findUnique as any).mockResolvedValue({ id: 'student-1', unitId: 'unit-1' });
          (prisma.studentPsychologyRecord.create as any).mockResolvedValue({ id: 'record-1', ...input });

          const result = await service.createRecord(input, mockUser);
          expect(result.id).toBe('record-1');
          expect(prisma.student.findUnique).toHaveBeenCalledWith({ where: { id: input.studentId } });
      });

      it('should throw error if student not found', async () => {
           (prisma.student.findUnique as any).mockResolvedValue(null);
           const input = {
              studentId: 'student-1',
              testId: 'test-1',
              testDate: '2024-01-01',
              score: 100
          };

          await expect(service.createRecord(input, mockUser)).rejects.toThrow('Student not found');
      });
  });
});
