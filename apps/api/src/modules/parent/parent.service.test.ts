import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parentService } from './service';
import { prisma } from '../../lib/prisma';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    studentParent: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    attendance: {
      findMany: vi.fn(),
    },
    invoice: {
      groupBy: vi.fn(),
    },
    permit: {
      groupBy: vi.fn(),
    },
    tahfidzRecord: {
      findMany: vi.fn(),
    },
    notification: {
      count: vi.fn(),
    },
    announcement: {
      findMany: vi.fn(),
    },
  },
}));

describe('ParentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDashboardSummary', () => {
    it('should return empty summary if no children', async () => {
      vi.mocked(prisma.studentParent.findMany).mockResolvedValue([]);
      vi.mocked(prisma.notification.count).mockResolvedValue(5);

      const result = await parentService.getDashboardSummary('parent-id');

      expect(result.children).toHaveLength(0);
      expect(result.unreadNotifications).toBe(5);
    });

    it('should return summary with children data', async () => {
      const mockChildren = [
        {
          student: {
            id: 'student-1',
            user: { name: 'Child 1' },
            enrollments: [],
            unitId: 'unit-1',
          },
          id: 'student-1', // Flattened by service logic simulation
        },
      ];

      // Mock getChildren response (since it calls findMany internally)
      vi.mocked(prisma.studentParent.findMany).mockResolvedValue([
        {
          student: {
            id: 'student-1',
            user: { name: 'Child 1', email: 'c1@test.com', isActive: true },
            nis: '123',
            gender: 'MALE',
            photoUrl: null,
            status: 'active',
            unitId: 'unit-1',
            unit: { id: 'unit-1', name: 'Unit 1', type: 'SD_IT' },
            enrollments: [],
          },
          relation: 'father',
          isPrimary: true,
        },
      ] as any);

      vi.mocked(prisma.attendance.findMany).mockResolvedValue([]);
      vi.mocked(prisma.invoice.groupBy).mockResolvedValue([]);
      vi.mocked(prisma.permit.groupBy).mockResolvedValue([]);
      vi.mocked(prisma.tahfidzRecord.findMany).mockResolvedValue([]);
      vi.mocked(prisma.notification.count).mockResolvedValue(0);
      vi.mocked(prisma.announcement.findMany).mockResolvedValue([]);

      const result = await parentService.getDashboardSummary('parent-id');

      expect(result.children).toHaveLength(1);
      expect(result.children[0].child.name).toBe('Child 1');
    });
  });
});
