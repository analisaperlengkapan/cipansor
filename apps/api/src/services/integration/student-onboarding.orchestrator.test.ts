import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudentOnboardingOrchestrator } from './student-onboarding.orchestrator';
import { prisma } from '../../lib/prisma';
import { eventBus } from '../../lib/event-bus';
import { PaymentStatus } from '@prisma/client';

// Mock dependencies
vi.mock('../../lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

vi.mock('../../lib/event-bus', () => ({
  eventBus: {
    emit: vi.fn(),
  },
}));

describe('StudentOnboardingOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('processEnrollment', () => {
    it('should throw an error if registrant is not found', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const txMock = {
          registrant: { findUnique: vi.fn().mockResolvedValue(null) },
        };
        return callback(txMock as any);
      });

      await expect(
        StudentOnboardingOrchestrator.processEnrollment(
          'non-existent',
          'unit-1',
          'year-1',
          'admin-1'
        )
      ).rejects.toThrow('Registrant not found');
    });

    it('should perform E2E onboarding successfully (Student, Parent, Class, Medical, Invoice)', async () => {
      // Setup detailed mock transaction
      const txMock = {
        registrant: { 
          findUnique: vi.fn().mockResolvedValue({ id: 'reg-1', userId: 'user-stud-1', user: { name: 'Budi Test' } }) 
        },
        student: { 
          create: vi.fn().mockResolvedValue({ id: 'stud-1', nis: 'NIS-2026-100' }) 
        },
        studentParent: { 
          create: vi.fn().mockResolvedValue({ id: 'sp-1' }) 
        },
        classEnrollment: { 
          create: vi.fn().mockResolvedValue({ id: 'ce-1' }) 
        },
        medicalRecord: { 
          create: vi.fn().mockResolvedValue({ id: 'med-1' }) 
        },
        paymentType: { 
          findFirst: vi.fn().mockResolvedValue({ id: 'pt-spp', amount: 500000, code: 'SPP' }) 
        },
        invoice: { 
          create: vi.fn().mockResolvedValue({ id: 'inv-1', status: PaymentStatus.PENDING }) 
        },
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        return callback(txMock as any);
      });

      const result = await StudentOnboardingOrchestrator.processEnrollment(
        'reg-1',
        'unit-1',
        'year-2026',
        'admin-1'
      );

      // Verify the returned structure
      expect(result.success).toBe(true);
      expect(result.studentId).toBe('stud-1');

      // Verify Master Data interactions
      expect(txMock.student.create).toHaveBeenCalled();
      expect(txMock.studentParent.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ studentId: 'stud-1', userId: 'parent-1', relationship: 'FATHER' })
      }));
      expect(txMock.classEnrollment.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ studentId: 'stud-1', classId: 'class-1' })
      }));

      // Verify Multi-Domain interactions
      expect(txMock.medicalRecord.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ studentId: 'stud-1', unitId: 'unit-1' })
      }));
      
      expect(txMock.invoice.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          studentId: 'stud-1',
          paymentTypeId: 'pt-spp',
          amount: 500000,
        })
      }));

      // Event bus execution verification (using process.nextTick simulation)
      await new Promise(process.nextTick); 
      
      expect(eventBus.emit).toHaveBeenCalledWith('student:created', expect.any(Object));
      expect(eventBus.emit).toHaveBeenCalledWith('health:medical-record-created', expect.any(Object));
      expect(eventBus.emit).toHaveBeenCalledWith('notification:send', expect.objectContaining({
        userId: 'parent-1',
        type: 'FINANCE'
      }));
    });
  });
});
