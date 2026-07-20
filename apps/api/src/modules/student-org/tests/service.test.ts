import { describe, it, expect, vi, beforeEach } from 'vitest';
import { studentOrgService } from '../student-org.service';
import { prisma } from '../../../lib/prisma';

vi.mock('../../../lib/prisma', () => ({
  prisma: {
    studentOrg: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    studentOrgPosition: {
      create: vi.fn(),
    },
    studentOrgMember: {
      create: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findFirst: vi.fn(),
    },
    studentOrgLogbook: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('StudentOrgService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create an organization', async () => {
    const mockData = { unitId: 'u1', academicYearId: 'ay1', name: 'Student Council' };
    (prisma.studentOrg.create as any).mockResolvedValue({ id: 'o1', ...mockData });

    const result = await studentOrgService.createOrg(mockData);
    expect(result.name).toBe('Student Council');
    expect(prisma.studentOrg.create).toHaveBeenCalled();
  });
});
