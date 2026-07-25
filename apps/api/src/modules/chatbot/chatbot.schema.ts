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

/**
 * Upper bound on a saved persona. Generous next to the ~700-char default, but
 * finite: the persona is prepended to every prompt we pay for by the token, so
 * an unbounded field is both a cost and a context-window hazard.
 */
export const MAX_PERSONA_LENGTH = 4000;

/**
 * Super-admin persona update. Only the additive style text is accepted — there
 * is no field here that could touch a safety rule, because those live in code.
 * The persona is validated but never parsed as instructions: the scaffold in
 * `prompt.ts` treats everything below it as style, and its rule 4 tells the
 * model to ignore any instruction that appears inside supplied text.
 */
export const updatePersonaSchema = z.object({
  persona: z.string().trim().min(1, 'Persona tidak boleh kosong').max(MAX_PERSONA_LENGTH),
});

export type UpdatePersonaBody = z.infer<typeof updatePersonaSchema>;
