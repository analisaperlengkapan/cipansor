import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as service from './service';
import { MedicalRecordType } from '@cipansor/shared';

// Mock prisma
vi.mock('../../lib/prisma', () => ({
  prisma: {
    medicalRecord: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    immunizationRecord: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    classEnrollment: {
      findFirst: vi.fn(),
    },
    studentParent: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb({
        medicationUsageLog: { create: vi.fn() },
        medication: { update: vi.fn() },
    })),
  },
}));

// Mock event bus
vi.mock('../../lib/event-bus', () => ({
  eventBus: { emit: vi.fn() },
}));

// Mock attendance service
vi.mock('../attendance/attendance.service', () => ({
  attendanceService: { create: vi.fn() },
}));

describe('Health Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createMedicalRecord', () => {
    it('should create a medical record', async () => {
      const mockData = {
        studentId: 'student-123',
        type: MedicalRecordType.ILLNESS,
        visitDate: new Date(),
        complaint: 'Fever',
        status: 'SICK',
      };

      const dbResult = {
        id: 'record-1',
        ...mockData,
        student: { id: 'student-123', nis: 'NIS001', user: { name: 'Student' } }
      };

      (prisma.medicalRecord.create as any).mockResolvedValue(dbResult);

      const result = await service.createMedicalRecord(mockData as any, 'user-123');

      expect(prisma.medicalRecord.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          studentId: 'student-123',
          complaint: 'Fever',
        }),
      }));

      // Expected result after transformation in service
      expect(result).toEqual({
        ...dbResult,
        student: {
          id: 'student-123',
          nis: 'NIS001',
          name: 'Student',
          user: { name: 'Student' }
        }
      });
    });
  });

  describe('createImmunizationRecord', () => {
    it('should create an immunization record', async () => {
      const mockData = {
        studentId: 'student-123',
        unitId: 'unit-123',
        vaccineName: 'COVID-19',
        doseNumber: 1,
      };
      const mockResult = { id: 'imm-1', ...mockData };

      (prisma.immunizationRecord.create as any).mockResolvedValue(mockResult);

      const result = await service.createImmunizationRecord(mockData as any, 'user-123');

      expect(prisma.immunizationRecord.create).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });
});
