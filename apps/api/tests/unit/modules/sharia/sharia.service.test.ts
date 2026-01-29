import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shariaService } from '../../../../../src/modules/sharia/sharia.service';
import { prisma } from '../../../../../src/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    mustahik: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('Sharia Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAllMustahik', () => {
    it('should return paginated mustahiks', async () => {
      const mockMustahiks = [{ id: '1', name: 'Mustahik 1' }];
      (prisma.mustahik.findMany as any).mockResolvedValue(mockMustahiks);
      (prisma.mustahik.count as any).mockResolvedValue(1);

      const result = await shariaService.findAllMustahik({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockMustahiks);
      expect(result.pagination.total).toBe(1);
      expect(prisma.mustahik.findMany).toHaveBeenCalled();
    });
  });

  describe('createMustahik', () => {
    it('should create a mustahik', async () => {
      const mockMustahik = { id: '1', name: 'New Mustahik', type: 'INDIVIDU', asnafType: 'FAKIR' };
      (prisma.mustahik.create as any).mockResolvedValue(mockMustahik);

      const result = await shariaService.createMustahik({
        name: 'New Mustahik',
        type: 'INDIVIDU',
        asnafType: 'FAKIR'
      } as any);

      expect(result).toEqual(mockMustahik);
      expect(prisma.mustahik.create).toHaveBeenCalled();
    });
  });
});
