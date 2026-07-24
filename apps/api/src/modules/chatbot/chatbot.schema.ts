import { z } from 'zod';

/**
 * The `system` role is deliberately absent from the accepted history.
 *
 * A client that could submit a system turn could rewrite the safety scaffold
 * from the browser — which is the whole attack the code-resident scaffold in
 * `prompt.ts` exists to prevent. Validation at the edge is what makes that
 * guarantee real rather than aspirational.
 */
const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(2000),
});

export const publicChatSchema = z.object({
  // Bounded because it is echoed into a prompt we pay for by the token.
  message: z.string().trim().min(2).max(1000),
  history: z.array(chatMessageSchema).max(20).optional(),
  conversationId: z.string().max(100).optional(),
});

export type PublicChatBody = z.infer<typeof publicChatSchema>;
