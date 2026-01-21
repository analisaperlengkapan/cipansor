/**
 * Email/SMS Notification Service
 * Phase 7A.2 - Notification Integration
 *
 * Supports:
 * - Email notifications via SMTP/SendGrid/AWS SES
 * - SMS notifications via Twilio/AWS SNS
 * - Push notifications (future)
 * - Notification templates
 * - Delivery tracking
 */

import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { Twilio } from 'twilio';
import { config } from '../../config';
import nodemailer from 'nodemailer';

// Notification templates
const templates = {
  // Welcome email for new users
  welcome: {
    subject: 'Selamat Datang di Cipansor',
    html: (data: { name: string; email: string; password?: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Selamat Datang di Cipansor!</h2>
        <p>Halo ${data.name},</p>
        <p>Akun Anda telah berhasil dibuat di sistem Cipansor - Pesantren Management System.</p>
        <p>Detail akun Anda:</p>
        <ul>
          <li><strong>Email:</strong> ${data.email}</li>
          ${data.password ? `<li><strong>Password sementara:</strong> ${data.password}</li>` : ''}
        </ul>
        ${data.password ? '<p>Silakan segera ubah password Anda setelah login pertama kali.</p>' : ''}
        <p>Salam,<br/>Tim Cipansor</p>
      </div>
    `,
  },

  // Password reset
  passwordReset: {
    subject: 'Reset Password - Cipansor',
    html: (data: { name: string; resetLink: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Reset Password</h2>
        <p>Halo ${data.name},</p>
        <p>Kami menerima permintaan untuk mereset password akun Anda.</p>
        <p>Klik tombol di bawah untuk mereset password:</p>
        <a href="${data.resetLink}" style="display: inline-block; background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
        <p>Link ini akan kadaluarsa dalam 1 jam.</p>
        <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
        <p>Salam,<br/>Tim Cipansor</p>
      </div>
    `,
  },

  // Payment reminder
  paymentReminder: {
    subject: 'Pengingat Pembayaran - Cipansor',
    html: (data: {
      parentName: string;
      studentName: string;
      invoiceNumber: string;
      amount: string;
      dueDate: string;
    }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Pengingat Pembayaran</h2>
        <p>Yth. Bapak/Ibu ${data.parentName},</p>
        <p>Kami ingin mengingatkan bahwa terdapat tagihan yang perlu dibayarkan untuk:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Nama Siswa:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.studentName}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>No. Invoice:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.invoiceNumber}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Jumlah:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.amount}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Jatuh Tempo:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.dueDate}</td></tr>
        </table>
        <p>Mohon segera melakukan pembayaran sebelum jatuh tempo untuk menghindari denda keterlambatan.</p>
        <p>Salam,<br/>Tim Keuangan Cipansor</p>
      </div>
    `,
  },

  // Violation notification to parent
  violationNotification: {
    subject: 'Pemberitahuan Pelanggaran Siswa - Cipansor',
    html: (data: {
      parentName: string;
      studentName: string;
      violationType: string;
      description: string;
      points: number;
      date: string;
    }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Pemberitahuan Pelanggaran</h2>
        <p>Yth. Bapak/Ibu ${data.parentName},</p>
        <p>Dengan ini kami sampaikan bahwa putra/putri Bapak/Ibu telah melakukan pelanggaran:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Nama Siswa:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.studentName}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Jenis Pelanggaran:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.violationType}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Deskripsi:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.description}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Poin:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.points}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Tanggal:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.date}</td></tr>
        </table>
        <p>Mohon kerja samanya untuk memberikan pembinaan kepada putra/putri Bapak/Ibu.</p>
        <p>Salam,<br/>Tim Pembinaan Cipansor</p>
      </div>
    `,
  },

  // Attendance alert
  attendanceAlert: {
    subject: 'Pemberitahuan Kehadiran Siswa - Cipansor',
    html: (data: {
      parentName: string;
      studentName: string;
      status: string;
      date: string;
      notes?: string;
    }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Pemberitahuan Kehadiran</h2>
        <p>Yth. Bapak/Ibu ${data.parentName},</p>
        <p>Status kehadiran putra/putri Bapak/Ibu hari ini:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Nama Siswa:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.studentName}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Tanggal:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.date}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Status:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.status}</td></tr>
          ${data.notes ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Keterangan:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.notes}</td></tr>` : ''}
        </table>
        <p>Salam,<br/>Tim Cipansor</p>
      </div>
    `,
  },

  // Permit status update
  permitStatusUpdate: {
    subject: 'Update Status Izin - Cipansor',
    html: (data: {
      parentName: string;
      studentName: string;
      status: string;
      permitType: string;
      startDate: string;
      endDate: string;
      notes?: string;
    }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Update Status Izin</h2>
        <p>Yth. Bapak/Ibu ${data.parentName},</p>
        <p>Pengajuan izin telah diproses dengan status: <strong>${data.status}</strong></p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Nama Siswa:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.studentName}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Jenis Izin:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.permitType}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Tanggal:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.startDate} - ${data.endDate}</td></tr>
          ${data.notes ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Catatan:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.notes}</td></tr>` : ''}
        </table>
        <p>Salam,<br/>Tim Cipansor</p>
      </div>
    `,
  },

  // General announcement
  announcement: {
    subject: '[Pengumuman] {title} - Cipansor',
    html: (data: { title: string; content: string; priority: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        ${data.priority === 'HIGH' ? '<div style="background-color: #dc2626; color: white; padding: 8px; text-align: center; font-weight: bold;">PENTING</div>' : ''}
        <h2 style="color: #1e40af;">${data.title}</h2>
        <div style="line-height: 1.6;">${data.content}</div>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #ddd;" />
        <p style="color: #666; font-size: 12px;">Pengumuman ini dikirim melalui sistem Cipansor - Pesantren Management System.</p>
      </div>
    `,
  },
};

// SMS templates
const smsTemplates = {
  paymentReminder: (data: { studentName: string; amount: string; dueDate: string }) =>
    `[Cipansor] Pengingat: Tagihan ${data.studentName} sebesar ${data.amount} jatuh tempo ${data.dueDate}. Info: portal.cipansor.id`,

  violationNotification: (data: { studentName: string; type: string }) =>
    `[Cipansor] Pemberitahuan: ${data.studentName} melakukan pelanggaran (${data.type}). Cek portal untuk detail.`,

  attendanceAlert: (data: { studentName: string; status: string }) =>
    `[Cipansor] ${data.studentName} tercatat ${data.status} hari ini.`,

  permitStatusUpdate: (data: { studentName: string; status: string }) =>
    `[Cipansor] Izin ${data.studentName} telah ${data.status}. Cek portal untuk detail.`,

  otp: (data: { code: string }) =>
    `[Cipansor] Kode OTP Anda: ${data.code}. Jangan bagikan kode ini.`,
};

export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
export type ServiceNotificationType =
  | 'WELCOME'
  | 'PASSWORD_RESET'
  | 'PAYMENT_REMINDER'
  | 'VIOLATION'
  | 'ATTENDANCE'
  | 'PERMIT_STATUS'
  | 'ANNOUNCEMENT'
  | 'GENERAL';

// Prisma NotificationType enum values
type PrismaNotificationType =
  | 'INFO'
  | 'ANNOUNCEMENT'
  | 'REMINDER'
  | 'ALERT'
  | 'PAYMENT'
  | 'ACADEMIC';

interface SendNotificationOptions {
  userId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  channel: NotificationChannel;
  type: ServiceNotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  templateKey?: keyof typeof templates;
  templateData?: Record<string, unknown>;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface NotificationResult {
  success: boolean;
  channel: NotificationChannel;
  messageId?: string;
  error?: string;
}

class NotificationService {
  private transporter: nodemailer.Transporter | null = null;

  /**
   * Get or create email transporter
   */
  private getTransporter(): nodemailer.Transporter | null {
    if (this.transporter) {
      return this.transporter;
    }

    const smtpHost = process.env.SMTP_HOST;
    if (!smtpHost) {
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    return this.transporter;
  }

  /**
   * Send a notification through specified channel
   */
  async send(options: SendNotificationOptions): Promise<NotificationResult> {
    const { channel, userId, type, title, message } = options;

    try {
      // Log notification to database
      const notificationLog = await prisma.notification.create({
        data: {
          userId: userId || '',
          type: this.mapNotificationType(type),
          title,
          message,
          status: 'UNREAD',
        },
      });

      let result: NotificationResult;

      switch (channel) {
        case 'EMAIL':
          result = await this.sendEmail(options);
          break;
        case 'SMS':
          result = await this.sendSMS(options);
          break;
        case 'IN_APP':
          result = { success: true, channel, messageId: notificationLog.id };
          break;
        default:
          result = { success: false, channel, error: 'Unsupported channel' };
      }

      return result;
    } catch (error) {
      logger.error('Failed to send notification:', error);
      return {
        success: false,
        channel,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send email notification
   * Currently logs emails - extend with nodemailer/SendGrid/AWS SES as needed
   */
  private async sendEmail(options: SendNotificationOptions): Promise<NotificationResult> {
    const { recipientEmail, title, templateKey, templateData } = options;

    if (!recipientEmail) {
      return { success: false, channel: 'EMAIL', error: 'Recipient email required' };
    }

    let subject = title;
    let htmlContent = options.message;

    // Build email content from template
    if (templateKey && templateData && templates[templateKey]) {
      const template = templates[templateKey];
      subject = template.subject.replace('{title}', (templateData.title as string) || title);

      // Type-safe template rendering based on key
      switch (templateKey) {
        case 'welcome':
          htmlContent = templates.welcome.html(
            templateData as Parameters<typeof templates.welcome.html>[0]
          );
          break;
        case 'passwordReset':
          htmlContent = templates.passwordReset.html(
            templateData as Parameters<typeof templates.passwordReset.html>[0]
          );
          break;
        case 'paymentReminder':
          htmlContent = templates.paymentReminder.html(
            templateData as Parameters<typeof templates.paymentReminder.html>[0]
          );
          break;
        case 'violationNotification':
          htmlContent = templates.violationNotification.html(
            templateData as Parameters<typeof templates.violationNotification.html>[0]
          );
          break;
        case 'attendanceAlert':
          htmlContent = templates.attendanceAlert.html(
            templateData as Parameters<typeof templates.attendanceAlert.html>[0]
          );
          break;
        case 'permitStatusUpdate':
          htmlContent = templates.permitStatusUpdate.html(
            templateData as Parameters<typeof templates.permitStatusUpdate.html>[0]
          );
          break;
        case 'announcement':
          htmlContent = templates.announcement.html(
            templateData as Parameters<typeof templates.announcement.html>[0]
          );
          break;
      }
    }

    // Log email for development/debugging
    logger.info(`[EMAIL] To: ${recipientEmail}, Subject: ${subject}`);

    const transporter = this.getTransporter();

    // Check if SMTP is configured
    if (!transporter) {
      logger.warn('Email not configured - SMTP_HOST not set. Email logged only.');
      return { success: true, channel: 'EMAIL', messageId: `log_${Date.now()}` };
    }

    try {
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Cipansor System" <no-reply@cipansor.id>',
        to: recipientEmail,
        subject: subject,
        html: htmlContent,
      });

      logger.info(`Email sent to ${recipientEmail}: ${info.messageId}`);
      return { success: true, channel: 'EMAIL', messageId: info.messageId };
    } catch (error) {
      logger.error(`Failed to send email to ${recipientEmail}:`, error);
      return {
        success: false,
        channel: 'EMAIL',
        error: error instanceof Error ? error.message : 'Unknown email error',
      };
    }
  }

  /**
   * Send SMS notification
   * Currently logs SMS - extend with Twilio/AWS SNS/local SMS gateway as needed
   */
  private async sendSMS(options: SendNotificationOptions): Promise<NotificationResult> {
    const { recipientPhone, message } = options;

    if (!recipientPhone) {
      return { success: false, channel: 'SMS', error: 'Recipient phone required' };
    }

    // Log SMS for development/debugging
    // Redact potential sensitive info in message
    const redactedMessage = message.replace(/\b\d{4,8}\b/g, '****');
    logger.info(`[SMS] To: ${recipientPhone}, Message: ${redactedMessage}`);

    // Check if Twilio is configured
    const { accountSid, authToken, phoneNumber } = config.twilio;

    if (!accountSid || !authToken || !phoneNumber) {
      logger.warn(
        'SMS not configured - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER not set. SMS logged only.'
      );
      return { success: true, channel: 'SMS', messageId: `log_${Date.now()}` };
    }

    try {
      const client = new Twilio(accountSid, authToken);
      const response = await client.messages.create({
        body: message,
        from: phoneNumber,
        to: recipientPhone,
      });

      logger.info(`SMS sent to ${recipientPhone}, SID: ${response.sid}`);
      return { success: true, channel: 'SMS', messageId: response.sid };
    } catch (error) {
      logger.error('Failed to send SMS via Twilio:', error);
      return {
        success: false,
        channel: 'SMS',
        error: error instanceof Error ? error.message : 'Twilio error',
      };
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulk(
    recipients: Array<{ userId: string; email?: string; phone?: string }>,
    options: Omit<SendNotificationOptions, 'userId' | 'recipientEmail' | 'recipientPhone'>
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    for (const recipient of recipients) {
      const result = await this.send({
        ...options,
        userId: recipient.userId,
        recipientEmail: recipient.email,
        recipientPhone: recipient.phone,
      });
      results.push(result);
    }

    return results;
  }

  /**
   * Send payment reminder to parents
   */
  async sendPaymentReminder(invoice: {
    id: string;
    invoiceNumber: string;
    amount: number;
    dueDate: Date;
    student: {
      id: string;
      name: string;
      parents: Array<{
        parent: { id: string; name: string; email: string; phone?: string };
        isPrimary: boolean;
      }>;
    };
  }): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    for (const sp of invoice.student.parents) {
      if (!sp.parent.email) continue;

      const emailResult = await this.send({
        userId: sp.parent.id,
        recipientEmail: sp.parent.email,
        channel: 'EMAIL',
        type: 'PAYMENT_REMINDER',
        title: 'Pengingat Pembayaran',
        message: '',
        templateKey: 'paymentReminder',
        templateData: {
          parentName: sp.parent.name,
          studentName: invoice.student.name,
          invoiceNumber: invoice.invoiceNumber,
          amount: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(
            invoice.amount
          ),
          dueDate: invoice.dueDate.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
        },
        priority: 'HIGH',
      });
      results.push(emailResult);

      if (sp.isPrimary && sp.parent.phone) {
        const smsResult = await this.send({
          userId: sp.parent.id,
          recipientPhone: sp.parent.phone,
          channel: 'SMS',
          type: 'PAYMENT_REMINDER',
          title: 'Pengingat Pembayaran',
          message: smsTemplates.paymentReminder({
            studentName: invoice.student.name,
            amount: new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0,
            }).format(invoice.amount),
            dueDate: invoice.dueDate.toLocaleDateString('id-ID'),
          }),
        });
        results.push(smsResult);
      }
    }

    return results;
  }

  /**
   * Send violation notification to parents
   */
  async sendViolationNotification(violation: {
    id: string;
    type: string;
    description: string;
    points: number;
    occurredAt: Date;
    student: {
      id: string;
      name: string;
      parents: Array<{
        parent: { id: string; name: string; email: string; phone?: string };
        isPrimary: boolean;
      }>;
    };
  }): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    for (const sp of violation.student.parents) {
      if (!sp.parent.email) continue;

      const emailResult = await this.send({
        userId: sp.parent.id,
        recipientEmail: sp.parent.email,
        channel: 'EMAIL',
        type: 'VIOLATION',
        title: 'Pemberitahuan Pelanggaran',
        message: '',
        templateKey: 'violationNotification',
        templateData: {
          parentName: sp.parent.name,
          studentName: violation.student.name,
          violationType: violation.type,
          description: violation.description,
          points: violation.points,
          date: violation.occurredAt.toLocaleDateString('id-ID'),
        },
        priority: 'HIGH',
      });
      results.push(emailResult);
    }

    return results;
  }

  /**
   * Send attendance alert
   */
  async sendAttendanceAlert(attendance: {
    studentId: string;
    studentName: string;
    status: string;
    date: Date;
    notes?: string;
    parents: Array<{
      parent: { id: string; name: string; email: string; phone?: string };
      isPrimary: boolean;
    }>;
  }): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    const statusLabels: Record<string, string> = {
      ABSENT: 'Tidak Hadir (Alpha)',
      SICK: 'Sakit',
      PERMITTED: 'Izin',
      LATE: 'Terlambat',
    };
    const statusLabel = statusLabels[attendance.status] || attendance.status;

    for (const sp of attendance.parents) {
      if (attendance.status === 'PRESENT' || !sp.isPrimary) continue;

      if (sp.parent.email) {
        const emailResult = await this.send({
          userId: sp.parent.id,
          recipientEmail: sp.parent.email,
          channel: 'EMAIL',
          type: 'ATTENDANCE',
          title: 'Pemberitahuan Kehadiran',
          message: '',
          templateKey: 'attendanceAlert',
          templateData: {
            parentName: sp.parent.name,
            studentName: attendance.studentName,
            status: statusLabel,
            date: attendance.date.toLocaleDateString('id-ID'),
            notes: attendance.notes,
          },
        });
        results.push(emailResult);
      }

      if (sp.parent.phone) {
        const smsResult = await this.send({
          userId: sp.parent.id,
          recipientPhone: sp.parent.phone,
          channel: 'SMS',
          type: 'ATTENDANCE',
          title: 'Pemberitahuan Kehadiran',
          message: smsTemplates.attendanceAlert({
            studentName: attendance.studentName,
            status: statusLabel,
          }),
        });
        results.push(smsResult);
      }
    }

    return results;
  }

  /**
   * Broadcast announcement
   */
  async broadcastAnnouncement(announcement: {
    id: string;
    title: string;
    content: string;
    priority: string;
    unitId?: string;
  }): Promise<{ sent: number; failed: number }> {
    const whereClause = announcement.unitId
      ? { unitId: announcement.unitId, isActive: true }
      : { isActive: true };

    const users = await prisma.user.findMany({
      where: whereClause,
      select: { id: true, email: true, phone: true },
    });

    const usersWithEmail = users.filter((u) => u.email);

    if (usersWithEmail.length > 0) {
      await prisma.notification.createMany({
        data: usersWithEmail.map((user) => ({
          userId: user.id,
          type: this.mapNotificationType('ANNOUNCEMENT'),
          title: announcement.title,
          message: '',
          status: 'UNREAD',
        })),
      });
    }

    let sent = 0;
    let failed = 0;
    const BATCH_SIZE = 50;

    for (let i = 0; i < usersWithEmail.length; i += BATCH_SIZE) {
      const batch = usersWithEmail.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (user) => {
          const result = await this.sendEmail({
            userId: user.id,
            recipientEmail: user.email!,
            channel: 'EMAIL',
            type: 'ANNOUNCEMENT',
            title: announcement.title,
            message: '',
            templateKey: 'announcement',
            templateData: {
              title: announcement.title,
              content: announcement.content,
              priority: announcement.priority,
            },
            priority: announcement.priority as 'LOW' | 'MEDIUM' | 'HIGH',
          });

          if (result.success) sent++;
          else failed++;
        })
      );
    }

    return { sent, failed };
  }

  /**
   * Map notification type to Prisma enum
   */
  private mapNotificationType(type: ServiceNotificationType): PrismaNotificationType {
    switch (type) {
      case 'PAYMENT_REMINDER':
        return 'PAYMENT';
      case 'ATTENDANCE':
      case 'VIOLATION':
        return 'ACADEMIC';
      case 'ANNOUNCEMENT':
        return 'ANNOUNCEMENT';
      case 'PASSWORD_RESET':
      case 'PERMIT_STATUS':
        return 'ALERT';
      case 'WELCOME':
      case 'GENERAL':
      default:
        return 'INFO';
    }
  }
}

export const notificationService = new NotificationService();
export { templates, smsTemplates };
