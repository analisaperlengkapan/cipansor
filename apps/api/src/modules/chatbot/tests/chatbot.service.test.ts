import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ask, ChatbotUnavailableError, resolveProvider } from '../chatbot.service';
import { StubProvider } from '../providers/stub';
import { collectLiveFacts } from '../live-facts';
import { isCacheable, readCached, writeCached } from '../cache';
import { config } from '@/config';
import type { LlmProvider } from '../providers/types';

vi.mock('../live-facts', () => ({ collectLiveFacts: vi.fn() }));
vi.mock('../cache', () => ({
  cacheKeyFor: vi.fn(() => 'test-key'),
  isCacheable: vi.fn(() => true),
  readCached: vi.fn(async () => null),
  writeCached: vi.fn(async () => undefined),
}));
vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const mockLiveFacts = vi.mocked(collectLiveFacts);

/** Records what the service asked the model, so grounding can be asserted. */
function recordingProvider(): LlmProvider & {
  lastRequest?: Parameters<LlmProvider['complete']>[0];
} {
  const provider = {
    name: 'recording',
    lastRequest: undefined as Parameters<LlmProvider['complete']>[0] | undefined,
    async complete(request: Parameters<LlmProvider['complete']>[0]) {
      provider.lastRequest = request;
      return { text: 'jawaban', model: 'recording-model' };
    },
  };
  return provider;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockLiveFacts.mockResolvedValue([]);
});

describe('ask', () => {
  it('refuses without calling the model when nothing was retrieved', async () => {
    // Asking a model to decline politely when handed nothing is a request it
    // can decline to honour. Not calling it at all is not.
    const provider = recordingProvider();
    const result = await ask({
      question: 'siapa presiden amerika',
      provider,
      retriever: { search: () => [] },
    });

    expect(result.refused).toBe(true);
    expect(result.sources).toEqual([]);
    expect(provider.lastRequest).toBeUndefined();
  });

  it('writes that refusal in the house style, though no model produced it', async () => {
    // A visitor should not be able to tell that this particular reply never
    // reached a model. Salam, warmth, a route to a human, and an offer to
    // continue — the same shape every other answer has.
    const result = await ask({
      question: 'siapa presiden amerika',
      provider: new StubProvider(),
      retriever: { search: () => [] },
    });

    expect(result.answer).toMatch(/assalamu/i);
    expect(result.answer).toMatch(/\p{Extended_Pictographic}/u);
    expect(result.answer).toContain('0811-110-400');
    expect(result.answer).toMatch(/ada lagi yang ingin/i);
  });

  it('answers from the corpus and attributes its sources', async () => {
    const result = await ask({ question: 'apa visi pesantren', provider: new StubProvider() });

    expect(result.refused).toBe(false);
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.sources.every((s) => s.kind === 'kb')).toBe(true);
    // The stub echoes context verbatim, so a grounded answer contains it.
    expect(result.answer).toContain('Mencetak Generasi');
  });

  it('marks live lookups as such in the sources', async () => {
    mockLiveFacts.mockResolvedValue([
      { id: 'spmb-gelombang-aktif', title: 'SPMB terkini', text: 'Biaya Rp 350.000.' },
    ]);
    const result = await ask({
      question: 'berapa biaya pendaftaran',
      provider: new StubProvider(),
    });

    const live = result.sources.filter((s) => s.kind === 'live');
    expect(live).toHaveLength(1);
    expect(live[0].id).toBe('spmb-gelombang-aktif');
  });

  it('answers from a live fact even when the corpus has nothing', async () => {
    mockLiveFacts.mockResolvedValue([
      { id: 'spmb-gelombang-aktif', title: 'SPMB terkini', text: 'Pendaftaran DIBUKA.' },
    ]);
    const result = await ask({
      question: 'apakah pendaftaran dibuka',
      provider: new StubProvider(),
      retriever: { search: () => [] },
    });

    expect(result.refused).toBe(false);
    expect(result.answer).toContain('DIBUKA');
  });

  it('trims history to the configured ceiling', async () => {
    // The client sends what it likes; the context window and the bill are ours.
    const provider = recordingProvider();
    const history = Array.from({ length: 20 }, (_, i) => ({
      role: 'user' as const,
      content: `turn ${i}`,
    }));

    await ask({ question: 'visi', provider, history });

    const sent = provider.lastRequest!.messages.filter((m) => m.role !== 'system');
    // history turns + the current question
    expect(sent).toHaveLength(config.chatbot.maxHistoryTurns + 1);
    expect(sent[0].content).toBe('turn 14');
  });

  it('serves a cache hit without calling the model at all', async () => {
    // The whole point: the measured cost of a call was between 1 and 33
    // seconds of the visitor's time. A hit spends none of it.
    const cached = { answer: 'dari cache', sources: [], refused: false };
    vi.mocked(readCached).mockResolvedValueOnce(cached);
    const provider = recordingProvider();

    const result = await ask({ question: 'apa visi pesantren', provider });

    expect(result).toEqual(cached);
    expect(provider.lastRequest).toBeUndefined();
  });

  it('stores a fresh answer for the next visitor', async () => {
    await ask({ question: 'apa visi pesantren', provider: new StubProvider() });
    expect(writeCached).toHaveBeenCalledWith('test-key', expect.objectContaining({ refused: false }));
  });

  it('does not consult the cache once a conversation has history', async () => {
    vi.mocked(isCacheable).mockReturnValueOnce(false);
    const provider = recordingProvider();

    await ask({
      question: 'apa visi pesantren',
      provider,
      history: [{ role: 'user', content: 'sebelumnya' }],
    });

    expect(readCached).not.toHaveBeenCalled();
    expect(writeCached).not.toHaveBeenCalled();
    expect(provider.lastRequest).toBeDefined();
  });

  it('surfaces a provider failure as unavailable rather than an invented answer', async () => {
    const failing: LlmProvider = {
      name: 'failing',
      complete: () => Promise.reject(new Error('upstream 500')),
    };
    await expect(ask({ question: 'visi', provider: failing })).rejects.toBeInstanceOf(
      ChatbotUnavailableError
    );
  });

  it('reports unavailable when no provider is configured', async () => {
    await expect(ask({ question: 'visi', provider: null })).rejects.toBeInstanceOf(
      ChatbotUnavailableError
    );
  });
});

