import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    complaint: { create: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import { complaintsService } from './complaints.service';

const mocked = prisma as unknown as {
  complaint: { create: ReturnType<typeof vi.fn> };
};

describe('complaintsService.create (Si-Peka location links)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('persists building/room/asset references when provided', async () => {
    mocked.complaint.create.mockResolvedValue({ id: 'c1' });

    await complaintsService.create({
      unitId: 'unit-1',
      userId: 'user-1',
      category: 'FACILITY' as never,
      subject: 'AC ruang 7A mati total',
      description: 'AC di ruang kelas 7A tidak menyala sejak kemarin pagi.',
      buildingId: 'bld-1',
      roomId: 'room-7a',
      assetId: 'asset-ac-1',
    });

    expect(mocked.complaint.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          buildingId: 'bld-1',
          roomId: 'room-7a',
          assetId: 'asset-ac-1',
        }),
      })
    );
  });

  it('leaves location links undefined when not supplied (plain complaints unchanged)', async () => {
    mocked.complaint.create.mockResolvedValue({ id: 'c2' });

    await complaintsService.create({
      unitId: 'unit-1',
      userId: 'user-1',
      category: 'SERVICE' as never,
      subject: 'Antrean lama di TU',
      description: 'Pelayanan tata usaha memakan waktu lebih dari satu jam.',
    });

    const args = mocked.complaint.create.mock.calls[0][0];
    expect(args.data.buildingId).toBeUndefined();
    expect(args.data.roomId).toBeUndefined();
    expect(args.data.assetId).toBeUndefined();
  });
});
