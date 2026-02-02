/**
 * Event Bus
 * Centralized event management for cross-module communication
 *
 * This module provides a typed event bus for publishing and subscribing
 * to events across different modules. It integrates with:
 * - Socket.IO for real-time client updates
 * - Redis Pub/Sub for horizontal scaling
 * - Dashboard metrics for live updates
 */

import { EventEmitter } from 'events';
import { logger } from '@/lib/logger';
import {
  broadcastAttendance,
  broadcastPayment,
  broadcastTahfidz,
  publishDashboardMetrics,
  publishDashboardAlert,
  invalidateDashboardCache,
  getCurrentDashboardMetrics,
  type AttendanceEvent,
  type PaymentEvent,
  type TahfidzEvent,
  type DashboardAlert,
} from '@/lib/realtime';
import { prisma } from '@/lib/prisma';
import { Message } from '@prisma/client';

// Event Types
export interface AppEvents {
  // Message Events
  'message:sent': Message;

  // Attendance Events
  'attendance:created': AttendanceCreatedEvent;
  'attendance:updated': AttendanceUpdatedEvent;
  'attendance:bulk-created': AttendanceBulkCreatedEvent;

  // Tahfidz Events
  'tahfidz:created': TahfidzCreatedEvent;
  'tahfidz:updated': TahfidzUpdatedEvent;
  'tahfidz:milestone': TahfidzMilestoneEvent;
  'tahfidz:hafidz-completed': HafidzCompletedEvent;

  // Finance Events
  'finance:payment-received': PaymentReceivedEvent;
  'finance:invoice-created': InvoiceCreatedEvent;
  'finance:invoice-overdue': InvoiceOverdueEvent;

  // Student Events
  'student:created': StudentCreatedEvent;
  'student:updated': StudentUpdatedEvent;
  'student:graduated': StudentGraduatedEvent;
  'student:transferred': StudentTransferredEvent;

  // Notification Events
  'notification:send': NotificationSendEvent;

  // Dashboard Events
  'dashboard:refresh': DashboardRefreshEvent;
  'dashboard:alert': DashboardAlertEvent;

  // Health Events
  'health:medical-record-created': HealthMedicalRecordCreatedEvent;
}

// Event Payload Types
export interface HealthMedicalRecordCreatedEvent {
  id: string;
  studentId: string;
  studentName: string;
  unitId: string;
  unitName: string;
  type: string;
  complaint: string;
  status: string;
  recordedAt: Date;
}

export interface AttendanceCreatedEvent {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  unitId: string;
  unitName: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'SICK';
  date: Date;
  recordedById: string;
}

export interface AttendanceUpdatedEvent extends AttendanceCreatedEvent {
  previousStatus?: string;
}

export interface AttendanceBulkCreatedEvent {
  classId: string;
  className: string;
  unitId: string;
  date: Date;
  count: number;
  presentCount: number;
  absentCount: number;
}

export interface TahfidzCreatedEvent {
  id: string;
  studentId: string;
  studentName: string;
  unitId: string;
  unitName: string;
  activityType: 'ZIYADAH' | 'MUROJAAH' | 'TASMI';
  surahName: string;
  surahNumber: number;
  ayahStart: number;
  ayahEnd: number;
  totalAyah: number;
  juz?: number;
  score?: number;
  recordedById: string;
  recordedAt: Date;
}

export interface TahfidzUpdatedEvent extends TahfidzCreatedEvent {}

export interface TahfidzMilestoneEvent {
  studentId: string;
  studentName: string;
  unitId: string;
  unitName: string;
  milestoneType: 'juz_complete' | 'surah_complete' | 'half_quran' | 'full_quran';
  juzNumber?: number;
  surahNumber?: number;
  totalJuz: number;
  totalAyah: number;
}

export interface HafidzCompletedEvent {
  studentId: string;
  studentName: string;
  unitId: string;
  unitName: string;
  completedAt: Date;
  totalDays: number;
}

export interface PaymentReceivedEvent {
  id: string;
  invoiceId: string;
  studentId: string;
  studentName: string;
  unitId: string;
  unitName: string;
  amount: number;
  paymentMethod: string;
  paidAt: Date;
  processedById: string;
}