describe('resolveProvider', () => {
  const original = { ...config.chatbot, env: config.env };

  afterEach(() => {
    Object.assign(config.chatbot, original);
    (config as { env: string }).env = original.env;
  });

  it('is disabled by default', () => {
    Object.assign(config.chatbot, { provider: 'disabled' });
    expect(resolveProvider()).toBeNull();
  });

  it('refuses an openai-compatible provider with missing credentials', () => {
    // Half-configured must mean off, not "on and improvising".
    Object.assign(config.chatbot, {
      provider: 'openai-compatible',
      baseUrl: 'https://example.invalid',
      apiKey: undefined,
      model: 'some-model',
    });
    expect(resolveProvider()).toBeNull();
  });

  it('builds the provider when fully configured', () => {
    Object.assign(config.chatbot, {
      provider: 'openai-compatible',
      baseUrl: 'https://example.invalid',
      apiKey: 'k',
      model: 'some-model',
    });
    expect(resolveProvider()?.name).toBe('openai-compatible');
  });

  it('never selects the stub in production', () => {
    // A stub answering real visitors looks like a working service while being
    // unable to answer anything that is not a near-verbatim match — a quieter
    // failure than an outage, and a worse one.
    Object.assign(config.chatbot, { provider: 'stub' });
    (config as { env: string }).env = 'production';
    expect(resolveProvider()).toBeNull();
  });

  it('allows the stub outside production', () => {
    Object.assign(config.chatbot, { provider: 'stub' });
    (config as { env: string }).env = 'development';
    expect(resolveProvider()?.name).toBe('stub');
  });
});
