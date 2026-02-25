import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createInvoice } from '@/modules/finance/service';
import { Prisma } from '@prisma/client';

// Mock dependencies
const { mockPrisma } = vi.hoisted(() => {
  return {
    mockPrisma: {
      invoice: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      scholarshipRecipient: {
        findMany: vi.fn(),
      },
    },
  };
});

vi.mock('../../src/lib/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('../../src/modules/notifications/service', () => ({
  createNotification: vi.fn(),
}));

describe('Finance Service - Scholarship Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createInvoice', () => {
    it('should apply scholarship discount correctly', async () => {
      // Setup Data
      const studentId = 'student-1';
      const paymentTypeId = 'spp-type';
      const amount = new Prisma.Decimal(1000000); // 1 Million
      const dueDate = new Date('2024-02-10');

      // 1. Mock Invoice Number Generation
      mockPrisma.invoice.findFirst.mockResolvedValue({
        invoiceNumber: 'INV-202402-00001',
      });

      // 2. Mock Scholarship Recipient
      mockPrisma.scholarshipRecipient.findMany.mockResolvedValue([
        {
          id: 'rec-1',
          studentId,
          scholarship: {
            discounts: [
              {
                paymentTypeId: 'spp-type',
                discountType: 'PERCENTAGE',
                discountValue: new Prisma.Decimal(50), // 50% discount
              },
            ],
          },
        },
      ]);

      // 3. Mock Invoice Creation
      mockPrisma.invoice.create.mockImplementation((args) => Promise.resolve({
        id: 'inv-1',
        ...args.data,
        student: { user: { id: 'user-1' } },
        paymentType: { name: 'SPP' },
        amount: args.data.amount, // Return the calculated amount
        dueDate: new Date(args.data.dueDate)
      }));

      // Execution
      await createInvoice({
        studentId,
        paymentTypeId,
        amount: amount.toNumber(),
        dueDate: dueDate.toISOString(),
      });

      // Verification
      // Check that findMany was called with the correct studentId and status
      const findManyArgs = mockPrisma.scholarshipRecipient.findMany.mock.calls[0][0];
      expect(findManyArgs.where.studentId).toBe(studentId);
      expect(findManyArgs.where.status).toBe('ACTIVE');

      // Check Invoice Creation
      const createArgs = mockPrisma.invoice.create.mock.calls[0][0];
      const callData = createArgs.data;

      expect(callData.originalAmount.toNumber()).toBe(1000000);
      expect(callData.discount.toNumber()).toBe(500000);
      expect(callData.amount.toNumber()).toBe(500000);
    });

    it('should handle fixed discount', async () => {
        // Setup Data
        const studentId = 'student-2';
        const paymentTypeId = 'building-fee';
        const amount = new Prisma.Decimal(5000000); // 5 Million
        const dueDate = new Date('2024-02-10');

        // 1. Mock Invoice Number
        mockPrisma.invoice.findFirst.mockResolvedValue(null);

        // 2. Mock Scholarship (Fixed 1 Million off)
        mockPrisma.scholarshipRecipient.findMany.mockResolvedValue([
          {
            id: 'rec-2',
            studentId,
            scholarship: {
              discounts: [
                {
                  paymentTypeId: 'building-fee',
                  discountType: 'FIXED',
                  discountValue: new Prisma.Decimal(1000000),
                },
              ],
            },
          },
        ]);

        // 3. Mock Create
        mockPrisma.invoice.create.mockImplementation((args) => Promise.resolve({
            id: 'inv-2',
            student: { user: { id: 'user-2' } },
            paymentType: { name: 'Building Fee' },
            amount: args.data.amount,
            dueDate: new Date(args.data.dueDate)
        }));

        // Execution
        await createInvoice({
          studentId,
          paymentTypeId,
          amount: amount.toNumber(),
          dueDate: dueDate.toISOString(),
        });

        // Check values
        const createArgs = mockPrisma.invoice.create.mock.calls[0][0];
        const callData = createArgs.data;

        expect(callData.originalAmount.toNumber()).toBe(5000000);
        expect(callData.discount.toNumber()).toBe(1000000);
        expect(callData.amount.toNumber()).toBe(4000000);
      });
  });
});
