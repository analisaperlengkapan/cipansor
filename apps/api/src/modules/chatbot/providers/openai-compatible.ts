/**
 * Provider for any OpenAI-compatible chat-completions endpoint.
 *
 * This covers Azure AI Foundry serverless deployments (DeepSeek and the rest of
 * its catalogue), Azure OpenAI, and most self-hosted gateways — they all speak
 * `POST {base}/chat/completions` with a bearer token. One implementation
 * therefore serves every candidate we might evaluate, which is the point: model
 * selection should be an env change and an eval run, not a code change.
 *
 * Deliberately implemented against `fetch` rather than a vendor SDK. The wire
 * format is small and stable, and a vendor SDK would tie the deployment to one
 * catalogue — the opposite of what §1 of the design asks for.
 */

import { config } from '@/config';
import { logger } from '@/lib/logger';
import type { LlmCompletionRequest, LlmCompletionResult, LlmProvider } from './types';

interface ChatCompletionResponse {
  choices?: { message?: { content?: string } }[];
  model?: string;
  error?: { message?: string };
}

export class OpenAiCompatibleProvider implements LlmProvider {
  readonly name = 'openai-compatible';

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly model: string,
    private readonly timeoutMs: number = config.chatbot.timeoutMs
  ) {}

  async complete(request: LlmCompletionRequest): Promise<LlmCompletionResult> {
    // An unbounded upstream call would hold the visitor's connection open for
    // as long as the provider feels like taking, and hold a worker with it.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: request.messages,
          max_tokens: request.maxTokens,
          temperature: request.temperature,
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        // Log the status, never the body: a provider error body can echo the
        // prompt back, and the prompt contains the visitor's question.
        logger.error('Chatbot provider returned an error status', {
          status: response.status,
          model: this.model,
        });
        throw new Error(`Chatbot provider responded ${response.status}`);
      }

      const body = (await response.json()) as ChatCompletionResponse;
      const text = body.choices?.[0]?.message?.content?.trim();
      if (!text) {
        throw new Error('Chatbot provider returned no content');
      }

      return { text, model: body.model ?? this.model };
    } finally {
      clearTimeout(timer);
    }
  }
}
