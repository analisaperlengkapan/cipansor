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
import { whatsAppService } from './whatsapp.service';

/**
 * Layout HTML Wrapper standard for Yayasan Pesantren Cipansor
 */
const renderEmailLayout = (title: string, contentHtml: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background-color: #1e3a8a; color: #ffffff; padding: 20px 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">Yayasan Pesantren Cipansor</h1>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #93c5fd;">Sistem Informasi Management Terpadu</p>
    </div>
    <!-- Body -->
    <div style="padding: 24px; color: #1f2937; line-height: 1.6;">
      ${contentHtml}
    </div>
    <!-- Footer -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b;">
      <p style="margin: 0 0 8px 0;">Email ini dikirim secara otomatis oleh Sistem Informasi Yayasan Pesantren Cipansor.</p>
      <p style="margin: 0; font-style: italic; color: #0284c7;">
        Mohon <strong>tidak membalas langsung ke alamat email noreply ini</strong>. Jika Anda memiliki pertanyaan, silakan kirim email ke kanal resmi kami di
        <a href="mailto:${config.smtp.replyTo}" style="color: #0284c7; font-weight: bold; text-decoration: underline;">${config.smtp.replyTo}</a>.
      </p>
      <p style="margin: 12px 0 0 0; color: #94a3b8;">&copy; ${new Date().getFullYear()} Yayasan Pesantren Cipansor. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

// Notification templates
const templates = {
  // Welcome email for new users
  welcome: {
    subject: 'Selamat Datang di Cipansor',
    html: (data: { name: string; email: string; password?: string }) =>
      renderEmailLayout(
        'Selamat Datang di Cipansor',
        `
        <h2 style="color: #1e3a8a; margin-top: 0;">Selamat Datang di Cipansor!</h2>
        <p>Halo <strong>${data.name}</strong>,</p>
        <p>Akun Anda telah berhasil dibuat di sistem Cipansor - Pesantren Management System.</p>
        <div style="background-color: #f1f5f9; border-left: 4px solid #1e3a8a; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px 0;"><strong>Detail Akun Anda:</strong></p>
          <ul style="margin: 0; padding-left: 20px;">
            <li><strong>Email:</strong> ${data.email}</li>
            ${data.password ? `<li><strong>Password sementara:</strong> <code>${data.password}</code></li>` : ''}
          </ul>
        </div>
        ${data.password ? '<p style="color: #dc2626; font-size: 13px;"><em>Demi keamanan, silakan segera ubah password Anda setelah login pertama kali.</em></p>' : ''}
        <p style="margin-top: 24px;">Salam,<br/><strong>Tim Pengelola Cipansor</strong></p>
        `
      ),
  },

  // Password reset
  passwordReset: {
    subject: 'Reset Password - Cipansor',
    html: (data: { name: string; resetLink: string }) =>
      renderEmailLayout(
        'Reset Password - Cipansor',
        `
        <h2 style="color: #1e3a8a; margin-top: 0;">Reset Password</h2>
        <p>Halo <strong>${data.name}</strong>,</p>
        <p>Kami menerima permintaan untuk mereset password akun Anda di Sistem Cipansor.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${data.resetLink}" style="display: inline-block; background-color: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password Saya</a>
        </div>
        <p style="font-size: 13px; color: #64748b;">Link ini akan kadaluarsa dalam 1 jam.</p>
        <p style="font-size: 13px; color: #64748b;">Jika Anda tidak meminta reset password, abaikan saja email ini.</p>
        <p style="margin-top: 24px;">Salam,<br/><strong>Tim IT & Keamanan Cipansor</strong></p>
        `
      ),
  },

  // Payment reminder
  paymentReminder: {
    subject: 'Pengingat Tagihan Pembayaran - Cipansor',
    html: (data: {
      parentName: string;
      studentName: string;
      invoiceNumber: string;
      amount: string;
      dueDate: string;
    }) =>
      renderEmailLayout(
        'Pengingat Pembayaran - Cipansor',
        `
        <h2 style="color: #1e3a8a; margin-top: 0;">Pengingat Tagihan Pembayaran</h2>
        <p>Yth. Bapak/Ibu <strong>${data.parentName}</strong>,</p>
        <p>Kami menyampaikan pengingat mengenai tagihan pendidikan/pesantren untuk putra/putri Anda:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
          <tr style="background-color: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0; width: 35%;"><strong>Nama Santri/Siswa:</strong></td><td style="padding: 10px; border: 1px solid #e2e8f0;">${data.studentName}</td></tr>
          <tr><td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>No. Invoice:</strong></td><td style="padding: 10px; border: 1px solid #e2e8f0;"><code>${data.invoiceNumber}</code></td></tr>
          <tr style="background-color: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Jumlah Tagihan:</strong></td><td style="padding: 10px; border: 1px solid #e2e8f0; color: #047857; font-weight: bold;">${data.amount}</td></tr>
          <tr><td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Jatuh Tempo:</strong></td><td style="padding: 10px; border: 1px solid #e2e8f0; color: #b91c1c; font-weight: bold;">${data.dueDate}</td></tr>
        </table>
        <p>Mohon segera melakukan pembayaran sebelum tanggal jatuh tempo melalui Portal Wali / Rekening Resmi Yayasan.</p>
        <p style="margin-top: 24px;">Salam hangat,<br/><strong>Bendahara & Keuangan Cipansor</strong></p>
        `
      ),
  },

  // Payment Receipt (Kwitansi Pembayaran)
  paymentReceipt: {
    subject: 'Bukti Pembayaran Resmi - Cipansor',
    html: (data: {
      parentName: string;
      studentName: string;
      receiptNumber: string;
      amount: string;
      paymentDate: string;
      paymentMethod: string;
      description: string;
    }) =>
      renderEmailLayout(
        'Bukti Pembayaran Resmi',
        `
        <h2 style="color: #047857; margin-top: 0;">Kwitansi & Bukti Pembayaran Resmi</h2>
        <p>Yth. Bapak/Ibu <strong>${data.parentName}</strong>,</p>
        <p>Pembayaran Anda telah kami terima dan diverifikasi oleh Tim Keuangan Yayasan Pesantren Cipansor.</p>
        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 16px; margin: 16px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 6px 0; color: #065f46;"><strong>No. Bukti / Transaksi:</strong></td><td style="padding: 6px 0; text-align: right; color: #065f46;"><code>${data.receiptNumber}</code></td></tr>
            <tr><td style="padding: 6px 0; color: #065f46;"><strong>Nama Santri:</strong></td><td style="padding: 6px 0; text-align: right; color: #065f46;">${data.studentName}</td></tr>
            <tr><td style="padding: 6px 0; color: #065f46;"><strong>Keterangan:</strong></td><td style="padding: 6px 0; text-align: right; color: #065f46;">${data.description}</td></tr>
            <tr><td style="padding: 6px 0; color: #065f46;"><strong>Metode Pembayaran:</strong></td><td style="padding: 6px 0; text-align: right; color: #065f46;">${data.paymentMethod}</td></tr>
            <tr><td style="padding: 6px 0; color: #065f46;"><strong>Tanggal Pembayaran:</strong></td><td style="padding: 6px 0; text-align: right; color: #065f46;">${data.paymentDate}</td></tr>
            <tr style="border-top: 1px solid #a7f3d0;"><td style="padding: 10px 0 0 0; color: #047857; font-size: 16px;"><strong>Total Dibayar:</strong></td><td style="padding: 10px 0 0 0; text-align: right; color: #047857; font-size: 18px; font-weight: bold;">${data.amount}</td></tr>
          </table>
        </div>
        <p>Terima kasih atas kepercayaannya mendampingi pendidikan santri di Cipansor.</p>
        <p style="margin-top: 24px;">Jazakumullah Khairan,<br/><strong>Tim Keuangan Yayasan Pesantren Cipansor</strong></p>
        `
      ),
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
    }) =>
      renderEmailLayout(
        'Pemberitahuan Kedisiplinan',
        `
        <h2 style="color: #b91c1c; margin-top: 0;">Pemberitahuan Pelanggaran Kedisiplinan</h2>
        <p>Yth. Bapak/Ibu <strong>${data.parentName}</strong>,</p>
        <p>Dengan ini kami menyampaikan laporan catatan kedisiplinan putra/putri Bapak/Ibu:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
          <tr style="background-color: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0; width: 35%;"><strong>Nama Santri:</strong></td><td style="padding: 10px; border: 1px solid #e2e8f0;">${data.studentName}</td></tr>
          <tr><td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Kategori Pelanggaran:</strong></td><td style="padding: 10px; border: 1px solid #e2e8f0;">${data.violationType}</td></tr>
          <tr style="background-color: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Deskripsi:</strong></td><td style="padding: 10px; border: 1px solid #e2e8f0;">${data.description}</td></tr>
          <tr><td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Poin Pelanggaran:</strong></td><td style="padding: 10px; border: 1px solid #e2e8f0; color: #b91c1c; font-weight: bold;">+${data.points} Poin</td></tr>
          <tr style="background-color: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Tanggal Kejadian:</strong></td><td style="padding: 10px; border: 1px solid #e2e8f0;">${data.date}</td></tr>
        </table>
        <p>Mohon kerjasamanya untuk senantiasa membimbing dan memberikan pengarahan kepada ananda.</p>
        <p style="margin-top: 24px;">Salam,<br/><strong>Tim Pengasuhan & Kedisiplinan Cipansor</strong></p>
        `
      ),
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
    }) =>
      renderEmailLayout(
        'Pemberitahuan Kehadiran',
        `
        <h2 style="color: #1e3a8a; margin-top: 0;">Laporan Kehadiran Santri</h2>
        <p>Yth. Bapak/Ibu <strong>${data.parentName}</strong>,</p>
        <p>Informasi status presensi putra/putri Bapak/Ibu hari ini:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
          <tr style="background-color: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0; width: 35%;"><strong>Nama Santri:</strong></td><td style="padding: 10px; border: 1px solid #e2e8f0;">${data.studentName}</td></tr>
          <tr><td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Tanggal:</strong></td><td style="padding: 10px; border: 1px solid #e2e8f0;">${data.date}</td></tr>
          <tr style="background-color: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Status Kehadiran:</strong></td><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">${data.status}</td></tr>
          ${data.notes ? `<tr><td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Keterangan:</strong></td><td style="padding: 10px; border: 1px solid #e2e8f0;">${data.notes}</td></tr>` : ''}
        </table>
        <p style="margin-top: 24px;">Salam,<br/><strong>Tim Kesiswaan Cipansor</strong></p>
        `
      ),
  },

  // Permit status update
  permitStatusUpdate: {
    subject: 'Update Status Izin Santri - Cipansor',
    html: (data: {
      parentName: string;
      studentName: string;
      status: string;
      permitType: string;
      startDate: string;
      endDate: string;
      notes?: string;
    }) =>
      renderEmailLayout(
        'Update Status Perizinan',
        `
        <h2 style="color: #1e3a8a; margin-top: 0;">Status Pengajuan Izin Santri</h2>
        <p>Yth. Bapak/Ibu <strong>${data.parentName}</strong>,</p>
        <p>Permohonan izin pengasuhan/keluar kompleks santri telah diverifikasi dengan status: <span style="background-color: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${data.status}</span></p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
          <tr style="background-color: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0; width: 35%;"><strong>Nama Santri:</strong></td><td style="padding: 10px; border: 1px solid #e2e8f0;">${data.studentName}</td></tr>
          <tr><td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Jenis Izin:</strong></td><td style="padding: 10px; border: 1px solid #e2e8f0;">${data.permitType}</td></tr>
          <tr style="background-color: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Periode Izin:</strong></td><td style="padding: 10px; border: 1px solid #e2e8f0;">${data.startDate} - ${data.endDate}</td></tr>
          ${data.notes ? `<tr><td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Catatan Pengasuh:</strong></td><td style="padding: 10px; border: 1px solid #e2e8f0;">${data.notes}</td></tr>` : ''}
        </table>
        <p style="margin-top: 24px;">Salam,<br/><strong>Tim Musyrif & Kesantrian Cipansor</strong></p>
        `
      ),
  },

  // Tahfidz Progress Update (Report Setoran Hafalan)
  tahfidzProgress: {
    subject: 'Laporan Perkembangan Tahfidz Santri - Cipansor',
    html: (data: {
      parentName: string;
      studentName: string;
      surah: string;
      verses: string;
      juz: number;
      grade: string;
      teacherName: string;
      date: string;
    }) =>
      renderEmailLayout(
        'Laporan Tahfidz Al-Qur\'an',
        `
        <h2 style="color: #047857; margin-top: 0;">Laporan Setoran & Capaian Tahfidz</h2>
        <p>Yth. Bapak/Ibu <strong>${data.parentName}</strong>,</p>
        <p>Alhamdulillah, berikut perkembangan hafalan Al-Qur'an putra/putri Anda:</p>
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin: 16px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 6px 0; color: #166534;"><strong>Nama Santri:</strong></td><td style="padding: 6px 0; text-align: right; color: #166534;">${data.studentName}</td></tr>
            <tr><td style="padding: 6px 0; color: #166534;"><strong>Surah / Ayat:</strong></td><td style="padding: 6px 0; text-align: right; color: #166534;">${data.surah} (${data.verses})</td></tr>
            <tr><td style="padding: 6px 0; color: #166534;"><strong>Juz:</strong></td><td style="padding: 6px 0; text-align: right; color: #166534;">Juz ${data.juz}</td></tr>
            <tr><td style="padding: 6px 0; color: #166534;"><strong>Nilai Kelancaran:</strong></td><td style="padding: 6px 0; text-align: right; color: #166534; font-weight: bold;">${data.grade}</td></tr>
            <tr><td style="padding: 6px 0; color: #166534;"><strong>Pengampu / Ustadz:</strong></td><td style="padding: 6px 0; text-align: right; color: #166534;">${data.teacherName}</td></tr>
            <tr><td style="padding: 6px 0; color: #166534;"><strong>Tanggal Setoran:</strong></td><td style="padding: 6px 0; text-align: right; color: #166534;">${data.date}</td></tr>
          </table>
        </div>
        <p>Semoga ananda istiqomah dan senantiasa diberkahi Al-Qur'an.</p>
        <p style="margin-top: 24px;">Jazakumullah Khairan,<br/><strong>Lembaga Tahfidz Qur'an Cipansor</strong></p>
        `
      ),
  },

  // E-Office Official Letter / Surat Tugas / Persuratan
  eofficeLetter: {
    subject: 'Surat Resmi & Kedinasan - Cipansor',
    html: (data: {
      recipientName: string;
      letterNumber: string;
      title: string;
      summary: string;
      signatoryName: string;
      date: string;
      actionUrl?: string;
    }) =>
      renderEmailLayout(
        'E-Office Persuratan Resmi',
        `
        <h2 style="color: #1e3a8a; margin-top: 0;">Pemberitahuan Persuratan E-Office</h2>
        <p>Kepada Yth. <strong>${data.recipientName}</strong>,</p>
        <p>Terdapat naskah dinas / surat resmi baru yang diterbitkan melalui E-Office Yayasan Pesantren Cipansor:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
          <tr style="background-color: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0; width: 35%;"><strong>No. Surat:</strong></td><td style="padding: 10px; border: 1px solid #e2e8f0;"><code>${data.letterNumber}</code></td></tr>
          <tr><td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Perihal:</strong></td><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">${data.title}</td></tr>
          <tr style="background-color: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Ringkasan / Isi:</strong></td><td style="padding: 10px; border: 1px solid #e2e8f0;">${data.summary}</td></tr>
          <tr><td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Penandatangan:</strong></td><td style="padding: 10px; border: 1px solid #e2e8f0;">${data.signatoryName}</td></tr>
          <tr style="background-color: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Tanggal Terbit:</strong></td><td style="padding: 10px; border: 1px solid #e2e8f0;">${data.date}</td></tr>
        </table>
        ${
          data.actionUrl
            ? `<div style="text-align: center; margin: 24px 0;"><a href="${data.actionUrl}" style="display: inline-block; background-color: #1e3a8a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Buka Dokumen di E-Office</a></div>`
            : ''
        }
        <p style="margin-top: 24px;">Hormat kami,<br/><strong>Sekretariat & E-Office Cipansor</strong></p>
        `
      ),
  },

  // General announcement
  announcement: {
    subject: '[Pengumuman Resmi] {title} - Cipansor',
    html: (data: { title: string; content: string; priority: string }) =>
      renderEmailLayout(
        data.title,
        `
        ${data.priority === 'HIGH' ? '<div style="background-color: #dc2626; color: white; padding: 8px 12px; text-align: center; font-weight: bold; border-radius: 4px; margin-bottom: 16px;">PENGUMUMAN PENTING</div>' : ''}
        <h2 style="color: #1e3a8a; margin-top: 0;">${data.title}</h2>
        <div style="line-height: 1.6; margin: 16px 0;">${data.content}</div>
        <p style="margin-top: 24px;">Salam,<br/><strong>Pengurus Yayasan Pesantren Cipansor</strong></p>
        `
      ),
  },
};

// SMS templates
const smsTemplates = {
  paymentReminder: (data: { studentName: string; amount: string; dueDate: string }) =>
    `[Cipansor] Pengingat: Tagihan ${data.studentName} sebesar ${data.amount} jatuh tempo ${data.dueDate}. Info: portal.cipansor.or.id`,

  violationNotification: (data: { studentName: string; type: string }) =>
    `[Cipansor] Pemberitahuan: ${data.studentName} melakukan pelanggaran (${data.type}). Cek portal untuk detail.`,

  attendanceAlert: (data: { studentName: string; status: string }) =>
    `[Cipansor] ${data.studentName} tercatat ${data.status} hari ini.`,

  permitStatusUpdate: (data: { studentName: string; status: string }) =>
    `[Cipansor] Izin ${data.studentName} telah ${data.status}. Cek portal untuk detail.`,

  otp: (data: { code: string }) =>
    `[Cipansor] Kode OTP Anda: ${data.code}. Jangan bagikan kode ini.`,
};

export type NotificationChannel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH' | 'IN_APP';
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

    const smtpHost = config.smtp.host || process.env.SMTP_HOST;
    if (!smtpHost) {
      return null;
    }

    const authConfig: Record<string, string | undefined> = {};
    if (config.smtp.oauth2?.clientId && config.smtp.oauth2?.refreshToken) {
      authConfig.type = 'OAuth2';
      authConfig.user = config.smtp.user;
      authConfig.clientId = config.smtp.oauth2.clientId;
      authConfig.clientSecret = config.smtp.oauth2.clientSecret;
      authConfig.refreshToken = config.smtp.oauth2.refreshToken;
    } else if (config.smtp.user) {
      authConfig.user = config.smtp.user;
      authConfig.pass = config.smtp.pass;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: authConfig as any,
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
        case 'WHATSAPP':
          result = await this.sendWhatsApp(options);
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
        case 'paymentReceipt':
          htmlContent = templates.paymentReceipt.html(
            templateData as Parameters<typeof templates.paymentReceipt.html>[0]
          );
          break;
        case 'tahfidzProgress':
          htmlContent = templates.tahfidzProgress.html(
            templateData as Parameters<typeof templates.tahfidzProgress.html>[0]
          );
          break;
        case 'eofficeLetter':
          htmlContent = templates.eofficeLetter.html(
            templateData as Parameters<typeof templates.eofficeLetter.html>[0]
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
      const fromAddress = config.smtp.from || process.env.SMTP_FROM || '"Yayasan Pesantren Cipansor" <noreply@cipansor.or.id>';
      const replyToAddress = config.smtp.replyTo || process.env.SMTP_REPLY_TO || 'halo@cipansor.or.id';

      const info = await transporter.sendMail({
        from: fromAddress,
        replyTo: replyToAddress,
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
   * Route a message to an EXTERNAL channel (email/SMS/WhatsApp) without
   * creating an in-app Notification row — used by notifications.service,
   * which has already persisted the in-app record and now fans out to the
   * external channels listed on it.
   */
  async dispatchExternal(options: SendNotificationOptions): Promise<NotificationResult> {
    switch (options.channel) {
      case 'EMAIL':
        return this.sendEmail(options);
      case 'SMS':
        return this.sendSMS(options);
      case 'WHATSAPP':
        return this.sendWhatsApp(options);
      default:
        return { success: false, channel: options.channel, error: 'Not an external channel' };
    }
  }

  /**
   * Send a WhatsApp message through the module's multi-provider WhatsApp
   * service (whatsapp.service.ts). Default provider is Meta's WhatsApp
   * Business Cloud API — direct, no BSP middleman; configure via
   * WA_PROVIDER / WA_ACCESS_TOKEN / WA_PHONE_NUMBER_ID. The SIMULATOR
   * provider (default when unconfigured) logs instead of sending.
   */
  private async sendWhatsApp(options: SendNotificationOptions): Promise<NotificationResult> {
    const { recipientPhone, message } = options;

    if (!recipientPhone) {
      return { success: false, channel: 'WHATSAPP', error: 'Recipient phone required' };
    }

    const redactedMessage = message.replace(/\b\d{4,8}\b/g, '****');
    logger.info(`[WHATSAPP] To: ${recipientPhone}, Message: ${redactedMessage}`);

    try {
      const result = await whatsAppService.sendMessage({
        to: recipientPhone,
        message,
        type: 'text',
      });
      return {
        success: result.success,
        channel: 'WHATSAPP',
        messageId: result.messageId,
        error: result.error,
      };
    } catch (error) {
      logger.error('Failed to send WhatsApp:', error);
      return {
        success: false,
        channel: 'WHATSAPP',
        error: error instanceof Error ? error.message : 'WhatsApp error',
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
