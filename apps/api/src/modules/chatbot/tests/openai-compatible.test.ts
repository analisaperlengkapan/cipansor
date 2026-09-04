import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { OpenAiCompatibleProvider } from '../providers/openai-compatible';

function respondWith(body: unknown) {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => body,
  }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const provider = () => new OpenAiCompatibleProvider('https://x.test/v1', 'k', 'model-a');
const request = { messages: [{ role: 'user' as const, content: 'halo' }], maxTokens: 700, temperature: 0.2 };

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllGlobals());

describe('OpenAiCompatibleProvider usage', () => {
  it('membawa pulang jumlah token yang dilaporkan penyedia', async () => {
    respondWith({
      choices: [{ message: { content: 'jawaban' } }],
      model: 'model-a-0731',
      usage: { prompt_tokens: 341, completion_tokens: 16, total_tokens: 357 },
    });

    const result = await provider().complete(request);

    expect(result.usage).toEqual({ promptTokens: 341, completionTokens: 16 });
    expect(result.model).toBe('model-a-0731');
  });

  it('tidak melaporkan nol ketika penyedianya tidak melaporkan apa pun', async () => {
    // Nol akan tercatat sebagai panggilan yang tidak berbiaya, dan sebulan
    // panggilan seperti itu akan melaporkan belanja nol sementara tagihannya
    // berkata lain. Kosong berarti "tidak terukur", dan itu ditulis ke kolom
    // tersendiri di `chatbot_usage_daily`.
    respondWith({ choices: [{ message: { content: 'jawaban' } }] });

    expect((await provider().complete(request)).usage).toBeUndefined();
  });

  it('menolak blok usage yang hanya separuh', async () => {
    respondWith({
      choices: [{ message: { content: 'jawaban' } }],
      usage: { prompt_tokens: 341 },
    });

    expect((await provider().complete(request)).usage).toBeUndefined();
  });
});
