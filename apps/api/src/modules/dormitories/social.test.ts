import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../lib/prisma';
import { getRoomSocialAnalytics } from './service';

vi.mock('../../lib/prisma', () => {
  const mockPrisma = {
    room: {
      findUnique: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

describe('Dormitory Service - Social Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate room harmony score with peer influence bonus', async () => {
    const mockRoom = {
      id: 'room-1',
      name: 'Abu Bakar 1',
      assignments: [
        {
          student: {
            id: 's1',
            user: { name: 'Student 1' },
            violations: [],
            medicalRecords: [],
            tahfidzRecords: Array(11).fill({}), // > 10 records for bonus
          },
        },
        {
          student: {
            id: 's2',
            user: { name: 'Student 2' },
            violations: [{ points: 10 }],
            medicalRecords: [],
            tahfidzRecords: [],
          },
        },
      ],
    };

    vi.mocked(prisma.room.findUnique).mockResolvedValue(mockRoom as any);

    const result = await getRoomSocialAnalytics('room-1');

    // avg violation = (0 + 10) / 2 = 5
    // base harmony = 100 * exp(-5 / 50) = 100 * exp(-0.1) approx 90.48
    // top memorizers = 1 (Student 1)
    // bonus = 1 * 2 = 2
    // final approx 92.48

    expect(result.harmonyScore).toBeGreaterThan(90);
    expect(result.status).toBe('KONDUSIF');
  });
});
