/**
 * Notification Preferences Service
 * Manages user notification preferences
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface NotificationPreferences {
  userId: string;
  // Channel preferences
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  // Type preferences
  paymentReminders: boolean;
  attendanceAlerts: boolean;
  academicUpdates: boolean;
  tahfidzProgress: boolean;
  announcements: boolean;
  eventReminders: boolean;
  monthlyReports: boolean;
  // Timing
  quietHoursStart: string | null; // "22:00"
  quietHoursEnd: string | null; // "07:00"
  // Frequency
  reminderFrequency: 'DAILY' | 'WEEKLY' | 'NONE';
}

const DEFAULT_PREFERENCES: Omit<NotificationPreferences, 'userId'> = {
  emailEnabled: true,
  smsEnabled: false,
  whatsappEnabled: true,
  pushEnabled: true,
  inAppEnabled: true,
  paymentReminders: true,
  attendanceAlerts: true,
  academicUpdates: true,
  tahfidzProgress: true,
  announcements: true,
  eventReminders: true,
  monthlyReports: true,
  quietHoursStart: null,
  quietHoursEnd: null,
  reminderFrequency: 'DAILY',
};

/**
 * Get user notification preferences
 * Returns default if not set
 */
export async function getPreferences(userId: string): Promise<NotificationPreferences> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      // Use metadata field for preferences (assuming JSON field)
    },
  });

  if (!user) {
    return { userId, ...DEFAULT_PREFERENCES };
  }

  // Check if preferences exist in a separate preferences storage
  // For now, return defaults with userId
  return { userId, ...DEFAULT_PREFERENCES };
}

/**
 * Update user notification preferences
 */
export async function updatePreferences(
  userId: string,
  updates: Partial<Omit<NotificationPreferences, 'userId'>>
): Promise<NotificationPreferences> {
  const current = await getPreferences(userId);
  const updated = { ...current, ...updates };

  // In production, this would save to a preferences table or user profile
  // For now, we'll just return the merged preferences
  return updated;
}

/**
 * Reset preferences to default
 */
export async function resetPreferences(userId: string): Promise<NotificationPreferences> {
  return { userId, ...DEFAULT_PREFERENCES };
}

/**
 * Check if notification should be sent based on preferences
 */
export async function shouldSendNotification(
  userId: string,
  type: keyof Pick<
    NotificationPreferences,
    | 'paymentReminders'
    | 'attendanceAlerts'
    | 'academicUpdates'
    | 'tahfidzProgress'
    | 'announcements'
    | 'eventReminders'
    | 'monthlyReports'
  >,
  channel: 'email' | 'sms' | 'whatsapp' | 'push' | 'inApp'
): Promise<boolean> {
  const prefs = await getPreferences(userId);

  // Check if type is enabled
  if (!prefs[type]) return false;

  // Check if channel is enabled
  switch (channel) {
    case 'email':
      return prefs.emailEnabled;
    case 'sms':
      return prefs.smsEnabled;
    case 'whatsapp':
      return prefs.whatsappEnabled;
    case 'push':
      return prefs.pushEnabled;
    case 'inApp':
      return prefs.inAppEnabled;
    default:
      return false;
  }
}

/**
 * Check if currently in quiet hours
 */
export function isInQuietHours(prefs: NotificationPreferences): boolean {
  if (!prefs.quietHoursStart || !prefs.quietHoursEnd) return false;

  const now = new Date();
  const currentTime = now.getHours() * 100 + now.getMinutes();

  const [startHour, startMin] = prefs.quietHoursStart.split(':').map(Number);
  const [endHour, endMin] = prefs.quietHoursEnd.split(':').map(Number);

  const startTime = startHour * 100 + startMin;
  const endTime = endHour * 100 + endMin;

  // Handle overnight quiet hours (e.g., 22:00 - 07:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime < endTime;
  }

  return currentTime >= startTime && currentTime < endTime;
}

/**
 * Get preferences summary for display
 */
export function getPreferencesSummary(prefs: NotificationPreferences): {
  enabledChannels: string[];
  enabledNotifications: string[];
} {
  const enabledChannels: string[] = [];
  const enabledNotifications: string[] = [];

  if (prefs.emailEnabled) enabledChannels.push('Email');
  if (prefs.smsEnabled) enabledChannels.push('SMS');
  if (prefs.whatsappEnabled) enabledChannels.push('WhatsApp');
  if (prefs.pushEnabled) enabledChannels.push('Push');
  if (prefs.inAppEnabled) enabledChannels.push('In-App');

  if (prefs.paymentReminders) enabledNotifications.push('Pembayaran');
  if (prefs.attendanceAlerts) enabledNotifications.push('Kehadiran');
  if (prefs.academicUpdates) enabledNotifications.push('Akademik');
  if (prefs.tahfidzProgress) enabledNotifications.push('Tahfidz');
  if (prefs.announcements) enabledNotifications.push('Pengumuman');
  if (prefs.eventReminders) enabledNotifications.push('Kegiatan');
  if (prefs.monthlyReports) enabledNotifications.push('Laporan Bulanan');

  return { enabledChannels, enabledNotifications };
}
