import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getStudentsByMusyrif } from '../../../../src/modules/dormitories/service';
import { prisma } from '../../../../src/lib/prisma';

// Mock dependencies
vi.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    musyrif: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    roomAssignment: {
      findMany: vi.fn(),
    },
  },
}));

describe('DormitoryService', () => {
  describe('getStudentsByMusyrif', () => {
    const mockUserId = 'user-123';

    it('should return empty list if musyrif not found', async () => {
      vi.mocked(prisma.musyrif.findFirst).mockResolvedValue(null);

      const result = await getStudentsByMusyrif(mockUserId);

      expect(result).toEqual([]);
      expect(prisma.musyrif.findFirst).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        include: { assignments: { where: { isActive: true } } },
      });
    });

    it('should return students for assigned rooms and dormitories', async () => {
      const mockMusyrif = {
        id: 'musyrif-1',
        assignments: [
          { dormitoryId: 'dorm-1', roomId: null }, // Assign entire dorm
          { dormitoryId: 'dorm-2', roomId: 'room-2' }, // Assign specific room
        ],
      };

      const mockRoomAssignments = [
        {
          student: {
            id: 'student-1',
            nis: '12345',
            gender: 'MALE',
            photoUrl: 'pic.jpg',
            user: { name: 'Ahmad', email: 'ahmad@example.com' },
            enrollments: [{ class: { name: '10 A' } }],
          },
          room: { name: 'Room 101' },
        },
        {
          student: {
            id: 'student-2',
            nis: '67890',
            gender: 'MALE',
            photoUrl: null,
            user: { name: 'Budi', email: 'budi@example.com' },
            enrollments: [],
          },
          room: { name: 'Room 102' },
        },
      ];

      vi.mocked(prisma.musyrif.findFirst).mockResolvedValue(mockMusyrif as any);
      vi.mocked(prisma.roomAssignment.findMany).mockResolvedValue(mockRoomAssignments as any);

      const result = await getStudentsByMusyrif(mockUserId);

      expect(prisma.roomAssignment.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          room: {
            OR: [{ id: { in: ['room-2'] } }, { dormitoryId: { in: ['dorm-1'] } }],
          },
        },
        include: expect.any(Object),
        orderBy: expect.any(Object),
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'student-1',
        name: 'Ahmad',
        nis: '12345',
        photo: 'pic.jpg',
        class: '10 A',
        room: 'Room 101',
        gender: 'MALE',
      });
      expect(result[1]).toEqual({
        id: 'student-2',
        name: 'Budi',
        nis: '67890',
        photo: null,
        class: '-',
        room: 'Room 102',
        gender: 'MALE',
      });
    });
  });
});
