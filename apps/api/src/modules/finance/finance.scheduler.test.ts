import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { generateRecurringBills } from './service';

// Mock all external dependencies
vi.mock('../../lib/prisma', () => ({
  prisma: {
    student: {
      findMany: vi.fn(),
    },
    paymentType: {
      findMany: vi.fn(),
    },
    invoice: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('Finance Scheduler Unit Tests - Auto Billing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateRecurringBills', () => {
    it('should query active students and recurring payment types', async () => {
      vi.mocked(prisma.student.findMany).mockResolvedValue([
        { id: 'student-1', unitId: 'unit-1', status: 'ACTIVE' } as any,
      ]);

      vi.mocked(prisma.paymentType.findMany).mockResolvedValue([
        { id: 'pt-spp', code: 'SPP', amount: new Prisma.Decimal(500000), unitId: 'unit-1' } as any,
      ]);

      vi.mocked(prisma.invoice.findFirst).mockResolvedValue(null);

      await generateRecurringBills();

      expect(prisma.student.findMany).toHaveBeenCalledWith({
        where: { status: 'ACTIVE' },
        select: { id: true, unitId: true, userId: true, isBoarding: true },
      });

      expect(prisma.paymentType.findMany).toHaveBeenCalledWith({
        where: { isRecurring: true, isActive: true },
      });
    });

    it('should generate invoices for eligible students', async () => {
      vi.mocked(prisma.student.findMany).mockResolvedValue([
        { id: 'student-1', unitId: 'unit-1', userId: 'user-1' } as any,
      ]);

      vi.mocked(prisma.paymentType.findMany).mockResolvedValue([
        { id: 'pt-spp', code: 'SPP', amount: new Prisma.Decimal(500000), unitId: 'unit-1', name: 'SPP' } as any,
      ]);

      // Mock that invoice doesn't exist yet for this month
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue(null);

      // Mock the create response
      vi.mocked(prisma.invoice.create).mockResolvedValue({ id: 'inv-new' } as any);

      const result = await generateRecurringBills();

      expect(prisma.invoice.findFirst).toHaveBeenCalledTimes(2); // 1 for existing check, 1 for generateInvoiceNumber
      expect(prisma.invoice.create).toHaveBeenCalledTimes(1);

      // Verify invoice data
      const createCall = vi.mocked(prisma.invoice.create).mock.calls[0][0];
      expect(createCall.data.studentId).toBe('student-1');
      expect(createCall.data.paymentTypeId).toBe('pt-spp');
      expect(createCall.data.amount.toString()).toBe('500000');
      
      expect(result.processed).toBe(1);
      expect(result.created).toBe(1);
    });

    it('should skip invoice creation if already billed for the month', async () => {
      vi.mocked(prisma.student.findMany).mockResolvedValue([
        { id: 'student-1', unitId: 'unit-1', userId: 'user-1' } as any,
      ]);

      vi.mocked(prisma.paymentType.findMany).mockResolvedValue([
        { id: 'pt-spp', code: 'SPP', amount: new Prisma.Decimal(500000), unitId: 'unit-1', name: 'SPP' } as any,
      ]);

      // Mock that invoice ALREADY exists for this month
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue({ id: 'inv-existing' } as any);

      const result = await generateRecurringBills();

      expect(prisma.invoice.findFirst).toHaveBeenCalledTimes(1);
      
      // Should NOT create
      expect(prisma.invoice.create).not.toHaveBeenCalled();

      expect(result.processed).toBe(1);
      expect(result.created).toBe(0);
      expect(result.skipped).toBe(1);
    });
  });
});
