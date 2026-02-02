import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CorrespondenceService } from '../../src/modules/correspondence/correspondence.service';
import { prisma } from '../../src/lib/prisma';
import { CreateLetterInput } from '@cipansor/shared';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    agendaNumber: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    academicYear: {
      findFirst: vi.fn(),
    },
    letter: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    letterReviewer: {
      createMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    letterRecipient: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
    $queryRaw: vi.fn(),
  },
}));

describe('CorrespondenceService', () => {
  const unitId = 'unit-1';
  const userId = 'user-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateNumber', () => {
    it('should create new agenda number starting at 1 if none exists', async () => {
      // Mock no existing agenda
      (prisma.agendaNumber.findUnique as any).mockResolvedValue(null);
      // Mock create return
      (prisma.agendaNumber.create as any).mockResolvedValue({
        id: 'agenda-1',
        lastNumber: 0,
        format: '[NO]/[TYPE]/[ROMAN]/[YEAR]',
      });
      // Mock update increment
      (prisma.agendaNumber.update as any).mockResolvedValue({
        id: 'agenda-1',
        lastNumber: 1,
        format: '[NO]/[TYPE]/[ROMAN]/[YEAR]',
      });

      const result = await CorrespondenceService.generateNumber(unitId, 'INCOMING', 'ay-1');

      expect(prisma.agendaNumber.findUnique).toHaveBeenCalled();
      expect(prisma.agendaNumber.create).toHaveBeenCalled();
      expect(prisma.agendaNumber.update).toHaveBeenCalled();

      // Check formatting: 1 -> 001
      // [TYPE] -> INCOMING
      const currentYear = new Date().getFullYear();
      expect(result).toContain(`001/INCOMING/`);
      expect(result).toContain(`/${currentYear}`);
    });

    it('should increment existing agenda number', async () => {
      // Mock existing agenda
      (prisma.agendaNumber.findUnique as any).mockResolvedValue({
        id: 'agenda-1',
        lastNumber: 5,
        format: '[NO]/[TYPE]/[ROMAN]/[YEAR]',
      });
      // Mock update increment
      (prisma.agendaNumber.update as any).mockResolvedValue({
        id: 'agenda-1',
        lastNumber: 6,
        format: '[NO]/[TYPE]/[ROMAN]/[YEAR]',
      });

      const result = await CorrespondenceService.generateNumber(unitId, 'INCOMING', 'ay-1');

      expect(prisma.agendaNumber.create).not.toHaveBeenCalled();
      expect(prisma.agendaNumber.update).toHaveBeenCalled();
      expect(result).toContain('006/INCOMING/');
    });
  });

  describe('createLetter', () => {
    it('should create an incoming letter with generated agenda number', async () => {
      // Mock Academic Year
      (prisma.academicYear.findFirst as any).mockResolvedValue({ id: 'ay-1' });

      // Mock Agenda Generation (Simplified mock for this test)
      const generatedNumber = '001/INCOMING/X/2024';
      // We can spy on the service method itself or just mock prisma responses that generateNumber uses
      // Since generateNumber is part of the object, checking internal call is tricky without spying
      // So we rely on the implementation calling prisma

      (prisma.agendaNumber.findUnique as any).mockResolvedValue({
        id: 'agenda-1',
        lastNumber: 0,
        format: '[NO]/[TYPE]/[ROMAN]/[YEAR]',
      });
      (prisma.agendaNumber.update as any).mockResolvedValue({
        id: 'agenda-1',
        lastNumber: 1,
        format: '[NO]/[TYPE]/[ROMAN]/[YEAR]',
      });

      // Mock Letter Create
      const createdLetter = {
        id: 'letter-1',
        agendaNumber: '001/INCOMING/...',
      };
      (prisma.letter.create as any).mockResolvedValue(createdLetter);

      const input: CreateLetterInput = {
        unitId,
        direction: 'INCOMING',
        subject: 'Test Letter',
        content: 'Content',
        date: new Date().toISOString(),
        urgency: 'NORMAL',
        nature: 'PUBLIC',
        status: 'DRAFT',
        senderName: 'Sender',
      };

      const result = await CorrespondenceService.createLetter(input, userId);

      expect(prisma.letter.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          direction: 'INCOMING',
          subject: 'Test Letter',
        })
      }));
      expect(result).toEqual(createdLetter);
    });
  });
});