export interface InvoiceCreatedEvent {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  unitId: string;
  amount: number;
  dueDate: Date;
  description: string;
}

export interface InvoiceOverdueEvent {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  unitId: string;
  amount: number;
  dueDate: Date;
  daysOverdue: number;
}

export interface StudentCreatedEvent {
  id: string;
  name: string;
  unitId: string;
  unitName: string;
  classId?: string;
  className?: string;
}

export interface StudentUpdatedEvent extends StudentCreatedEvent {
  changes: string[];
}

export interface StudentGraduatedEvent {
  id: string;
  name: string;
  unitId: string;
  unitName: string;
  graduationDate: Date;
}

export interface StudentTransferredEvent {
  id: string;
  name: string;
  fromUnitId: string;
  fromUnitName: string;
  toUnitId: string;
  toUnitName: string;
  transferDate: Date;
}

export interface NotificationSendEvent {
  userId?: string;
  userIds?: string[];
  unitId?: string;
  broadcast?: boolean;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
}

export interface DashboardRefreshEvent {
  unitId?: string;
  reason: string;
}

export interface DashboardAlertEvent {
  id: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  unitId?: string;
}

/**
 * Typed Event Emitter
 */
class TypedEventEmitter extends EventEmitter {
  emit<K extends keyof AppEvents>(event: K, payload: AppEvents[K]): boolean {
    return super.emit(event, payload);
  }

  on<K extends keyof AppEvents>(event: K, listener: (payload: AppEvents[K]) => void): this {
    return super.on(event, listener);
  }

  once<K extends keyof AppEvents>(event: K, listener: (payload: AppEvents[K]) => void): this {
    return super.once(event, listener);
  }

  off<K extends keyof AppEvents>(event: K, listener: (payload: AppEvents[K]) => void): this {
    return super.off(event, listener);
  }
}

// Global event bus instance
export const eventBus = new TypedEventEmitter();

/**
 * Initialize event bus handlers
 * Sets up listeners for cross-module integration
 */
