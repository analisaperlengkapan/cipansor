import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  ChatbotConversationDetail,
  ChatbotConversationListResponse,
  ChatMessage,
  PublicChatRequest,
  PublicChatResponse,
} from "@cipansor/shared";

/**
 * Whether the assistant is configured and reachable.
 *
 * The widget asks before rendering anything. A disabled or unconfigured
 * assistant therefore does not appear at all, rather than appearing and then
 * failing on the visitor's first question — which is the difference between a
 * feature that is off and a feature that looks broken.
 */
export function useChatbotAvailability() {
  return useQuery({
    queryKey: ["chatbot", "status"],
    queryFn: async (): Promise<boolean> => {
      const response = await api.get("/chatbot/public/status");
      return response.data?.data?.available === true;
    },
    // The answer changes only on redeploy, and a failure here should not put
    // the widget into a retry loop on every public page view.
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

export function usePublicChat() {
  return useMutation({
    mutationFn: async (
      request: PublicChatRequest,
    ): Promise<PublicChatResponse> => {
      const response = await api.post("/chatbot/public/ask", request);
      return response.data.data;
    },
  });
}

/**
 * Daftar percakapan untuk halaman riwayat (super admin).
 *
 * `keepPreviousData` sengaja tidak dipakai: berpindah halaman sambil menahan
 * baris halaman sebelumnya membuat pembacanya mengira sedang melihat data baru
 * padahal belum. Riwayat percakapan dibaca untuk memutuskan sesuatu, jadi
 * keadaan "sedang memuat" lebih baik daripada keadaan yang menyesatkan.
 */
export function useChatbotConversations(params: {
  page: number;
  pageSize?: number;
  onlyRefused?: boolean;
  search?: string;
}) {
  return useQuery({
    queryKey: ["chatbot", "conversations", params],
    queryFn: async (): Promise<ChatbotConversationListResponse> => {
      const response = await api.get("/chatbot/admin/conversations", {
        params: {
          page: params.page,
          pageSize: params.pageSize,
          onlyRefused: params.onlyRefused ? "true" : undefined,
          search: params.search || undefined,
        },
      });
      return response.data.data;
    },
  });
}

/** Satu percakapan lengkap. Tidak diambil sampai ada yang dibuka. */
export function useChatbotConversation(id: string | null) {
  return useQuery({
    queryKey: ["chatbot", "conversation", id],
    queryFn: async (): Promise<ChatbotConversationDetail> => {
      const response = await api.get(`/chatbot/admin/conversations/${id}`);
      return response.data.data;
    },
    enabled: Boolean(id),
  });
}

export type { ChatMessage, PublicChatResponse };
