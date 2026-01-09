'use client';

import { useEffect, useState, useCallback, ReactNode } from 'react';
import { useSocket } from '@/providers/socket-provider';
import { toast } from 'sonner';
import { Bell, MessageSquare, CreditCard, AlertTriangle, BookOpen, Calendar } from 'lucide-react';

// Notification types for real-time updates
export type RealtimeNotificationType = 
  | 'DAILY_REPORT'
  | 'PAYMENT_REMINDER'
  | 'ATTENDANCE_ALERT'
  | 'TAHFIDZ_PROGRESS'
  | 'VIOLATION'
  | 'ANNOUNCEMENT'
  | 'EVENT_REMINDER';

export interface RealtimeNotification {
  id: string;
  type: RealtimeNotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: Date;
  read: boolean;
}

// In .tsx file these JSX elements are fine, but in .ts they cause errors.
// This hook file should be renamed to .tsx if it contains JSX.
// Or we can just import the icon components and let the consumer render them.
// But keeping it simple for now, I'll remove the JSX from here and expose helper.

// Hook for real-time notifications
export function useRealtimeNotifications() {
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Subscribe to notifications
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join parent/user notification room
    socket.emit('join:notifications');

    // Listen for new notifications
    const handleNewNotification = (notification: RealtimeNotification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
      setUnreadCount((prev) => prev + 1);

      // Show toast for important notifications
      if (['VIOLATION', 'ATTENDANCE_ALERT', 'PAYMENT_REMINDER'].includes(notification.type)) {
        toast.info(notification.title, {
          description: notification.message,
        });
      }
    };

    // Listen for batch updates
    const handleBatchNotifications = (batch: RealtimeNotification[]) => {
      setNotifications(batch);
      setUnreadCount(batch.filter((n) => !n.read).length);
    };

    socket.on('notification:new', handleNewNotification);
    socket.on('notification:batch', handleBatchNotifications);

    // Request initial notifications
    socket.emit('notifications:get');

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:batch', handleBatchNotifications);
      socket.emit('leave:notifications');
    };
  }, [socket, isConnected]);

  // Mark as read
  const markAsRead = useCallback((notificationId: string) => {
    if (!socket) return;

    socket.emit('notification:read', { id: notificationId });
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, [socket]);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    if (!socket) return;

    socket.emit('notification:readAll');
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [socket]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isConnected,
  };
}

// Hook for dashboard real-time metrics updates
export function useDashboardRealtime() {
  const { socket, isConnected } = useSocket();
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit('join:dashboard');

    const handleMetricsUpdate = (data: { metrics: Record<string, number>; timestamp: string }) => {
      setMetrics(data.metrics);
      setLastUpdated(new Date(data.timestamp));
    };

    socket.on('dashboard:metrics', handleMetricsUpdate);

    return () => {
      socket.off('dashboard:metrics', handleMetricsUpdate);
      socket.emit('leave:dashboard');
    };
  }, [socket, isConnected]);

  return { metrics, lastUpdated, isConnected };
}

// Hook for attendance real-time updates
export function useAttendanceRealtime(classId?: string) {
  const { socket, isConnected } = useSocket();
  const [attendanceData, setAttendanceData] = useState<{
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    if (!socket || !isConnected || !classId) return;

    socket.emit('join:attendance', { classId });

    const handleAttendanceUpdate = (data: typeof attendanceData) => {
      setAttendanceData(data);
    };

    socket.on('attendance:update', handleAttendanceUpdate);

    return () => {
      socket.off('attendance:update', handleAttendanceUpdate);
      socket.emit('leave:attendance', { classId });
    };
  }, [socket, isConnected, classId]);

  return { attendanceData, isConnected };
}

// Hook for tahfidz progress real-time updates
export function useTahfidzRealtime(studentId?: string) {
  const { socket, isConnected } = useSocket();
  const [progress, setProgress] = useState<{
    currentJuz: number;
    lastSession: string;
    recentScore: number;
  } | null>(null);

  useEffect(() => {
    if (!socket || !isConnected || !studentId) return;

    socket.emit('join:tahfidz', { studentId });

    const handleProgressUpdate = (data: typeof progress) => {
      setProgress(data);
    };

    socket.on('tahfidz:progress', handleProgressUpdate);

    return () => {
      socket.off('tahfidz:progress', handleProgressUpdate);
      socket.emit('leave:tahfidz', { studentId });
    };
  }, [socket, isConnected, studentId]);

  return { progress, isConnected };
}
