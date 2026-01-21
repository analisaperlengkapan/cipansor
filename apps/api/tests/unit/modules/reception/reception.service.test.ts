import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReceptionService } from '../../../../../src/modules/reception/reception.service';
import { prisma } from '../../../../../src/lib/prisma';
import { VisitStatus, PackageStatus } from '@cipansor/shared';

// Mock dependencies
vi.mock('../../../../../src/lib/prisma', () => ({
  prisma: {
    guestBook: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    studentVisit: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    studentPackage: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('ReceptionService', () => {
  const unitId = 'unit-1';
  const userId = 'user-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getGuestBooks', () => {
    it('should return guest books filtered by unitId', async () => {
      const mockData = [{ id: '1', name: 'Guest 1' }];
      (prisma.guestBook.findMany as any).mockResolvedValue(mockData);

      const result = await ReceptionService.getGuestBooks(unitId, {});

      expect(prisma.guestBook.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { unitId },
          orderBy: { checkIn: 'desc' },
        })
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('createGuestBook', () => {
    it('should create a guest book entry', async () => {
      const input = { name: 'Guest', purpose: 'Visit' };
      const mockCreated = { id: '1', ...input };
      (prisma.guestBook.create as any).mockResolvedValue(mockCreated);

      const result = await ReceptionService.createGuestBook(unitId, userId, input);

      expect(prisma.guestBook.create).toHaveBeenCalledWith({
        data: { ...input, unitId, receivedById: userId },
      });
      expect(result).toEqual(mockCreated);
    });
  });

  describe('getStudentVisits', () => {
    it('should return student visits', async () => {
      const mockData = [{ id: '1', visitorName: 'Parent' }];
      (prisma.studentVisit.findMany as any).mockResolvedValue(mockData);

      const result = await ReceptionService.getStudentVisits(unitId, {});

      expect(prisma.studentVisit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { unitId },
        })
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getStats', () => {
    it('should return correct stats', async () => {
      (prisma.guestBook.count as any).mockResolvedValue(5);
      (prisma.studentVisit.count as any).mockResolvedValue(3);
      (prisma.studentPackage.count as any).mockResolvedValue(2);

      const result = await ReceptionService.getStats(unitId);

      expect(result).toEqual({
        guestsToday: 5,
        activeVisits: 3,
        pendingPackages: 2,
      });

      // Verify filters
      expect(prisma.studentVisit.count).toHaveBeenCalledWith({
        where: { unitId, status: VisitStatus.CHECKED_IN },
      });
      expect(prisma.studentPackage.count).toHaveBeenCalledWith({
        where: { unitId, status: PackageStatus.RECEIVED },
      });
    });
  });
});
