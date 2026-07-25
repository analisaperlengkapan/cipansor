import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  ChatbotPersonaResponse,
  UpdateChatbotPersonaRequest,
} from "@cipansor/shared";

const QUERY_KEY = ["chatbot", "admin", "persona"] as const;

/**
 * The assistant's editable persona, for the super-admin settings page.
 *
 * Returns the persona in force, the code default (so the page can preview it and
 * offer a reset), and whether a custom value is saved. Super-admin only — the
 * API enforces that; the sidebar simply never shows the link to anyone else.
 */
export function useChatbotPersona() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<ChatbotPersonaResponse> => {
      const response = await api.get("/chatbot/admin/persona");
      return response.data.data;
    },
  });
}

export function useUpdateChatbotPersona() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      request: UpdateChatbotPersonaRequest,
    ): Promise<ChatbotPersonaResponse> => {
      const response = await api.put("/chatbot/admin/persona", request);
      return response.data.data;
    },
    // Seed the cache with the server's fresh state so the editor reflects the
    // saved value (and its new timestamp) without a second round trip.
    onSuccess: (data) => queryClient.setQueryData(QUERY_KEY, data),
  });
}

export function useResetChatbotPersona() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<ChatbotPersonaResponse> => {
      const response = await api.delete("/chatbot/admin/persona");
      return response.data.data;
    },
    onSuccess: (data) => queryClient.setQueryData(QUERY_KEY, data),
  });
}

export type { ChatbotPersonaResponse };
