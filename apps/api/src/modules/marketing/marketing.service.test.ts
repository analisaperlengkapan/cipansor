import { createLead, convertLeadToRegistrant } from './service';
import { prisma } from '@/lib/prisma';
import { createRegistrant } from '../psb/service';
import { LeadStatus } from '@prisma/client';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    lead: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../psb/service', () => ({
  createRegistrant: vi.fn(),
}));

describe('MarketingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createLead', () => {
    it('should create a lead with status NEW', async () => {
      const input = {
        name: 'John Doe',
        phone: '08123456789',
        source: 'WEBSITE',
      };
      const userId = 'user-1';

      (prisma.lead.create as any).mockResolvedValue({
        id: 'lead-1',
        ...input,
        status: LeadStatus.NEW,
        createdById: userId,
      });

      const result = await createLead(input, userId);

      expect(prisma.lead.create).toHaveBeenCalledWith({
        data: {
          ...input,
          status: LeadStatus.NEW,
          createdById: userId,
          email: undefined,
          interest: undefined,
          campaignId: undefined,
          notes: undefined,
        },
      });
      expect(result.status).toBe(LeadStatus.NEW);
    });
  });

  describe('convertLeadToRegistrant', () => {
    it('should convert lead to registrant and update lead status', async () => {
      const leadId = 'lead-1';
      const userId = 'user-1';
      const leadData = {
        id: leadId,
        name: 'John Doe',
        phone: '08123456789',
        source: 'WEBSITE',
        campaignId: 'camp-1',
        registrantId: null,
      };

      const registrantInput = {
        admissionPeriodId: 'period-1',
        fullName: 'John Doe',
        gender: 'MALE' as const,
        birthPlace: 'City',
        birthDate: new Date().toISOString(),
        address: 'Address',
        fatherName: 'Father',
        motherName: 'Mother',
      };

      (prisma.lead.findUnique as any).mockResolvedValue(leadData);
      (createRegistrant as any).mockResolvedValue({ id: 'reg-1' });
      (prisma.lead.update as any).mockResolvedValue({ ...leadData, status: LeadStatus.CONVERTED, registrantId: 'reg-1' });

      await convertLeadToRegistrant(leadId, registrantInput, userId);

      expect(prisma.lead.findUnique).toHaveBeenCalledWith({ where: { id: leadId } });
      expect(createRegistrant).toHaveBeenCalledWith(expect.objectContaining({
        ...registrantInput,
        campaignId: 'camp-1',
        source: 'WEBSITE',
      }));
      expect(prisma.lead.update).toHaveBeenCalledWith({
        where: { id: leadId },
        data: {
          status: LeadStatus.CONVERTED,
          registrantId: 'reg-1',
        },
      });
    });

    it('should throw error if lead not found', async () => {
      (prisma.lead.findUnique as any).mockResolvedValue(null);
      await expect(convertLeadToRegistrant('invalid', {} as any, 'user')).rejects.toThrow('Lead not found');
    });

    it('should throw error if lead already converted', async () => {
      (prisma.lead.findUnique as any).mockResolvedValue({ id: 'lead-1', registrantId: 'reg-1' });
      await expect(convertLeadToRegistrant('lead-1', {} as any, 'user')).rejects.toThrow('Lead already converted');
    });
  });
});
