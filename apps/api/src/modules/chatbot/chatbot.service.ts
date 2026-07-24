/**
 * Public chatbot orchestration: retrieve → ground → answer → attribute.
 *
 * Phase 1 serves anonymous visitors only. There is no user, so there is nothing
 * to authorise and nothing private within reach — the assistant can only see
 * the knowledge base (derived from public site constants) and the public
 * admission projection. That is what makes it safe to ship first.
 *
 * See docs/planning/chatbot-design.md §8 for why the authenticated assistant
 * waits, and §2 for the rule it must follow when it arrives.
 */

import { siteConfig } from '@cipansor/shared';
import type { ChatMessage, ChatSource, PublicChatResponse } from '@cipansor/shared';
import { config } from '@/config';
import { logger } from '@/lib/logger';
import { defaultRetriever, type Retriever } from './retrieval';
import { collectLiveFacts } from './live-facts';
import { buildMessages, DEFAULT_PERSONA } from './prompt';
import { cacheKeyFor, isCacheable, readCached, writeCached } from './cache';
import type { LlmProvider } from './providers/types';
import { OpenAiCompatibleProvider } from './providers/openai-compatible';
import { StubProvider } from './providers/stub';

export class ChatbotUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChatbotUnavailableError';
  }
}

/**
 * Builds the configured provider, or returns null when the assistant is off.
 *
 * The stub is refused outside development on purpose: it answers by echoing
 * retrieved text, which reads like a working service while being unable to
 * handle any question that is not a near-verbatim match. Shipping that to real
 * visitors would be a quieter failure than an outage, and a worse one.
 */
export function resolveProvider(): LlmProvider | null {
  const { provider, baseUrl, apiKey, model } = config.chatbot;

  switch (provider) {
    case 'disabled':
      return null;

    case 'stub':
      if (config.env === 'production') {
        logger.error('CHATBOT_PROVIDER=stub is not permitted in production; chatbot disabled');
        return null;
      }
      return new StubProvider();

    case 'openai-compatible': {
      if (!baseUrl || !apiKey || !model) {
        logger.error(
          'CHATBOT_PROVIDER=openai-compatible requires CHATBOT_API_BASE_URL, CHATBOT_API_KEY and CHATBOT_MODEL; chatbot disabled'
        );
        return null;
      }
      return new OpenAiCompatibleProvider(baseUrl, apiKey, model);
    }

    default:
      logger.error('Unknown CHATBOT_PROVIDER; chatbot disabled', { provider });
      return null;
  }
}

export interface AskOptions {
  question: string;
  history?: ChatMessage[];
  /** Injected in tests; production resolves from config. */
  provider?: LlmProvider | null;
  retriever?: Retriever;
  /** Additive persona text. Never able to remove a safety rule — see prompt.ts. */
  persona?: string;
  now?: Date;
}

/**
 * A refusal the service produces itself, without consulting the model.
 *
 * Reached when retrieval and the live lookups both come back empty. Asking a
 * model to decline politely when it has been given nothing is a request it can
 * decline to honour; not calling it at all is not.
 */
function groundedRefusal(): PublicChatResponse {
  // Written out rather than generated so it matches the house style even though
  // no model is involved: a visitor should not be able to tell that this
  // particular reply never reached one.
  return {
    answer:
      "Assalamu'alaikum warahmatullahi wabarakatuh 🙏\n\n" +
      'Mohon maaf, untuk pertanyaan tersebut saya belum memiliki informasinya 🙏 ' +
      `Agar Bapak/Ibu mendapat jawaban yang tepat, silakan hubungi kami di ${siteConfig.contact.phone} 📞 ` +
      `atau melalui WhatsApp ${siteConfig.contact.whatsapp} 💬\n\n` +
      'Ada lagi yang ingin Bapak/Ibu tanyakan? 😊',
    sources: [],
    refused: true,
  };
}

export async function ask(options: AskOptions): Promise<PublicChatResponse> {
  const {
    question,
    history = [],
    provider = resolveProvider(),
    retriever = defaultRetriever,
    persona = config.chatbot.persona || DEFAULT_PERSONA,
    now = new Date(),
  } = options;

  if (!provider) {
    throw new ChatbotUnavailableError('Chatbot is not configured');
  }

  const chunks = retriever.search(question);
  const liveFacts = await collectLiveFacts(question, now);

  if (chunks.length === 0 && liveFacts.length === 0) {
    return groundedRefusal();
  }

  // The cache is consulted AFTER the live lookup, not before it: the live facts
  // are part of the key, which is what stops a cached answer from quoting a fee
  // or a deadline that has since changed. The lookup is one indexed query
  // against a database we already run; the model call it may save takes between
  // one and thirty-three seconds.
  const cacheKey = isCacheable(history.length) ? cacheKeyFor(question, liveFacts) : null;
  if (cacheKey) {
    const hit = await readCached(cacheKey);
    if (hit) {
      logger.debug('Chatbot cache hit');
      return hit;
    }
  }

  // Trim history server-side. The client sends what it likes; the cost and the
  // context window are ours, so the ceiling is enforced here.
  const trimmed = history.slice(-config.chatbot.maxHistoryTurns);

  const messages = buildMessages({ question, chunks, liveFacts, persona, history: trimmed });

  let result;
  try {
    result = await provider.complete({
      messages,
      maxTokens: config.chatbot.maxTokens,
      temperature: config.chatbot.temperature,
    });
  } catch (error) {
    // Log the message and name explicitly. A bare `{ error }` serialises an
    // Error to `{}`, which is what the first real provider run produced — an
    // outage report with nothing in it to act on.
    logger.error('Chatbot provider call failed', {
      provider: provider.name,
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      cause: error instanceof Error && error.cause ? String(error.cause) : undefined,
    });
    throw new ChatbotUnavailableError('Chatbot provider is unavailable');
  }

  const sources: ChatSource[] = [
    ...liveFacts.map((fact) => ({ id: fact.id, title: fact.title, kind: 'live' as const })),
    ...chunks.map(({ entry }) => ({
      id: entry.id,
      title: entry.title,
      url: entry.url,
      kind: 'kb' as const,
    })),
  ];

  const response: PublicChatResponse = {
    answer: result.text,
    sources,
    refused: false,
    model: result.model,
  };

  // Written after the answer is built, and awaited so a test can observe it.
  // A failed write is logged and swallowed inside `writeCached` — a cache that
  // is down must never become a chatbot that is down.
  if (cacheKey) await writeCached(cacheKey, response);

  return response;
}
