/**
 * Notification Scheduler Service
 * 
 * Automated notification scheduling for:
 * - Payment reminders (H-7, H-3, H-1)
 * - Attendance alerts
 * - Tahfidz progress reports
 * - Event reminders
 * - Monthly reports
 */

import { prisma } from '../../lib/prisma';
import { createNotification } from './service';
import { whatsAppService } from './whatsapp.service';
import { NotificationType, AttendanceStatus, PaymentStatus } from '@prisma/client';
import { NotificationPriority, NotificationChannel, RecipientType } from '@cipansor/shared';
import { logger } from '../../lib/logger';

interface ScheduledTask {
  id: string;
  name: string;
  schedule: string;
  enabled: boolean;
  intervalId: ReturnType<typeof setInterval> | null;
  lastRun?: Date;
}

export class SchedulerService {
  private static tasks: Map<string, ScheduledTask> = new Map();
  private static initialized = false;

  static initialize(): void {
    if (this.initialized) return;
    
    this.registerDefaultTasks();
    this.initialized = true;
    logger.info('Notification Scheduler initialized');
  }

  private static registerDefaultTasks(): void {
    // Payment reminder - check every hour, run at 8 AM
    this.registerTask(
      'payment-reminder',
      'Payment Due Reminder',
      '0 8 * * *',
      () => this.sendPaymentReminders(),
      3600000
    );

    // Attendance summary - check every hour, run at 6 PM
    this.registerTask(
      'attendance-summary',
      'Daily Attendance Summary',
      '0 18 * * *',
      () => this.sendAttendanceSummary(),
      3600000
    );

    // Tahfidz progress - check every hour, run Fridays at 4 PM
    this.registerTask(
      'tahfidz-progress',
      'Weekly Tahfidz Progress',
      '0 16 * * 5',
      () => this.sendTahfidzProgress(),
      3600000
    );

    // Event reminder - check every hour, run at 7 AM
    this.registerTask(
      'event-reminder',
      'Upcoming Event Reminder',
      '0 7 * * *',
      () => this.sendEventReminders(),
      3600000
    );

    // Monthly report - check every hour, run 1st of month at 9 AM
    this.registerTask(
      'monthly-report',
      'Monthly Progress Report',
      '0 9 1 * *',
      () => this.sendMonthlyReport(),
      3600000
    );
  }

  private static registerTask(
    id: string,
    name: string,
    schedule: string,
    handler: () => Promise<void>,
    intervalMs: number
  ): void {
    const intervalId = setInterval(async () => {
      const task = this.tasks.get(id);
      if (!task || !task.enabled) return;

      const now = new Date();
      if (!this.shouldRunTask(schedule, now)) return;

      // Check if already ran this hour
      if (task.lastRun) {
        const hoursSinceLastRun = (now.getTime() - task.lastRun.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastRun < 1) return;
      }

      logger.info('Running scheduled task: ' + name);
      task.lastRun = now;
      
      try {
        await handler();
        logger.info('Task completed: ' + name);
      } catch (error) {
        logger.error('Task failed: ' + name, error);
      }
    }, intervalMs);

    this.tasks.set(id, {
      id,
      name,
      schedule,
      enabled: true,
      intervalId,
    });
  }

  private static shouldRunTask(schedule: string, now: Date): boolean {
    const parts = schedule.split(' ');
    const minute = parts[0] === '*' ? -1 : parseInt(parts[0], 10);
    const hour = parts[1] === '*' ? -1 : parseInt(parts[1], 10);
    const day = parts[2] === '*' ? -1 : parseInt(parts[2], 10);
    const month = parts[3] === '*' ? -1 : parseInt(parts[3], 10);
    const weekday = parts[4] === '*' ? -1 : parseInt(parts[4], 10);

    if (minute !== -1 && now.getMinutes() !== minute) return false;
    if (hour !== -1 && now.getHours() !== hour) return false;
    if (day !== -1 && now.getDate() !== day) return false;
    if (month !== -1 && now.getMonth() + 1 !== month) return false;
    if (weekday !== -1 && now.getDay() !== weekday) return false;

    return true;
  }

  static startAll(): void {
    logger.info('Scheduler tasks started');
  }

  static stopAll(): void {
    this.tasks.forEach((task) => {
      if (task.intervalId) {
        clearInterval(task.intervalId);
      }
    });
    logger.info('Scheduler tasks stopped');
  }

