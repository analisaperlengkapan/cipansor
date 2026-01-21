import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MedicalRecordType } from '@cipansor/shared';

// Create mock functions and hoist them
const { mockMedicalRecord, mockMedication, mockMedicationUsageLog } = vi.hoisted(() => {
  return {
    mockMedicalRecord: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      groupBy: vi.fn(),
    },
    mockMedication: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    mockMedicationUsageLog: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
  };
});

// Mock the Prisma Client constructor
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      medicalRecord = mockMedicalRecord;
      medication = mockMedication;
      medicationUsageLog = mockMedicationUsageLog;
      $transaction = vi.fn((callback) =>
        callback({
          medicalRecord: mockMedicalRecord,
          medication: mockMedication,
          medicationUsageLog: mockMedicationUsageLog,
        })
      );
    },
    Prisma: {},
  };
});

// Mock the prisma singleton to use our mocks
vi.mock('../../../../../src/lib/prisma', () => {
  return {
    prisma: {
      medicalRecord: mockMedicalRecord,
      medication: mockMedication,
      medicationUsageLog: mockMedicationUsageLog,
      $transaction: vi.fn((callback) =>
        callback({
          medicalRecord: mockMedicalRecord,
          medication: mockMedication,
          medicationUsageLog: mockMedicationUsageLog,
        })
      ),
    },
  };
});

// Import service after mocking
import * as service from '../../../../../src/modules/health/service';

describe('Health Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMedicalRecords', () => {
    it('should return paginated medical records with vitals from DB columns', async () => {
      const mockData = [
        {
          id: '1',
          studentId: 'student-1',
          type: 'CHECKUP',
          notes: 'Regular checkup',
          temperature: 37.5,
          status: 'HEALTHY',
          student: {
            id: 'student-1',
            nis: '123',
            user: { id: 'user-1', name: 'John Doe' },
            unit: { id: 'unit-1', name: 'Unit 1' },
          },
          recordedBy: { id: 'staff-1', name: 'Dr. Smith' },
        },
      ];

      mockMedicalRecord.findMany.mockResolvedValue(mockData);
      mockMedicalRecord.count.mockResolvedValue(1);

      const result = await service.getMedicalRecords({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      const record = result.data[0];
      expect(record.id).toBe('1');
      expect(record.temperature).toBe(37.5); // Check value from DB
      expect(record.status).toBe('HEALTHY'); // Check value from DB
      expect(record.notes).toBe('Regular checkup');

      expect(mockMedicalRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        })
      );
    });
  });

  describe('createMedicalRecord', () => {
    it('should create a medical record with vitals in columns', async () => {
      const input = {
        studentId: 'student-1',
        type: MedicalRecordType.CHECKUP,
        visitDate: new Date(),
        complaint: 'Fever',
        temperature: 38.5,
        status: 'SICK',
        notes: 'Patient looks pale',
      };

      const mockCreated = {
        id: '1',
        studentId: input.studentId,
        type: input.type,
        visitDate: input.visitDate,
        complaint: input.complaint,
        notes: 'Patient looks pale',
        temperature: 38.5,
        status: 'SICK',
        recordedById: 'staff-1',
        student: {
          id: 'student-1',
          nis: '123',
          user: { id: 'user-1', name: 'John Doe' },
        },
        recordedBy: { id: 'staff-1', name: 'Dr. Smith' },
      };

      mockMedicalRecord.create.mockResolvedValue(mockCreated);

      const result = await service.createMedicalRecord(input as any, 'staff-1');

      expect(result.id).toBe('1');
      expect(result.temperature).toBe(38.5);

      // Verify create arguments use proper columns
      expect(mockMedicalRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            studentId: 'student-1',
            complaint: 'Fever',
            temperature: 38.5,
            status: 'SICK',
            notes: 'Patient looks pale',
          }),
        })
      );
    });
  });

  describe('updateMedicalRecord', () => {
    it('should update medical record vitals in columns', async () => {
      const updateInput = {
        temperature: 37.0,
        notes: 'New notes',
      };

      const mockUpdated = {
        id: '1',
        notes: 'New notes',
        temperature: 37.0,
        student: { id: 's1', user: { name: 'John' } },
      };

      mockMedicalRecord.update.mockResolvedValue(mockUpdated);

      const result = await service.updateMedicalRecord('1', updateInput);

      expect(mockMedicalRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          data: expect.objectContaining({
            notes: 'New notes',
            temperature: 37.0,
          }),
        })
      );

      expect(result.temperature).toBe(37.0);
    });
  });
});
