import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';
import * as prismaClient from '@prisma/client';

// Mock prisma before imports
vi.mock('../../lib/prisma', () => {
  const mockPrisma = {
    paymentType: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    invoice: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    payment: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  mockPrisma.$transaction.mockImplementation((callback) => callback(mockPrisma));
  return { prisma: mockPrisma };
});

import { prisma } from '../../lib/prisma';
import * as financeService from './service';
import * as notificationService from '../notifications/service';

import { eventBus } from '@/lib/event-bus';

vi.mock('../notifications/service', () => ({
  createNotification: vi.fn(),
}));

vi.mock('@/lib/event-bus', () => ({
  eventBus: {
    emit: vi.fn(),
  },
}));

describe('Finance Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPaymentType', () => {
    it('should create a payment type successfully', async () => {
      const dto = {
        name: 'SPP',
        code: 'SPP-01',
        description: 'Sumbangan Pembinaan Pendidikan',
        isRecurring: true,
        isActive: true,
        amount: 500000,
        unitId: 'unit-1',
      };

      const mockCreated = {
        id: 'pt-1',
        ...dto,
        amount: new Prisma.Decimal(500000),
        unit: { id: 'unit-1', name: 'SMA' },
      };

      vi.mocked(prisma.paymentType.create).mockResolvedValue(mockCreated as any);

      const result = await financeService.createPaymentType(dto);

      expect(prisma.paymentType.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          code: dto.code,
          description: dto.description,
          isRecurring: dto.isRecurring,
          isActive: dto.isActive,
          amount: expect.any(Prisma.Decimal),
          unit: { connect: { id: dto.unitId } },
          account: undefined,
        },
        include: { unit: { select: { id: true, name: true } } },
      });

      expect(result).toEqual(mockCreated);
    });
  });

  describe('createInvoice', () => {
    it('should create an invoice and send notification', async () => {
      const dto = {
        title: 'Pembayaran SPP Januari',
        amount: 500000,
        dueDate: '2026-03-01T00:00:00.000Z',
        studentId: 'stud-1',
        paymentTypeId: 'pt-1',
      };

      const mockInvoice = {
        id: 'inv-1',
        invoiceNumber: 'INV-202602-00001',
        student: {
          user: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
          unit: { id: 'unit-1', name: 'SMA' },
        },
        paymentType: { id: 'pt-1', name: 'SPP', code: 'SPP-01' },
        amount: new Prisma.Decimal(500000),
        dueDate: new Date(dto.dueDate),
      };

      vi.mocked(prisma.invoice.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.invoice.create).mockResolvedValue(mockInvoice as any);
      vi.mocked(notificationService.createNotification).mockResolvedValue({} as any);

      const result = await financeService.createInvoice(dto);

      expect(prisma.invoice.findFirst).toHaveBeenCalled();
      expect(prisma.invoice.create).toHaveBeenCalled();
      expect(notificationService.createNotification).toHaveBeenCalled();
      expect(result).toEqual(mockInvoice);
    });
  });
});