  static enableTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (task) {
      task.enabled = true;
      return true;
    }
    return false;
  }

  static disableTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (task) {
      task.enabled = false;
      return true;
    }
    return false;
  }

  static getTaskStatus(): Array<{
    id: string;
    name: string;
    schedule: string;
    enabled: boolean;
    lastRun?: Date;
  }> {
    const statuses: Array<{
      id: string;
      name: string;
      schedule: string;
      enabled: boolean;
      lastRun?: Date;
    }> = [];

    this.tasks.forEach((task) => {
      statuses.push({
        id: task.id,
        name: task.name,
        schedule: task.schedule,
        enabled: task.enabled,
        lastRun: task.lastRun,
      });
    });

    return statuses;
  }

  // Manual trigger for testing
  static async runTask(taskId: string): Promise<void> {
    switch (taskId) {
      case 'payment-reminder':
        await this.sendPaymentReminders();
        break;
      case 'attendance-summary':
        await this.sendAttendanceSummary();
        break;
      case 'tahfidz-progress':
        await this.sendTahfidzProgress();
        break;
      case 'event-reminder':
        await this.sendEventReminders();
        break;
      case 'monthly-report':
        await this.sendMonthlyReport();
        break;
      default:
        throw new Error('Unknown task: ' + taskId);
    }
  }

  // ============== TASK HANDLERS ==============

  private static async sendPaymentReminders(): Promise<void> {
    const now = new Date();
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    // Get invoices that are PENDING or PARTIAL and due within 7 days
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        status: {
          in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL],
        },
        dueDate: {
          lte: sevenDaysLater,
          gte: now,
        },
      },
      include: {
        student: {
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        },
        paymentType: true,
      },
      take: 100,
    });

    let sentCount = 0;

    for (const invoice of unpaidInvoices) {
      const student = invoice.student;
      if (!student?.user) continue;

      const daysUntilDue = Math.ceil(
        (invoice.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      const title = 'Pengingat Pembayaran';
      const typeName = invoice.paymentType?.name || 'SPP';
      const amount = Number(invoice.amount).toLocaleString('id-ID');
      const message = 'Tagihan ' + typeName + ' sebesar Rp ' + amount + ' akan jatuh tempo dalam ' + daysUntilDue + ' hari.';

      await createNotification({
        userId: student.user.id,
        title,
        message,
        type: NotificationType.PAYMENT,
        priority: 'HIGH',
        channels: ['IN_APP', 'EMAIL'],
        recipientType: 'INDIVIDUAL',
      });

      sentCount++;
    }

    logger.info('Sent ' + sentCount + ' payment reminders');
  }

  private static async sendAttendanceSummary(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's absent records using correct model name "Attendance"
    const absentRecords = await prisma.attendance.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
        status: AttendanceStatus.ABSENT,
      },
      include: {
        student: {
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        },
      },
    });

    // Group by student
    const studentAbsences = new Map<string, { studentName: string; userId: string; count: number }>();

    for (const record of absentRecords) {
      if (!record.student?.user) continue;
      
      const existing = studentAbsences.get(record.studentId);
      if (existing) {
        existing.count++;
      } else {
        studentAbsences.set(record.studentId, {
          studentName: record.student.user.name,
          userId: record.student.user.id,
          count: 1,
        });
      }
    }

    let sentCount = 0;

    for (const data of studentAbsences.values()) {
      const title = 'Laporan Kehadiran Hari Ini';
      const message = data.studentName + ' tidak hadir pada ' + data.count + ' sesi hari ini.';

      await createNotification({
        userId: data.userId,
        title,
        message,
        type: NotificationType.ALERT,
        priority: 'HIGH',
        channels: ['IN_APP'],
        recipientType: 'INDIVIDUAL',
      });

      sentCount++;
    }

    logger.info('Sent ' + sentCount + ' attendance summaries');
  }

  private static async sendTahfidzProgress(): Promise<void> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const tahfidzRecords = await prisma.tahfidzRecord.findMany({
      where: {
        createdAt: {
          gte: oneWeekAgo,
        },
      },
      include: {
        student: {
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        },
      },
    });

    // Group by student - using correct field names: ayahStart, ayahEnd, totalAyah
    const studentProgress = new Map<string, {
      studentName: string;
      userId: string;
      totalAyat: number;
      sessions: number;
    }>();

    for (const record of tahfidzRecords) {
      if (!record.student?.user) continue;

      // Use totalAyah field from schema
      const ayatCount = record.totalAyah;
      const existing = studentProgress.get(record.studentId);

      if (existing) {
        existing.totalAyat += ayatCount;
        existing.sessions++;
      } else {
        studentProgress.set(record.studentId, {
          studentName: record.student.user.name,
          userId: record.student.user.id,
          totalAyat: ayatCount,
          sessions: 1,
        });
      }
    }

    let sentCount = 0;

    for (const data of studentProgress.values()) {
      const title = 'Laporan Tahfidz Mingguan';
      const message = 'Alhamdulillah, ' + data.studentName + ' telah menghafal ' + data.totalAyat + ' ayat minggu ini dalam ' + data.sessions + ' sesi.';

      await createNotification({
        userId: data.userId,
        title,
        message,
        type: NotificationType.ACADEMIC,
        priority: 'NORMAL',
        channels: ['IN_APP'],
        recipientType: 'INDIVIDUAL',
      });

      sentCount++;
    }

    logger.info('Sent ' + sentCount + ' tahfidz progress reports');
  }

  private static async sendEventReminders(): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const events = await prisma.calendarEvent.findMany({
      where: {
        startDate: {
          gte: tomorrow,
          lt: dayAfter,
        },
      },
    });

    if (events.length === 0) return;

    // Get active users only
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 500,
    });

    let sentCount = 0;

    for (const event of events) {
      const eventDate = new Date(event.startDate);
      const timeStr = eventDate.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const title = 'Pengingat Acara Besok';
      const locationPart = event.location ? ' di ' + event.location : '';
      const message = event.title + ' akan dilaksanakan besok pukul ' + timeStr + locationPart + '.';

      for (const user of users) {
        await createNotification({
          userId: user.id,
          title,
          message,
          type: NotificationType.REMINDER,
          priority: 'NORMAL',
          channels: ['IN_APP'],
          recipientType: 'INDIVIDUAL',
        });

        sentCount++;
      }
    }

    logger.info('Sent ' + sentCount + ' event reminders');
  }

  private static async sendMonthlyReport(): Promise<void> {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const monthName = lastMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    const students = await prisma.student.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
      take: 200,
    });

    let sentCount = 0;

    for (const student of students) {
      if (!student.user) continue;

      const studentName = student.user.name;
      const title = 'Laporan Bulanan ' + monthName;
      const message = 'Laporan progress bulanan ' + studentName + ' untuk bulan ' + monthName + ' telah tersedia. Silakan cek di portal orang tua.';

      await createNotification({
        userId: student.user.id,
        title,
        message,
        type: NotificationType.ACADEMIC,
        priority: 'NORMAL',
        channels: ['IN_APP'],
        recipientType: 'INDIVIDUAL',
      });

      sentCount++;
    }

    logger.info('Sent ' + sentCount + ' monthly reports');
  }

  // ============== BROADCAST API ==============

  static async broadcastNotification(params: {
    title: string;
    message: string;
    type: NotificationType;
    targetType: 'ALL' | 'STUDENTS' | 'TEACHERS' | 'UNIT' | 'CLASS';
    targetId?: string;
    useWhatsApp?: boolean;
  }): Promise<{ total: number; sent: number; failed: number }> {
    const { title, message, type, targetType, targetId, useWhatsApp } = params;

    let users: Array<{ id: string; phone: string | null }> = [];

    switch (targetType) {
      case 'ALL':
        users = await prisma.user.findMany({
          where: { isActive: true },
          select: { id: true, phone: true },
          take: 1000,
        });
        break;

      case 'STUDENTS': {
        const students = await prisma.student.findMany({
          where: { status: 'ACTIVE' },
          include: { user: { select: { id: true, phone: true } } },
          take: 500,
        });
        users = students
          .filter((s) => s.user !== null)
          .map((s) => ({ id: s.user!.id, phone: s.user!.phone }));
        break;
      }

      case 'TEACHERS': {
        const teachers = await prisma.teacher.findMany({
          include: { user: { select: { id: true, phone: true, isActive: true } } },
          take: 200,
        });
        users = teachers
          .filter((t) => t.user !== null && t.user.isActive)
          .map((t) => ({ id: t.user!.id, phone: t.user!.phone }));
        break;
      }

      case 'UNIT':
        if (targetId) {
          const unitStudents = await prisma.student.findMany({
            where: {
              status: 'ACTIVE',
              unitId: targetId,
            },
            include: { user: { select: { id: true, phone: true } } },
          });
          users = unitStudents
            .filter((s) => s.user !== null)
            .map((s) => ({ id: s.user!.id, phone: s.user!.phone }));
        }
        break;

      case 'CLASS':
        if (targetId) {
          const enrollments = await prisma.classEnrollment.findMany({
            where: {
              classId: targetId,
              status: 'ACTIVE',
            },
            include: {
              student: {
                include: { user: { select: { id: true, phone: true } } },
              },
            },
          });
          users = enrollments
            .filter((e) => e.student?.user !== null && e.student?.user !== undefined)
            .map((e) => ({ id: e.student.user!.id, phone: e.student.user!.phone }));
        }
        break;
    }

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      try {
        // Create in-app notification
        await createNotification({
          userId: user.id,
          title,
          message,
          type,
          priority: 'NORMAL',
          channels: ['IN_APP'],
          recipientType: 'INDIVIDUAL',
        });

        // Send via WhatsApp if enabled
        if (useWhatsApp && user.phone) {
          const waMessage = '*' + title + '*\n\n' + message;
          await whatsAppService.sendMessage({
            to: user.phone,
            message: waMessage,
            type: 'text',
          });
        }

        sent++;
      } catch (error) {
        failed++;
        logger.error('Failed to send notification to user ' + user.id, error);
      }
    }

    return {
      total: users.length,
      sent,
      failed,
    };
  }
}

// Export singleton
export const notificationScheduler = SchedulerService;