export function initializeEventBus(): void {
  logger.info('Initializing event bus...');

  // ===== ATTENDANCE EVENT HANDLERS =====

  eventBus.on('attendance:created', async (event) => {
    logger.info('Attendance created event received', { studentId: event.studentId });

    // Broadcast to WebSocket clients
    const wsEvent: AttendanceEvent = {
      studentId: event.studentId,
      studentName: event.studentName,
      status: event.status.toLowerCase() as any,
      unitName: event.unitName,
      className: event.className,
      time: event.date.toISOString(),
    };
    broadcastAttendance(wsEvent);

    // Invalidate dashboard cache for the unit
    await invalidateDashboardCache(event.unitId);

    // Refresh dashboard metrics
    const metrics = await getCurrentDashboardMetrics(event.unitId);
    await publishDashboardMetrics(metrics, event.unitId);
  });

  eventBus.on('attendance:bulk-created', async (event) => {
    logger.info('Bulk attendance created', {
      classId: event.classId,
      count: event.count,
    });

    // Invalidate and refresh dashboard
    await invalidateDashboardCache(event.unitId);
    const metrics = await getCurrentDashboardMetrics(event.unitId);
    await publishDashboardMetrics(metrics, event.unitId);
  });

  // ===== TAHFIDZ EVENT HANDLERS =====

  eventBus.on('tahfidz:created', async (event) => {
    logger.info('Tahfidz record created', {
      studentId: event.studentId,
      surah: event.surahName,
      type: event.activityType,
    });

    // Broadcast to WebSocket clients
    const wsEvent: TahfidzEvent = {
      studentId: event.studentId,
      studentName: event.studentName,
      surah: event.surahName,
      ayahCount: event.totalAyah,
      unitName: event.unitName,
      time: event.recordedAt.toISOString(),
    };
    broadcastTahfidz(wsEvent);

    // Check for milestones
    await checkTahfidzMilestones(event.studentId, event.unitId);

    // Invalidate dashboard cache
    await invalidateDashboardCache(event.unitId);
  });

  eventBus.on('tahfidz:milestone', async (event) => {
    logger.info('Tahfidz milestone achieved', {
      studentId: event.studentId,
      milestone: event.milestoneType,
    });

    // Create notification for the achievement
    eventBus.emit('notification:send', {
      userId: event.studentId,
      type: 'TAHFIDZ',
      title: 'Pencapaian Tahfidz!',
      message: getMilestoneMessage(event),
      data: { milestoneType: event.milestoneType },
    });

    // Create dashboard alert for significant milestones
    if (event.milestoneType === 'full_quran') {
      const alert: DashboardAlertEvent = {
        id: `hafidz-${event.studentId}-${Date.now()}`,
        title: 'Hafidz Baru!',
        message: `${event.studentName} telah menyelesaikan hafalan 30 Juz Al-Quran`,
        severity: 'INFO',
        unitId: event.unitId,
      };
      eventBus.emit('dashboard:alert', alert);
    }
  });

  eventBus.on('tahfidz:hafidz-completed', async (event) => {
    logger.info('New Hafidz completed!', { studentId: event.studentId });

    // Refresh dashboard to update hafidz count
    await invalidateDashboardCache(event.unitId);
    const metrics = await getCurrentDashboardMetrics(event.unitId);
    await publishDashboardMetrics(metrics, event.unitId);
  });

  // ===== FINANCE EVENT HANDLERS =====

  eventBus.on('finance:payment-received', async (event) => {
    logger.info('Payment received', {
      invoiceId: event.invoiceId,
      amount: event.amount,
    });

    // Broadcast to WebSocket clients
    const wsEvent: PaymentEvent = {
      invoiceId: event.invoiceId,
      studentName: event.studentName,
      amount: event.amount,
      type: event.paymentMethod,
      unitName: event.unitName,
      time: event.paidAt.toISOString(),
    };
    broadcastPayment(wsEvent);

    // Send notification to parent
    eventBus.emit('notification:send', {
      userId: event.studentId, // Parent of student
      type: 'FINANCE',
      title: 'Pembayaran Diterima',
      message: `Pembayaran sebesar Rp ${event.amount.toLocaleString('id-ID')} telah diterima`,
      data: { invoiceId: event.invoiceId, amount: event.amount },
    });

    // Invalidate dashboard cache
    await invalidateDashboardCache(event.unitId);
  });

  eventBus.on('finance:invoice-overdue', async (event) => {
    logger.warn('Invoice overdue', {
      invoiceId: event.id,
      daysOverdue: event.daysOverdue,
    });

    // Create dashboard alert for overdue invoices
    if (event.daysOverdue >= 7) {
      const alert: DashboardAlertEvent = {
        id: `overdue-${event.id}`,
        title: 'Tagihan Jatuh Tempo',
        message: `Tagihan ${event.invoiceNumber} untuk ${event.studentName} sudah jatuh tempo ${event.daysOverdue} hari`,
        severity: event.daysOverdue >= 30 ? 'CRITICAL' : 'WARNING',
        unitId: event.unitId,
      };
      eventBus.emit('dashboard:alert', alert);
    }
  });

  // ===== STUDENT EVENT HANDLERS =====

  eventBus.on('student:created', async (event) => {
    logger.info('Student created', { studentId: event.id });

    // Refresh dashboard metrics
    await invalidateDashboardCache(event.unitId);
    const metrics = await getCurrentDashboardMetrics(event.unitId);
    await publishDashboardMetrics(metrics, event.unitId);
  });

  eventBus.on('student:graduated', async (event) => {
    logger.info('Student graduated', { studentId: event.id });

    // Refresh dashboard
    await invalidateDashboardCache(event.unitId);
  });

  // ===== DASHBOARD EVENT HANDLERS =====

  eventBus.on('dashboard:refresh', async (event) => {
    logger.info('Dashboard refresh requested', { reason: event.reason });

    await invalidateDashboardCache(event.unitId);
    const metrics = await getCurrentDashboardMetrics(event.unitId);
    await publishDashboardMetrics(metrics, event.unitId);
  });

  eventBus.on('dashboard:alert', async (event) => {
    logger.info('Dashboard alert', { title: event.title });

    const alert: DashboardAlert = {
      id: event.id,
      title: event.title,
      message: event.message,
      severity: event.severity,
      timestamp: new Date().toISOString(),
    };
    await publishDashboardAlert(alert);
  });

  // ===== HEALTH EVENT HANDLERS =====

  eventBus.on('health:medical-record-created', async (event) => {
    logger.info('Medical record created', {
      studentId: event.studentId,
      type: event.type,
    });

    // Invalidate dashboard cache to update Health/UKS stats
    await invalidateDashboardCache(event.unitId);

    // Refresh dashboard metrics
    const metrics = await getCurrentDashboardMetrics(event.unitId);
    await publishDashboardMetrics(metrics, event.unitId);
  });

  // ===== NOTIFICATION EVENT HANDLERS =====

  eventBus.on('notification:send', async (event) => {
    logger.info('Notification send requested', {
      type: event.type,
      broadcast: event.broadcast,
    });

    // This would integrate with the notifications module
    // For now, just log it - actual implementation in notifications module
    try {
      if (event.userId) {
        await prisma.notification.create({
          data: {
            userId: event.userId,
            type: event.type as any,
            title: event.title,
            message: event.message,
            data: event.data || {},
            status: 'UNREAD',
          },
        });
      }
    } catch (error) {
      logger.error('Error creating notification', { error });
    }
  });

  logger.info('Event bus initialized with cross-module handlers');
}

