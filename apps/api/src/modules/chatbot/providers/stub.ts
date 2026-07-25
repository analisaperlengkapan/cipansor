/**
 * Deterministic provider for tests and local development.
 *
 * It does no reasoning. It reproduces the retrieved context and refuses when
 * there is none — which is exactly the contract the service depends on, so the
 * service, the retriever, the refusal path, the rate limiting and the HTTP
 * shape can all be tested end-to-end with no API key, no network and no
 * variance between runs.
 *
 * What it explicitly does NOT do is stand in for a real model in production.
 * `resolveProvider()` will not select it outside development, because a stub
 * answering real visitors is worse than an honest "the assistant is
 * unavailable": it looks like a working service while being unable to answer
 * anything that is not a near-verbatim match.
 */

import { CONTEXT_HEADING, NO_CONTEXT_MARKER } from '../prompt';
import type { LlmCompletionRequest, LlmCompletionResult, LlmProvider } from './types';

const REFUSAL = 'Maaf, saya belum memiliki informasi untuk menjawab pertanyaan itu.';

export class StubProvider implements LlmProvider {
  readonly name = 'stub';

  async complete(request: LlmCompletionRequest): Promise<LlmCompletionResult> {
    const system = request.messages.find((m) => m.role === 'system')?.content ?? '';

    if (system.includes(NO_CONTEXT_MARKER)) {
      return { text: REFUSAL, model: 'stub' };
    }

    // Echo the context back verbatim. A grounded answer is precisely one that
    // contains nothing the context did not, so the strictest possible stub is
    // also the most useful one for asserting groundedness.
    const context = system.split(CONTEXT_HEADING)[1]?.trim() ?? '';
    return { text: context || REFUSAL, model: 'stub' };
  }
}
