import { describe, it, expect, vi, beforeEach } from 'vitest';
import { businessUnitService } from '../service';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    businessUnit: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('BusinessUnitService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list business units', async () => {
    const mockBUs = [{ id: '1', name: 'Kantin A' }];
    (prisma.businessUnit.findMany as any).mockResolvedValue(mockBUs);

    const result = await businessUnitService.list({ unitId: 'unit-1' });

    expect(result).toEqual(mockBUs);
    expect(prisma.businessUnit.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ unitId: 'unit-1' }),
    }));
  });

  it('should create a business unit', async () => {
    const data = { unitId: 'u1', name: 'Test BU', code: 'BU01', type: 'CANTEEN' as any };
    (prisma.businessUnit.findUnique as any).mockResolvedValue(null);
    (prisma.businessUnit.create as any).mockResolvedValue({ id: 'bu1', ...data });

    const result = await businessUnitService.create(data);

    expect(result.id).toBe('bu1');
    expect(prisma.businessUnit.create).toHaveBeenCalled();
  });

  it('should getById with unitId scoping', async () => {
    const mockBU = { id: 'bu1', unitId: 'unit-1', name: 'Kantin A' };
    (prisma.businessUnit.findFirst as any).mockResolvedValue(mockBU);

    const result = await businessUnitService.getById('bu1', 'unit-1');

    expect(result).toEqual(mockBU);
    expect(prisma.businessUnit.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'bu1', unitId: 'unit-1' }),
    }));
  });

  it('should throw notFound when getById targets a different unit', async () => {
    (prisma.businessUnit.findFirst as any).mockResolvedValue(null);

    await expect(businessUnitService.getById('bu1', 'other-unit')).rejects.toThrow();
  });
});
