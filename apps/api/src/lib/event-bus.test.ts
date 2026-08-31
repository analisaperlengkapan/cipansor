import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventBus, initializeEventBus } from './event-bus';
import { notificationService } from '@/modules/notifications/email-sms.service';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    student: {
      findUnique: vi.fn(),
    },
    notification: {
      create: vi.fn().mockResolvedValue({ id: 'notif-1' }),
    },
    setting: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/modules/notifications/email-sms.service', () => ({
  notificationService: {
    sendTahfidzProgress: vi.fn().mockResolvedValue({ success: true }),
    sendPaymentReceipt: vi.fn().mockResolvedValue({ success: true }),
    send: vi.fn().mockResolvedValue({ success: true }),
  },
}));

describe('Event Bus Notification Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eventBus.removeAllListeners();
    initializeEventBus();
  });

  it('should send tahfidz progress email to secondary parent with email when primary lacks email', async () => {
    (prisma.student.findUnique as any).mockResolvedValue({
      id: 'student-1',
      user: { id: 'u-student', name: 'Santri Ahmad', email: 'student@cipansor.or.id' },
      parents: [
        { isPrimary: true, parent: { id: 'p1', name: 'Ayah', email: null } },
        { isPrimary: false, parent: { id: 'p2', name: 'Ibu', email: 'ibu@cipansor.or.id' } },
      ],
    });

    (prisma.setting.findFirst as any).mockResolvedValue({
      value: { EMAIL: true, SMS: true, WHATSAPP: true },
    });

    eventBus.emit('tahfidz:created', {
      id: 't-1',
      studentId: 'student-1',
      studentName: 'Santri Ahmad',
      unitId: 'unit-1',
      unitName: 'SMA',
      activityType: 'ZIYADAH',
      surahName: 'Al-Baqarah',
      surahNumber: 2,
      ayahStart: 1,
      ayahEnd: 10,
      totalAyah: 10,
      juz: 1,
      score: 90,
      recordedById: 'teacher-1',
      recordedAt: new Date(),
    });

    await vi.waitFor(() => {
      expect(notificationService.sendTahfidzProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'p2',
          recipientEmail: 'ibu@cipansor.or.id',
          studentName: 'Santri Ahmad',
          grade: '90 / 100',
        })
      );
    });
  });

  it('should not send tahfidz progress email when EMAIL channel policy is disabled', async () => {
    (prisma.setting.findFirst as any).mockResolvedValue({
      value: { EMAIL: false, SMS: true, WHATSAPP: true },
    });

    eventBus.emit('tahfidz:created', {
      id: 't-2',
      studentId: 'student-1',
      studentName: 'Santri Ahmad',
      unitId: 'unit-1',
      unitName: 'SMA',
      activityType: 'ZIYADAH',
      surahName: 'Al-Baqarah',
      surahNumber: 2,
      ayahStart: 1,
      ayahEnd: 10,
      totalAyah: 10,
      recordedById: 'teacher-1',
      recordedAt: new Date(),
    });

    await vi.waitFor(() => {
      expect(notificationService.sendTahfidzProgress).not.toHaveBeenCalled();
    });
  });

});
