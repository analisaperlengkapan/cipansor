import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// Types
export type NotificationType = 
  | 'ANNOUNCEMENT'
  | 'ATTENDANCE'
  | 'FINANCE'
  | 'ACADEMIC'
  | 'PERMIT'
  | 'HEALTH'
  | 'VIOLATION'
  | 'REWARD'
  | 'SYSTEM';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH' | 'WHATSAPP';
export type RecipientType = 'ALL' | 'UNIT' | 'CLASS' | 'ROLE' | 'INDIVIDUAL';

export const NOTIFICATION_TYPES: NotificationType[] = [
  'ANNOUNCEMENT',
  'ATTENDANCE',
  'FINANCE',
  'ACADEMIC',
  'PERMIT',
  'HEALTH',
  'VIOLATION',
  'REWARD',
  'SYSTEM',
];

export const NOTIFICATION_PRIORITIES: NotificationPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
export const NOTIFICATION_CHANNELS: NotificationChannel[] = ['IN_APP', 'EMAIL', 'SMS', 'PUSH', 'WHATSAPP'];
export const RECIPIENT_TYPES: RecipientType[] = ['ALL', 'UNIT', 'CLASS', 'ROLE', 'INDIVIDUAL'];

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  ANNOUNCEMENT: 'Pengumuman',
  ATTENDANCE: 'Kehadiran',
  FINANCE: 'Keuangan',
  ACADEMIC: 'Akademik',
  PERMIT: 'Izin',
  HEALTH: 'Kesehatan',
  VIOLATION: 'Pelanggaran',
  REWARD: 'Penghargaan',
  SYSTEM: 'Sistem',
};

export const NOTIFICATION_PRIORITY_LABELS: Record<NotificationPriority, string> = {
  LOW: 'Rendah',
  NORMAL: 'Normal',
  HIGH: 'Tinggi',
  URGENT: 'Mendesak',
};

export const NOTIFICATION_CHANNEL_LABELS: Record<NotificationChannel, string> = {
  IN_APP: 'Aplikasi',
  EMAIL: 'Email',
  SMS: 'SMS',
  PUSH: 'Push Notification',
  WHATSAPP: 'WhatsApp',
};

export const RECIPIENT_TYPE_LABELS: Record<RecipientType, string> = {
  ALL: 'Semua',
  UNIT: 'Per Unit',
  CLASS: 'Per Kelas',
  ROLE: 'Per Role',
  INDIVIDUAL: 'Individual',
};

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  
  // Recipient info
  recipientType: RecipientType;
  recipientIds?: string[];
  unitId?: string;
  classId?: string;
  role?: string;
  
  // Delivery info
  sentAt?: string;
  scheduledAt?: string;
  totalRecipients: number;
  deliveredCount: number;
  readCount: number;
  failedCount?: number;
  
  // Metadata
  link?: string;
  imageUrl?: string;
  data?: Record<string, unknown>;
  
  createdById: string;
  createdBy?: {
    id: string;
    name: string;
  };
  
  recipients?: {
    id: string;
    userId: string;
    user?: {
      id: string;
      name: string;
      email?: string;
    };
    channel: NotificationChannel;
    deliveredAt?: string;
    readAt?: string;
    failedAt?: string;
    failureReason?: string;
  }[];
  
  createdAt: string;
  updatedAt: string;
}

// Keep backward compatibility alias
export type Notification = AppNotification;

export interface UserNotification {
  id: string;
  notificationId: string;
  notification?: AppNotification;
  userId: string;
  isRead: boolean;
  readAt?: string;
  isDelivered: boolean;
  deliveredAt?: string;
  channel: NotificationChannel;
  createdAt: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  titleTemplate: string;
  messageTemplate: string;
  channels: NotificationChannel[];
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  total: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
  deliveryRate: number;
  readRate: number;
  todayCount: number;
  weekCount: number;
}

// Notification queries
export function useNotifications(params?: {
  type?: NotificationType;
  priority?: NotificationPriority;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => {
      const response = await api.get('/notifications', { params });
      return response.data as {
        data: AppNotification[];
        meta: { total: number; page: number; limit: number; totalPages: number };
      };
    },
  });
}

export function useNotification(id: string) {
  return useQuery({
    queryKey: ['notification', id],
    queryFn: async () => {
      const response = await api.get(`/notifications/${id}`);
      return response.data.data as AppNotification;
    },
    enabled: !!id,
  });
}

export function useNotificationStats() {
  return useQuery({
    queryKey: ['notification-stats'],
    queryFn: async () => {
      const response = await api.get('/notifications/stats');
      return response.data.data as NotificationStats;
    },
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<AppNotification>) => {
      const response = await api.post('/notifications', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
  });
}

export function useSendNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/notifications/${id}/send`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
  });
}

export function useScheduleNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, scheduledAt }: { id: string; scheduledAt: string }) => {
      const response = await api.post(`/notifications/${id}/schedule`, { scheduledAt });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
  });
}

// User notifications (inbox)
export function useUserNotifications(params?: {
  isRead?: boolean;
  type?: NotificationType;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['user-notifications', params],
    queryFn: async () => {
      const response = await api.get('/notifications/inbox', { params });
      return response.data as {
        data: UserNotification[];
        meta: { total: number; page: number; limit: number; totalPages: number; unreadCount: number };
      };
    },
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['unread-notification-count'],
    queryFn: async () => {
      const response = await api.get('/notifications/inbox/unread-count');
      return response.data.data as { count: number };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/notifications/inbox/${id}/read`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notification-count'] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/notifications/inbox/read-all');
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notification-count'] });
    },
  });
}

// Notification templates
export function useNotificationTemplates(params?: { type?: NotificationType; isActive?: boolean }) {
  return useQuery({
    queryKey: ['notification-templates', params],
    queryFn: async () => {
      const response = await api.get('/notifications/templates', { params });
      return response.data.data as NotificationTemplate[];
    },
  });
}

export function useNotificationTemplate(id: string) {
  return useQuery({
    queryKey: ['notification-template', id],
    queryFn: async () => {
      const response = await api.get(`/notifications/templates/${id}`);
      return response.data.data as NotificationTemplate;
    },
    enabled: !!id,
  });
}

export function useCreateNotificationTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<NotificationTemplate>) => {
      const response = await api.post('/notifications/templates', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
    },
  });
}

export function useUpdateNotificationTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NotificationTemplate> }) => {
      const response = await api.put(`/notifications/templates/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
    },
  });
}

export function useDeleteNotificationTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notifications/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
    },
  });
}
