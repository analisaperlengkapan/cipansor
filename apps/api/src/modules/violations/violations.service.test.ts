import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createViolation } from './service';
import { prisma } from '../../lib/prisma';

// Mock prisma
vi.mock('../../lib/prisma', () => ({
  prisma: {
    violation: {
      create: vi.fn(),
      aggregate: vi.fn(),
    },
    counselingSession: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    teacher: {
      findUnique: vi.fn(),
    },
    classEnrollment: {
      findFirst: vi.fn(),
    },
    student: {
        findUnique: vi.fn(),
    }
  },
}));

describe('Violations Service - Risk Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create violation and NOT create session if total points < 50', async () => {
    const mockViolation = { id: '1', points: 10 };
    (prisma.violation.create as any).mockResolvedValue(mockViolation);
    // Total points 40 (less than 50)
    (prisma.violation.aggregate as any).mockResolvedValue({ _sum: { points: 40 } });

    await createViolation({
      studentId: 'student1',
      type: 'MINOR' as any,
      category: 'DISCIPLINE',
      description: 'Late',
      occurredAt: new Date().toISOString(),
      points: 10
    }, 'reporter1');

    expect(prisma.violation.create).toHaveBeenCalled();
    // aggregate is called to check points
    expect(prisma.violation.aggregate).toHaveBeenCalled();
    // counseling session should not be created
    expect(prisma.counselingSession.create).not.toHaveBeenCalled();
  });

  it('should create counseling session if points >= 50 and no active session exists', async () => {
    const mockViolation = { id: '1', points: 10 };
    (prisma.violation.create as any).mockResolvedValue(mockViolation);
    // Total points 60 (>= 50)
    (prisma.violation.aggregate as any).mockResolvedValue({ _sum: { points: 60 } });

    // No active session
    (prisma.counselingSession.findFirst as any).mockResolvedValue(null);

    // Reporter is found as a teacher
    (prisma.teacher.findUnique as any).mockResolvedValue({ id: 'teacher1' });

    // Student found
    (prisma.student.findUnique as any).mockResolvedValue({ unitId: 'unit1' });

    await createViolation({
      studentId: 'student1',
      type: 'MINOR' as any,
      category: 'DISCIPLINE',
      description: 'Fighting',
      occurredAt: new Date().toISOString(),
      points: 10
    }, 'reporter1');

    expect(prisma.counselingSession.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        priority: 'HIGH',
        counselorId: 'teacher1',
        status: 'SCHEDULED'
      })
    }));
  });

  it('should NOT create new session if one is already active', async () => {
    const mockViolation = { id: '1', points: 10 };
    (prisma.violation.create as any).mockResolvedValue(mockViolation);
    (prisma.violation.aggregate as any).mockResolvedValue({ _sum: { points: 60 } });

    // Active session exists
    (prisma.counselingSession.findFirst as any).mockResolvedValue({ id: 'session1', status: 'SCHEDULED' });

    await createViolation({
      studentId: 'student1',
      type: 'MINOR' as any,
      category: 'DISCIPLINE',
      description: 'Fighting',
      occurredAt: new Date().toISOString(),
      points: 10
    }, 'reporter1');

    expect(prisma.counselingSession.create).not.toHaveBeenCalled();
  });
});
