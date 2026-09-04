import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));
vi.mock('../chatbot.service', () => ({
  ask: vi.fn(),
  resolveProvider: vi.fn(),
  ChatbotUnavailableError: class extends Error {},
}));
vi.mock('../transcript.service', () => ({
  recordTurn: vi.fn(),
  listConversations: vi.fn(),
  getConversation: vi.fn(),
  TRANSCRIPT_RETENTION_DAYS: 90,
}));
vi.mock('../persona.service', () => ({}));

import * as chatbotService from '../chatbot.service';
import * as transcriptService from '../transcript.service';
import { ask } from '../chatbot.controller';

const askService = vi.mocked(chatbotService.ask);
const recordTurn = vi.mocked(transcriptService.recordTurn);

function fakeRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as unknown as Response & { body: { data?: Record<string, unknown> } };
}

function fakeReq(body: Record<string, unknown>) {
  return { body } as unknown as Request;
}

beforeEach(() => {
  vi.clearAllMocks();
  recordTurn.mockResolvedValue(undefined);
});

describe('POST /chatbot/public/ask', () => {
  it('tidak pernah mengirimkan penanda cache ke peramban', async () => {
    // `cached` adalah pembukuan internal. Ia membocorkan cara kerja dalam
    // kepada siapa pun di internet tanpa memberi pengunjung apa pun, dan ia
    // ada di objek yang sama dengan jawabannya — jadi satu-satunya hal yang
    // memisahkannya adalah pelucutan di controller ini.
    askService.mockResolvedValue({
      answer: 'Rp 350.000',
      sources: [],
      refused: false,
      model: 'DeepSeek-V4-Flash',
      cached: true,
    });

    const res = fakeRes();
    await ask(fakeReq({ message: 'berapa biayanya', conversationId: 'c-1' }), res, vi.fn());

    expect(res.body.data).toEqual({
      answer: 'Rp 350.000',
      sources: [],
      refused: false,
      model: 'DeepSeek-V4-Flash',
    });
    expect(res.body.data).not.toHaveProperty('cached');
  });

  it('mencatat giliran itu ke riwayat, lengkap dengan asal jawabannya', async () => {
    askService.mockResolvedValue({
      answer: 'Rp 350.000',
      sources: [{ id: 'spmb', title: 'SPMB', kind: 'live' }],
      refused: false,
      model: 'DeepSeek-V4-Flash',
      cached: true,
    });

    await ask(
      fakeReq({ message: 'berapa biayanya', conversationId: 'c-1' }),
      fakeRes(),
      vi.fn()
    );

    expect(recordTurn).toHaveBeenCalledWith({
      clientId: 'c-1',
      question: 'berapa biayanya',
      answer: 'Rp 350.000',
      sources: [{ id: 'spmb', title: 'SPMB', kind: 'live' }],
      refused: false,
      fromCache: true,
      model: 'DeepSeek-V4-Flash',
    });
  });

  it('menandai jawaban yang benar-benar dari model sebagai bukan dari cache', async () => {
    askService.mockResolvedValue({
      answer: 'Rp 350.000',
      sources: [],
      refused: false,
      model: 'DeepSeek-V4-Flash',
    });

    await ask(fakeReq({ message: 'x', conversationId: 'c-1' }), fakeRes(), vi.fn());

    expect(recordTurn.mock.calls[0][0].fromCache).toBe(false);
  });

  it('tetap menjawab pengunjung ketika riwayatnya gagal ditulis', async () => {
    // Jawabannya dikirim sebelum riwayatnya ditulis, jadi kegagalan di bawah
    // itu tidak dapat menyentuhnya. Uji ini memerah bila urutannya pernah
    // dibalik — dan urutan terbalik itu berarti pertanyaan yang sudah terjawab
    // dengan benar berbalas galat 500.
    askService.mockResolvedValue({ answer: 'ok', sources: [], refused: false });
    recordTurn.mockRejectedValue(new Error('db down'));

    const res = fakeRes();
    const next = vi.fn();
    await ask(fakeReq({ message: 'x', conversationId: 'c-1' }), res, next);

    expect(res.body).toEqual({
      success: true,
      data: { answer: 'ok', sources: [], refused: false },
    });
    expect(next).not.toHaveBeenCalled();
  });
});
