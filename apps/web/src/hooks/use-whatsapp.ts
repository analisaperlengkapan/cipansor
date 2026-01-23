"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// ============================================
// TYPES
// ============================================

export interface WhatsAppMessage {
  to: string;
  message: string;
  type: "text" | "template";
  templateName?: string;
  templateParams?: string[];
}

export interface WhatsAppBroadcast {
  recipients: string[];
  message: string;
  templateName?: string;
  templateParams?: Record<string, string>[];
}

export interface WhatsAppStatus {
  provider: string;
  configured: boolean;
  testResult?: {
    success: boolean;
    messageId?: string;
    error?: string;
  };
}

export interface NotificationPreference {
  id: string;
  userId: string;
  channel: "WHATSAPP" | "EMAIL" | "PUSH" | "SMS";
  category: string;
  enabled: boolean;
}

// ============================================
// QUERY KEYS
// ============================================

export const whatsappKeys = {
  all: ["whatsapp"] as const,
  status: () => [...whatsappKeys.all, "status"] as const,
  preferences: () => [...whatsappKeys.all, "preferences"] as const,
};

// ============================================
// HOOKS
// ============================================

// Get WhatsApp provider status
export function useWhatsAppStatus() {
  return useQuery({
    queryKey: whatsappKeys.status(),
    queryFn: async () => {
      const response = await apiClient.get("/notifications/whatsapp/status");
      return response.data as WhatsAppStatus;
    },
  });
}

// Send single WhatsApp message
export function useSendWhatsApp() {
  return useMutation({
    mutationFn: async (data: WhatsAppMessage) => {
      const response = await apiClient.post(
        "/notifications/whatsapp/send",
        data,
      );
      return response.data;
    },
  });
}

// Broadcast WhatsApp to multiple recipients
export function useBroadcastWhatsApp() {
  return useMutation({
    mutationFn: async (data: WhatsAppBroadcast) => {
      const response = await apiClient.post(
        "/notifications/whatsapp/broadcast",
        data,
      );
      return response.data;
    },
  });
}

// Get notification preferences
export function useNotificationPreferences() {
  return useQuery({
    queryKey: whatsappKeys.preferences(),
    queryFn: async () => {
      const response = await apiClient.get("/notifications/preferences");
      return response.data.data as NotificationPreference[];
    },
  });
}

// Update notification preference
export function useUpdateNotificationPreference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const response = await apiClient.patch(
        `/notifications/preferences/${id}`,
        { enabled },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.preferences() });
    },
  });
}

// Send daily report via WhatsApp
export function useSendDailyReportWhatsApp() {
  return useMutation({
    mutationFn: async (reportId: string) => {
      const response = await apiClient.post(
        `/daily-report/${reportId}/send-whatsapp`,
      );
      return response.data;
    },
  });
}

// Send tahfidz progress via WhatsApp
export function useSendTahfidzWhatsApp() {
  return useMutation({
    mutationFn: async (progressId: string) => {
      const response = await apiClient.post(
        `/tahfidz/${progressId}/send-whatsapp`,
      );
      return response.data;
    },
  });
}
