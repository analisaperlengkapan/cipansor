import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
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

export type { ChatMessage, PublicChatResponse };
