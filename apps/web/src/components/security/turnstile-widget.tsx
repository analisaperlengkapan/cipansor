"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Cloudflare Turnstile untuk form publik.
 *
 * Site key dibaca dari `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, yang **dibakar ke
 * dalam bundel pada waktu build**, bukan dibaca saat halaman dijalankan.
 * Menyuntingnya di `.env` produksi tidak mengubah apa pun sampai image web
 * dibangun ulang — sama seperti `NEXT_PUBLIC_SHOW_DEMO_LOGIN`.
 *
 * `??`, bukan `||`: site key yang sengaja dikosongkan berarti "matikan
 * gerbangnya", dan `||` akan melipat string kosong itu menjadi nilai bawaan.
 */
export const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

/**
 * Apakah gerbangnya menyala di build ini.
 *
 * Dipakai pemanggil untuk memutuskan apakah tombol kirim harus menunggu token.
 * Tanpa ini setiap form akan menuntut token yang tidak akan pernah datang di
 * lingkungan pengembangan dan e2e, sehingga fitur yang dimatikan akan terlihat
 * persis seperti fitur yang rusak.
 */
export function isTurnstileEnabled(): boolean {
  return TURNSTILE_SITE_KEY.length > 0;
}

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: Record<string, unknown>,
  ) => string | undefined;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/**
 * Muat skripnya sekali untuk seluruh aplikasi.
 *
 * Promise-nya disimpan di tingkat modul, bukan di dalam komponen: dua widget
 * pada satu halaman (atau satu widget yang dipasang ulang) tidak boleh
 * menyisipkan dua tag `<script>`, karena yang kedua akan mendefinisikan ulang
 * `window.turnstile` di tengah pemakaian yang pertama.
 */
let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Gagal memuat Turnstile")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      // Dibuang supaya percobaan berikutnya benar-benar mencoba lagi, bukan
      // mewarisi promise yang sudah gagal selamanya.
      scriptPromise = null;
      reject(new Error("Gagal memuat Turnstile"));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export interface TurnstileWidgetProps {
  /**
   * Dipanggil dengan token ketika tantangan selesai, dan dengan `null` ketika
   * tokennya kedaluwarsa atau widget-nya gagal — sehingga pemanggil tidak
   * pernah menyimpan token yang sudah tidak berlaku.
   */
  onToken: (token: string | null) => void;
  /**
   * Dipanggil sekali bila widget-nya tidak dapat dipakai sama sekali: skripnya
   * gagal dimuat, atau Cloudflare melaporkan galat.
   *
   * Ada supaya kegagalan ini tidak berubah menjadi penguncian. Tanpa jalan
   * keluar, tombol "Masuk" yang menunggu token akan menunggu selamanya ketika
   * `challenges.cloudflare.com` tidak terjangkau dari jaringan pengunjung —
   * dan tidak ada yang dapat dilakukan pengurus dari sisi peladen untuk
   * membukanya, karena tombolnya dikunci di peramban. Pemanggil memakai ini
   * untuk berhenti menuntut token dan membiarkan peladen yang memutuskan;
   * peladen sendiri sudah gagal-terbuka ketika Cloudflare tak terjangkau.
   */
  onUnavailable?: () => void;
  /** Label tindakan; muncul di analitik Turnstile untuk memisahkan form. */
  action?: string;
  /**
   * Naikkan angkanya untuk meminta tantangan baru. Diperlukan setelah setiap
   * pengiriman, berhasil maupun gagal: token Turnstile sekali pakai, dan
   * penukaran kedua ditolak Cloudflare dengan `timeout-or-duplicate`.
   */
  resetSignal?: number;
  className?: string;
}

export function TurnstileWidget({
  onToken,
  onUnavailable,
  action,
  resetSignal = 0,
  className,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);
  const [failed, setFailed] = useState(false);

  // Disimpan di ref supaya efek pemasangan tidak ikut berjalan ulang setiap
  // kali induknya membuat ulang fungsi callback-nya — memasang ulang widget
  // pada setiap render adalah cara paling cepat membuat tantangan tidak pernah
  // selesai.
  const onTokenRef = useRef(onToken);
  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  const onUnavailableRef = useRef(onUnavailable);
  useEffect(() => {
    onUnavailableRef.current = onUnavailable;
  }, [onUnavailable]);

  const emit = useCallback((token: string | null) => {
    onTokenRef.current(token);
  }, []);

  const giveUp = useCallback(() => {
    setFailed(true);
    onUnavailableRef.current?.();
  }, []);

  useEffect(() => {
    if (!isTurnstileEnabled()) return;
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(container, {
          sitekey: TURNSTILE_SITE_KEY,
          action,
          callback: (token: string) => emit(token),
          "expired-callback": () => emit(null),
          "timeout-callback": () => emit(null),
          "error-callback": () => {
            emit(null);
            giveUp();
          },
        });
      })
      .catch(() => {
        if (!cancelled) giveUp();
      });

    return () => {
      cancelled = true;
      const id = widgetIdRef.current;
      if (id && window.turnstile) {
        window.turnstile.remove(id);
        widgetIdRef.current = undefined;
      }
    };
  }, [action, emit, giveUp]);

  useEffect(() => {
    // 0 adalah nilai awal, bukan permintaan reset — mereset di sini akan
    // membatalkan tantangan yang baru saja selesai pada pemasangan pertama.
    if (resetSignal === 0) return;
    // Tanpa `emit(null)` di sini: setiap pemanggil sudah mengosongkan
    // tokennya sendiri sebelum menaikkan sinyalnya, dan memanggil setState
    // induk secara sinkron dari dalam efek justru memicu render beruntun.
    const id = widgetIdRef.current;
    if (id && window.turnstile) {
      window.turnstile.reset(id);
    }
  }, [resetSignal]);

  if (!isTurnstileEnabled()) return null;

  return (
    <div className={className}>
      <div ref={containerRef} />
      {failed && (
        <p className="mt-2 text-sm text-muted-foreground">
          Verifikasi keamanan tidak dapat dimuat. Periksa sambungan Anda, lalu
          muat ulang halaman.
        </p>
      )}
    </div>
  );
}
