import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnitType } from '@prisma/client';

const mockPrisma = vi.hoisted(() => ({
  unit: {
    findMany: vi.fn(),
    count: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  setting: {
    upsert: vi.fn(),
  },
  $transaction: vi.fn((promises) => Promise.all(promises)),
}));

// Mock using the alias
vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

import { UnitService } from '../../../../../src/modules/units/unit.service';

describe('UnitService', () => {
  let service: UnitService;

  beforeEach(() => {
    service = new UnitService();
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a unit with headName setting', async () => {
      const input = {
        name: 'New Unit',
        type: 'SD_IT' as UnitType,
        address: 'Test Address',
        headName: 'Head Master',
      };

      const mockUnit = { id: '1', name: input.name, type: input.type };

      mockPrisma.unit.create.mockResolvedValue(mockUnit);

      const result = await service.create(input);

      expect(mockPrisma.unit.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          settings: {
            create: {
              key: 'HEAD_MASTER_NAME',
              value: 'Head Master',
            },
          },
        }),
      }));

      expect(result).toEqual({ ...mockUnit, headName: 'Head Master' });
    });
  });

  describe('findById', () => {
    it('should return unit with headName mapped from settings', async () => {
      const mockUnit = {
        id: '1',
        name: 'Unit 1',
        settings: [{ value: 'Head Master' }],
        _count: {},
        classes: []
      };

      mockPrisma.unit.findFirst.mockResolvedValue(mockUnit);

      const result = await service.findById('1');

      expect(result).toHaveProperty('headName', 'Head Master');
      expect(result.settings).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update unit and upsert headName setting', async () => {
       const input = {
        name: 'Updated Unit',
        headName: 'New Head',
      };

      const mockUnit = { id: '1', name: 'Unit 1' };
      mockPrisma.unit.findFirst.mockResolvedValue(mockUnit);
      mockPrisma.unit.update.mockResolvedValue({ ...mockUnit, name: input.name });
      mockPrisma.setting.upsert.mockResolvedValue({});

      const result = await service.update('1', input);

      expect(mockPrisma.unit.update).toHaveBeenCalled();
      expect(mockPrisma.setting.upsert).toHaveBeenCalledWith(expect.objectContaining({
        create: expect.objectContaining({ value: 'New Head' }),
        update: expect.objectContaining({ value: 'New Head' })
      }));

      expect(result).toHaveProperty('headName', 'New Head');
    });
  });
});
