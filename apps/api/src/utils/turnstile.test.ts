import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readTurnstileToken, verifyTurnstileToken } from './turnstile';

/**
 * Yang diuji di sini adalah **keputusannya**, bukan kemampuan Node memanggil
 * `fetch`. Setiap kasus menjawab satu pertanyaan: dalam keadaan ini, apakah
 * pengunjung diteruskan atau dihentikan, dan atas dasar apa.
 *
 * Pembedaan yang paling mahal kalau salah adalah antara "Cloudflare menjawab
 * tidak" dan "Cloudflare tidak menjawab". Yang pertama harus menghentikan
 * permintaan; yang kedua tidak boleh, karena pemadaman di pihak ketiga akan
 * mengunci seluruh pengurus di luar portalnya sendiri.
 */

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { logger } from '@/lib/logger';

const fetchMock = vi.fn();

function siteverifyReplies(body: unknown, status = 200) {
  fetchMock.mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

beforeEach(() => {
  vi.mocked(logger.error).mockClear();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret-kunci-uji');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('verifyTurnstileToken', () => {
  it('meloloskan tanpa memanggil Cloudflare ketika kunci rahasianya kosong', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '');

    const outcome = await verifyTurnstileToken('token-apa-pun');

    expect(outcome).toEqual({ ok: true, reason: 'disabled' });
    // Yang membuktikan gerbangnya benar-benar mati, bukan sekadar longgar.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('menolak ketika tokennya tidak ada, tanpa membuang panggilan ke Cloudflare', async () => {
    const outcome = await verifyTurnstileToken(undefined);

    expect(outcome).toMatchObject({ ok: false, reason: 'missing-token' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('meloloskan ketika Cloudflare menjawab success', async () => {
    siteverifyReplies({ success: true });

    await expect(verifyTurnstileToken('token-sah')).resolves.toEqual({
      ok: true,
      reason: 'verified',
    });
  });

  it('menghentikan ketika Cloudflare menjawab tidak, dan membawa kodenya', async () => {
    siteverifyReplies({ success: false, 'error-codes': ['invalid-input-response'] });

    await expect(verifyTurnstileToken('token-palsu')).resolves.toEqual({
      ok: false,
      reason: 'rejected',
      codes: ['invalid-input-response'],
    });
  });

  it('menghentikan token yang ditukarkan dua kali (timeout-or-duplicate)', async () => {
    // Perlindungan replay dipegang Cloudflare. Uji ini memastikan kita tidak
    // diam-diam memaafkan jawabannya.
    siteverifyReplies({ success: false, 'error-codes': ['timeout-or-duplicate'] });

    const outcome = await verifyTurnstileToken('token-bekas');

    expect(outcome.ok).toBe(false);
  });

  it('MELOLOSKAN ketika siteverify tidak terjangkau', async () => {
    fetchMock.mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));

    await expect(verifyTurnstileToken('token-sah')).resolves.toEqual({
      ok: true,
      reason: 'unreachable',
    });
  });

  it('MELOLOSKAN ketika siteverify menjawab 5xx', async () => {
    siteverifyReplies({}, 502);

    await expect(verifyTurnstileToken('token-sah')).resolves.toEqual({
      ok: true,
      reason: 'unreachable',
    });
  });

  it('MELOLOSKAN ketika kunci rahasianya sendiri yang ditolak, dan menyebut namanya di log', async () => {
    // Kesalahannya milik kita, bukan milik pengunjung. Menolak pengunjung di
    // sini berarti seluruh portal tertutup gara-gara satu baris .env yang
    // salah ketik — dan tidak seorang pun akan tahu sebabnya dari layarnya.
    //
    // **Statusnya 400, bukan 200, dan itu bukan detail.** Diukur terhadap
    // Cloudflare pada 2026-09-03 dengan kunci yang benar-benar salah. Versi
    // pertama modul ini memeriksa `response.ok` sebelum membaca badannya,
    // sehingga kasus ini jatuh ke cabang "status tidak wajar" dan log-nya
    // tidak pernah menyebut TURNSTILE_SECRET_KEY. Hasilnya sama; petunjuknya
    // hilang. Karena itu uji ini memaku pesannya, bukan sekadar hasilnya.
    siteverifyReplies({ success: false, 'error-codes': ['invalid-input-secret'] }, 400);

    await expect(verifyTurnstileToken('token-sah')).resolves.toEqual({
      ok: true,
      reason: 'unreachable',
    });

    const logged = vi.mocked(logger.error).mock.calls.map((c) => String(c[0])).join('\n');
    expect(logged).toContain('TURNSTILE_SECRET_KEY');
  });

  it('mengirim secret, response dan remoteip sebagai form-urlencoded', async () => {
    siteverifyReplies({ success: true });

    await verifyTurnstileToken('token-sah', '203.0.113.7');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]! as [string, RequestInit];
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    expect(init.method).toBe('POST');

    const sent = init.body as URLSearchParams;
    expect(sent.get('secret')).toBe('secret-kunci-uji');
    expect(sent.get('response')).toBe('token-sah');
    expect(sent.get('remoteip')).toBe('203.0.113.7');
  });

  it('menghilangkan remoteip ketika IP-nya tidak diketahui', async () => {
    siteverifyReplies({ success: true });

    await verifyTurnstileToken('token-sah');

    const [, init] = fetchMock.mock.calls[0]! as [string, RequestInit];
    expect((init.body as URLSearchParams).has('remoteip')).toBe(false);
  });
});

describe('readTurnstileToken', () => {
  it('menerima nama yang dipakai klien JSON kita', () => {
    expect(readTurnstileToken({ turnstileToken: 'abc' })).toBe('abc');
  });

  it('menerima nama yang disisipkan sendiri oleh widget Cloudflare', () => {
    expect(readTurnstileToken({ 'cf-turnstile-response': 'abc' })).toBe('abc');
  });

  it('mengabaikan badan yang bukan objek, nilai kosong, dan nilai bukan string', () => {
    expect(readTurnstileToken(undefined)).toBeUndefined();
    expect(readTurnstileToken('bukan objek')).toBeUndefined();
    expect(readTurnstileToken({})).toBeUndefined();
    expect(readTurnstileToken({ turnstileToken: '' })).toBeUndefined();
    expect(readTurnstileToken({ turnstileToken: 12345 })).toBeUndefined();
  });
});