/**
 * Check for tahfidz milestones
 */
async function checkTahfidzMilestones(studentId: string, unitId: string): Promise<void> {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { name: true } },
        unit: { select: { name: true } },
      },
    });

    if (!student) return;

    // Get total memorized ayah for the student
    const totalAyah = await prisma.tahfidzRecord.aggregate({
      where: {
        studentId,
        activityType: 'ZIYADAH',
      },
      _sum: { totalAyah: true },
    });

    const ayahCount = totalAyah._sum.totalAyah || 0;
    const AYAH_PER_JUZ = 600;
    const totalJuz = Math.floor(ayahCount / AYAH_PER_JUZ);

    // Check for juz completion (every complete juz)
    const previousAyah = ayahCount - 1; // Rough estimate
    const previousJuz = Math.floor(previousAyah / AYAH_PER_JUZ);

    if (totalJuz > previousJuz && totalJuz > 0) {
      eventBus.emit('tahfidz:milestone', {
        studentId,
        studentName: student.user.name,
        unitId,
        unitName: student.unit?.name || '',
        milestoneType: 'juz_complete',
        juzNumber: totalJuz,
        totalJuz,
        totalAyah: ayahCount,
      });
    }

    // Check for half Quran (15 juz)
    if (totalJuz >= 15 && previousJuz < 15) {
      eventBus.emit('tahfidz:milestone', {
        studentId,
        studentName: student.user.name,
        unitId,
        unitName: student.unit?.name || '',
        milestoneType: 'half_quran',
        totalJuz,
        totalAyah: ayahCount,
      });
    }

    // Check for full Quran (30 juz)
    if (totalJuz >= 30 && previousJuz < 30) {
      eventBus.emit('tahfidz:milestone', {
        studentId,
        studentName: student.user.name,
        unitId,
        unitName: student.unit?.name || '',
        milestoneType: 'full_quran',
        totalJuz,
        totalAyah: ayahCount,
      });

      // Emit hafidz completed event
      eventBus.emit('tahfidz:hafidz-completed', {
        studentId,
        studentName: student.user.name,
        unitId,
        unitName: student.unit?.name || '',
        completedAt: new Date(),
        totalDays: 0, // Would calculate from first tahfidz record
      });
    }
  } catch (error) {
    logger.error('Error checking tahfidz milestones', { error });
  }
}

/**
 * Get milestone message
 */
function getMilestoneMessage(event: TahfidzMilestoneEvent): string {
  switch (event.milestoneType) {
    case 'juz_complete':
      return `Selamat! Anda telah menyelesaikan hafalan Juz ${event.juzNumber}`;
    case 'surah_complete':
      return `Selamat! Anda telah menyelesaikan hafalan satu surat`;
    case 'half_quran':
      return `Masya Allah! Anda telah menyelesaikan setengah Al-Quran (15 Juz)`;
    case 'full_quran':
      return `Alhamdulillah! Anda telah menyelesaikan hafalan 30 Juz Al-Quran!`;
    default:
      return 'Pencapaian baru dalam tahfidz!';
  }
}

export default eventBus;
