import { describe, it, expect, vi, beforeEach } from 'vitest';
import nodemailer from 'nodemailer';
import { notificationService, templates } from './email-sms.service';
import { config } from '../../config';

// Mock prisma and logger
vi.mock('../../lib/prisma', () => ({
  prisma: {
    notification: {
      create: vi.fn().mockResolvedValue({ id: 'notif-123' }),
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    user: {
      findMany: vi.fn().mockResolvedValue([
        { id: 'user-1', email: 'test@cipansor.or.id', phone: '08123456789' }
      ]),
    },
  },
}));

vi.mock('../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('NotificationService Email Integration', () => {
  let sendMailMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    sendMailMock = vi.fn().mockResolvedValue({ messageId: 'msg-abc-123' });
    vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: sendMailMock,
    } as any);

    config.smtp.host = 'smtp.gmail.com';

    // Reset singleton transporter
    (notificationService as any).transporter = null;
  });

  it('should format email with default From and Reply-To headers', async () => {
    const result = await notificationService.send({
      channel: 'EMAIL',
      type: 'WELCOME',
      recipientEmail: 'santri@cipansor.or.id',
      title: 'Selamat Datang',
      message: 'Selamat bergabung di Cipansor',
      templateKey: 'welcome',
      templateData: { name: 'Ahmad Santri', email: 'santri@cipansor.or.id' },
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('msg-abc-123');
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: expect.stringContaining('noreply@cipansor.or.id'),
        replyTo: 'halo@cipansor.or.id',
        to: 'santri@cipansor.or.id',
        subject: 'Selamat Datang di Cipansor',
      })
    );
  });

  it('should render payment receipt email template with replyTo footer instructions', () => {
    const html = templates.paymentReceipt.html({
      parentName: 'Bapak Hendra',
      studentName: 'Fauzan',
      receiptNumber: 'KW-2025-001',
      amount: 'Rp 500.000',
      paymentDate: '27 Agustus 2025',
      paymentMethod: 'Transfer Bank Syariah',
      description: 'SPP Bulan Agustus 2025',
    });

    expect(html).toContain('Bapak Hendra');
    expect(html).toContain('KW-2025-001');
    expect(html).toContain('Rp 500.000');
    expect(html).toContain('halo@cipansor.or.id');
    expect(html).toContain('noreply');
  });

  it('should render tahfidz progress email template', () => {
    const html = templates.tahfidzProgress.html({
      parentName: 'Bapak Hendra',
      studentName: 'Fauzan',
      surah: 'Al-Baqarah',
      verses: '1-50',
      juz: 1,
      grade: 'Mumtaz (Sangat Baik)',
      teacherName: 'Ustadz Ahmad',
      date: '27 Agustus 2025',
    });

    expect(html).toContain('Al-Baqarah');
    expect(html).toContain('Mumtaz');
    expect(html).toContain('Juz 1');
    expect(html).toContain('halo@cipansor.or.id');
  });

  it('should render e-office official letter email template', () => {
    const html = templates.eofficeLetter.html({
      recipientName: 'Ustadz Ahmad',
      letterNumber: '001/YPC/VIII/2025',
      title: 'Surat Tugas Panitia Penerimaan Santri Baru',
      summary: 'Penunjukan Panitia PPDB 2025',
      signatoryName: 'K.H. Ketua Yayasan',
      date: '27 Agustus 2025',
      actionUrl: 'https://portal.cipansor.or.id/e-office',
    });

    expect(html).toContain('001/YPC/VIII/2025');
    expect(html).toContain('Surat Tugas Panitia Penerimaan Santri Baru');
    expect(html).toContain('https://portal.cipansor.or.id/e-office');
  });
});
