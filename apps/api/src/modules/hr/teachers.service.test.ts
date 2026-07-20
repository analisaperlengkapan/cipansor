import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    teacher: { findMany: vi.fn(), count: vi.fn() },
  },
}));

import { prisma } from '../../lib/prisma';
import { getTeachers } from './hr.service';

const mocked = prisma as unknown as {
  teacher: { findMany: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> };
};

describe('hr getTeachers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filters by unit and active status, and derives status field', async () => {
    mocked.teacher.findMany.mockResolvedValue([
      {
        id: 't-1',
        user: { id: 'u-1', name: 'Ust. A', email: 'a@x.id', phone: null, isActive: true },
        unit: { id: 'unit-1', name: 'SD IT' },
      },
      {
        id: 't-2',
        user: { id: 'u-2', name: 'Ust. B', email: 'b@x.id', phone: null, isActive: false },
        unit: { id: 'unit-1', name: 'SD IT' },
      },
    ]);
    mocked.teacher.count.mockResolvedValue(2);

    const result = await getTeachers({
      page: 1,
      limit: 20,
      unitId: 'unit-1',
      status: 'ACTIVE',
    });

    expect(mocked.teacher.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          deletedAt: null,
          unitId: 'unit-1',
          user: { isActive: true, deletedAt: null },
        },
        skip: 0,
        take: 20,
      })
    );
    expect(result.data[0].status).toBe('ACTIVE');
    expect(result.data[1].status).toBe('INACTIVE');
    expect(result.meta).toEqual({ page: 1, limit: 20, total: 2, totalPages: 1 });
  });

  it('applies name search within the user relation', async () => {
    mocked.teacher.findMany.mockResolvedValue([]);
    mocked.teacher.count.mockResolvedValue(0);

    await getTeachers({ page: 2, limit: 10, search: 'fulan' });

    expect(mocked.teacher.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          deletedAt: null,
          user: { name: { contains: 'fulan', mode: 'insensitive' } },
        },
        skip: 10,
        take: 10,
      })
    );
  });
});
