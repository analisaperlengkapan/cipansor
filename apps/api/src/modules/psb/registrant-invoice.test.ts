import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as psbService from './service';
import * as financeService from '../finance/service';
import { prisma } from '../../lib/prisma';
import { AdmissionStatus, Gender } from '@prisma/client';

// Mock dependencies
vi.mock('../../lib/prisma', () => ({
  prisma: {
    admissionPeriod: {
      findUnique: vi.fn(),
    },
    registrant: {
      count: vi.fn(),
      create: vi.fn(),
    },
    paymentType: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('../finance/service', () => ({
  createInvoice: vi.fn(),
}));

describe('PSB Service - Create Registrant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a registrant and generate an invoice if fee exists', async () => {
    // Setup Mocks
    const mockAdmissionPeriod = {
      id: 'period-1',
      unitId: 'unit-1',
      academicYear: { name: '2024/2025' },
      registrationFee: {
        gt: vi.fn().mockReturnValue(true),
        toNumber: vi.fn().mockReturnValue(100000),
      },
    };

    (prisma.admissionPeriod.findUnique as any).mockResolvedValue(mockAdmissionPeriod);
    (prisma.registrant.count as any).mockResolvedValue(0);

    const mockRegistrant = {
      id: 'reg-1',
      registrationNo: 'REG-2024-00001',
      admissionPeriod: mockAdmissionPeriod,
      wave: null,
    };

    (prisma.registrant.create as any).mockResolvedValue(mockRegistrant);

    // Mock Payment Type
    const mockPaymentType = { id: 'pt-1' };
    (prisma.paymentType.findFirst as any).mockResolvedValue(mockPaymentType);

    // Input data
    const input = {
      admissionPeriodId: 'period-1',
      name: 'Test Student',
      gender: 'MALE',
      birthPlace: 'Jakarta',
      birthDate: '2010-01-01',
      parentName: 'Test Parent',
      parentPhone: '08123456789',
      address: 'Jl. Test',
    };

    // Execute
    const result = await psbService.createRegistrant(input as any);

    // Verify Registrant Creation
    expect(prisma.registrant.create).toHaveBeenCalled();
    expect(result).toEqual(mockRegistrant);

    // Verify Invoice Creation
    expect(financeService.createInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        registrantId: 'reg-1',
        paymentTypeId: 'pt-1',
        amount: 100000,
      })
    );
  });

  it('should not create an invoice if fee is zero', async () => {
     // Setup Mocks for zero fee
     const mockAdmissionPeriod = {
      id: 'period-1',
      unitId: 'unit-1',
      academicYear: { name: '2024/2025' },
      registrationFee: {
        gt: vi.fn().mockReturnValue(false), // gt(0) is false
        toNumber: vi.fn().mockReturnValue(0),
      },
    };

    (prisma.admissionPeriod.findUnique as any).mockResolvedValue(mockAdmissionPeriod);
    (prisma.registrant.count as any).mockResolvedValue(0);

    const mockRegistrant = {
      id: 'reg-2',
      registrationNo: 'REG-2024-00002',
      admissionPeriod: mockAdmissionPeriod,
      wave: null,
    };

    (prisma.registrant.create as any).mockResolvedValue(mockRegistrant);

    const input = {
      admissionPeriodId: 'period-1',
      name: 'Free Student',
      gender: 'FEMALE',
      birthPlace: 'Bandung',
      birthDate: '2010-02-02',
      parentName: 'Free Parent',
      parentPhone: '08123456789',
      address: 'Jl. Free',
    };

    await psbService.createRegistrant(input as any);

    expect(financeService.createInvoice).not.toHaveBeenCalled();
  });
});
