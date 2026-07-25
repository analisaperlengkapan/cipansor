/**
 * Storage and resolution for the assistant's editable persona.
 *
 * The persona is the ADDITIVE tone/style layer — greeting, warmth, emoji, the
 * closing offer. It is appended below the code-resident safety scaffold in
 * `prompt.ts` and can never revoke a rule, which is exactly why it is safe to
 * let a super admin edit it. See docs/planning/chatbot-design.md §4.
 *
 * Resolution order, most specific first:
 *   1. the `public` row in `chatbot_personas` (edited from the admin UI),
 *   2. the `CHATBOT_PERSONA` env var (a deployment-level override that predates
 *      the editable field),
 *   3. the built-in `DEFAULT_PERSONA`.
 *
 * A database hiccup must never take the assistant down or silence its manners,
 * so every read falls back rather than throwing: a missing persona degrades to
 * the default voice, not to no answer.
 */

import { prisma } from '@/lib/prisma';
import { config } from '@/config';
import { logger } from '@/lib/logger';
import { DEFAULT_PERSONA } from './prompt';

/**
 * The scope of the public assistant's persona. When the authenticated agent
 * lands, per-role personas live under their role codes in the same table; the
 * public scope is the only one Phase 1 reads or writes.
 */
export const PUBLIC_SCOPE = 'public';

/** The env-level fallback, or the built-in default when it is unset. */
function fallbackPersona(): string {
  return config.chatbot.persona || DEFAULT_PERSONA;
}

/**
 * The persona the assistant should answer in right now.
 *
 * Called on the public-ask hot path (before the answer cache, because the
 * persona is part of the cache key), so it is a single indexed-row read that
 * degrades to the fallback on any error rather than failing the request.
 */
export async function resolvePublicPersona(): Promise<string> {
  try {
    const row = await prisma.chatbotPersona.findUnique({ where: { scope: PUBLIC_SCOPE } });
    if (row?.persona?.trim()) return row.persona;
  } catch (error) {
    logger.warn('Failed to load chatbot persona; using fallback voice', {
      message: error instanceof Error ? error.message : String(error),
    });
  }
  return fallbackPersona();
}

export interface PublicPersonaState {
  persona: string;
  defaultPersona: string;
  isCustom: boolean;
  updatedAt: string | null;
}

/**
 * The persona as the admin UI needs to see it: the text currently in effect,
 * the code default (to preview and to reset toward), and whether a custom value
 * has been saved.
 */
export async function getPublicPersonaState(): Promise<PublicPersonaState> {
  const row = await prisma.chatbotPersona.findUnique({ where: { scope: PUBLIC_SCOPE } });
  if (row?.persona?.trim()) {
    return {
      persona: row.persona,
      defaultPersona: DEFAULT_PERSONA,
      isCustom: true,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
  return {
    persona: fallbackPersona(),
    defaultPersona: DEFAULT_PERSONA,
    isCustom: false,
    updatedAt: null,
  };
}

/** Save (or overwrite) the custom public persona. */
export async function setPublicPersona(
  persona: string,
  updatedBy?: string
): Promise<PublicPersonaState> {
  const value = persona.trim();
  await prisma.chatbotPersona.upsert({
    where: { scope: PUBLIC_SCOPE },
    create: { scope: PUBLIC_SCOPE, persona: value, updatedBy },
    update: { persona: value, updatedBy },
  });
  return getPublicPersonaState();
}

/**
 * Drop the custom persona so the assistant falls back to the env/default voice.
 * Idempotent: resetting when nothing is saved is a no-op, not an error.
 */
export async function resetPublicPersona(): Promise<PublicPersonaState> {
  await prisma.chatbotPersona.deleteMany({ where: { scope: PUBLIC_SCOPE } });
  return getPublicPersonaState();
}
