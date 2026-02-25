import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as healthService from './service';

// Mock external dependencies
vi.mock('../../lib/prisma', () => ({
  prisma: {
    immunizationRecord: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    // Keep other mocks minimal if not used
    medicalRecord: {
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    medication: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('../../lib/event-bus', () => ({
  eventBus: {
    emit: vi.fn(),
  },
}));
vi.mock('../../lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Health Service - Immunization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createImmunizationRecord', () => {
    it('should create an immunization record', async () => {
      const dto = {
        studentId: 'std-1',
        unitId: 'unit-1',
        vaccineName: 'Hepatitis B',
        doseNumber: 1,
        scheduledDate: new Date('2024-01-01'),
      };

      const mockRecord = {
        id: 'imm-1',
        ...dto,
        status: 'PENDING',
      };

      vi.mocked(prisma.immunizationRecord.create).mockResolvedValue(mockRecord as any);

      const result = await healthService.createImmunizationRecord(dto, 'user-1');

      expect(prisma.immunizationRecord.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          recordedById: 'user-1',
        },
        include: expect.any(Object),
      });
      expect(result).toHaveProperty('id', 'imm-1');
    });
  });

  describe('getImmunizationRecords', () => {
    it('should list immunization records with pagination', async () => {
      const query = {
        studentId: 'std-1',
        page: 1,
        limit: 10,
      };

      const mockData = [{ id: 'imm-1', vaccineName: 'Polio' }];
      vi.mocked(prisma.immunizationRecord.findMany).mockResolvedValue(mockData as any);
      vi.mocked(prisma.immunizationRecord.count).mockResolvedValue(1);

      const result = await healthService.getImmunizationRecords(query);

      expect(prisma.immunizationRecord.findMany).toHaveBeenCalledWith({
        where: { studentId: 'std-1' },
        skip: 0,
        take: 10,
        include: expect.any(Object),
        orderBy: { scheduledDate: 'asc' },
      });
      expect(result.data).toHaveLength(1);
      expect(result.meta.pagination.total).toBe(1);
    });
  });

  describe('updateImmunizationRecord', () => {
    it('should update an immunization record', async () => {
      const updateDto = {
        status: 'COMPLETED',
        administeredDate: new Date(),
      };

      vi.mocked(prisma.immunizationRecord.update).mockResolvedValue({ id: 'imm-1', ...updateDto } as any);

      await healthService.updateImmunizationRecord('imm-1', updateDto as any);

      expect(prisma.immunizationRecord.update).toHaveBeenCalledWith({
        where: { id: 'imm-1' },
        data: updateDto,
        include: expect.any(Object),
      });
    });
  });

  describe('deleteImmunizationRecord', () => {
    it('should delete an immunization record', async () => {
      vi.mocked(prisma.immunizationRecord.delete).mockResolvedValue({ id: 'imm-1' } as any);

      await healthService.deleteImmunizationRecord('imm-1');

      expect(prisma.immunizationRecord.delete).toHaveBeenCalledWith({
        where: { id: 'imm-1' },
      });
    });
  });
});
