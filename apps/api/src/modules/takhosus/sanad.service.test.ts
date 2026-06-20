import { describe, it, expect, vi, beforeEach } from 'vitest';

// checkCertificateEligibility dispatches via a dynamic import('@/lib/event-bus').
const { emitMock } = vi.hoisted(() => ({ emitMock: vi.fn() }));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    takhosusEnrollment: { findUnique: vi.fn() },
    digitalCertificate: { findFirst: vi.fn() },
  },
}));
vi.mock('@/lib/event-bus', () => ({ eventBus: { emit: emitMock } }));

import { sanadService } from './takhosus.service';
import { prisma } from '@/lib/prisma';

const enrollmentWith = (juzCount: number) => ({
  sanadRecords: Array.from({ length: juzCount }, (_, i) => ({ juz: i + 1 })),
  student: { unitId: 'unit-1', user: { name: 'Ahmad' } },
});

describe('sanadService.checkCertificateEligibility', () => {
  beforeEach(() => vi.clearAllMocks());

  it('notifies staff for milestones the student has not yet been certified for', async () => {
    vi.mocked(prisma.takhosusEnrollment.findUnique).mockResolvedValue(enrollmentWith(30) as any);
    vi.mocked(prisma.digitalCertificate.findFirst).mockResolvedValue(null);

    await sanadService.checkCertificateEligibility('student-1');

    // 30 distinct juz (incl. juz 30) => 30/10/5-juz + Juz Amma milestones.
    expect(emitMock).toHaveBeenCalledTimes(4);
    expect(emitMock).toHaveBeenCalledWith(
      'notification:send',
      expect.objectContaining({
        unitId: 'unit-1',
        type: 'ACHIEVEMENT',
        title: 'Santri Berhak Menerima Sertifikat',
        data: { studentId: 'student-1', certificateType: 'TAHFIDZ_30_JUZ' },
      })
    );
  });

  it('does not notify for milestones already certified', async () => {
    vi.mocked(prisma.takhosusEnrollment.findUnique).mockResolvedValue(enrollmentWith(5) as any);
    vi.mocked(prisma.digitalCertificate.findFirst).mockResolvedValue({ id: 'cert-1' } as any);

    await sanadService.checkCertificateEligibility('student-1');

    expect(emitMock).not.toHaveBeenCalled();
  });

  it('does nothing below the lowest milestone', async () => {
    vi.mocked(prisma.takhosusEnrollment.findUnique).mockResolvedValue(enrollmentWith(2) as any);
    vi.mocked(prisma.digitalCertificate.findFirst).mockResolvedValue(null);

    await sanadService.checkCertificateEligibility('student-1');

    expect(emitMock).not.toHaveBeenCalled();
  });

  it('returns quietly when there is no enrollment', async () => {
    vi.mocked(prisma.takhosusEnrollment.findUnique).mockResolvedValue(null);

    await sanadService.checkCertificateEligibility('student-x');

    expect(emitMock).not.toHaveBeenCalled();
  });
});
