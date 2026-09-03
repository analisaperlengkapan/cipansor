"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { siteConfig } from "@/config/site";
import { useChatbotAvailability, usePublicChat } from "@/hooks/use-chatbot";
import {
  TurnstileWidget,
  isTurnstileEnabled,
} from "@/components/security/turnstile-widget";
import type { ChatMessage, PublicChatResponse } from "@/hooks/use-chatbot";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnswerText } from "./answer-text";

/**
 * Public customer-service assistant, bottom-right of the public site.
 *
 * Mounted from `LandingFooter`, which is rendered by every public surface and
 * by nothing inside the authenticated app shell. That makes the public/private
 * boundary structural rather than a convention someone has to remember: this
 * widget cannot appear on a page behind `MainLayout` without a deliberate new
 * import, and it talks only to `/chatbot/public/*`, which serves anonymous
 * callers and reaches no user's data.
 */

interface Turn extends ChatMessage {
  sources?: PublicChatResponse["sources"];
  failed?: boolean;
}

const GREETING =
  "Assalamu'alaikum. Saya asisten informasi Pesantren Cipansor. Ada yang bisa saya bantu seputar profil, program, atau pendaftaran?";

const SUGGESTIONS = [
  "Bagaimana cara mendaftar?",
  "Berapa biaya pendaftaran?",
  "Ada unit pendidikan apa saja?",
  "Di mana alamat pesantren?",
];

export function ChatWidget() {
  const { data: available } = useChatbotAvailability();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const chat = usePublicChat();

  /**
   * Satu token per pertanyaan, dimuat ulang begitu pertanyaan terkirim.
   *
   * Endpoint ini membelanjakan uang pada setiap panggilan, jadi ia dijaga
   * seperti form publik lainnya. Yang membuatnya tetap nyaman: Turnstile
   * dalam mode terkelola menyelesaikan tantangannya sendiri tanpa klik untuk
   * hampir semua pengunjung, dan tantangan berikutnya sudah disiapkan selagi
   * orangnya mengetik pertanyaan berikutnya.
   */
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0);
  const turnstileRequired = isTurnstileEnabled();
  // Widget tidak dapat dimuat: teruskan, biarkan peladen yang memutuskan.
  const [turnstileBlocked, setTurnstileBlocked] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [turns, chat.isPending]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!available) return null;

  async function send(question: string) {
    const trimmed = question.trim();
    if (trimmed.length < 2 || chat.isPending) return;
    if (turnstileRequired && !turnstileToken && !turnstileBlocked) return;

    // Only the turns already exchanged are sent as history — never the turn
    // being added, and never anything the server did not produce.
    const history = turns
      .filter((turn) => !turn.failed)
      .map(({ role, content }) => ({ role, content }));

    setTurns((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");

    try {
      const result = await chat.mutateAsync({
        message: trimmed,
        history,
        turnstileToken: turnstileToken ?? undefined,
      });
      setTurns((prev) => [
        ...prev,
        { role: "assistant", content: result.answer, sources: result.sources },
      ]);
    } catch {
      // Never invent a fallback answer. Point at a human instead — the phone
      // number is the honest answer when the assistant cannot respond.
      setTurns((prev) => [
        ...prev,
        {
          role: "assistant",
          failed: true,
          content: `Maaf, asisten sedang tidak dapat menjawab. Silakan hubungi kami di ${siteConfig.contact.phone} atau melalui WhatsApp.`,
        },
      ]);
    } finally {
      // Tokennya sudah ditukarkan — berhasil atau tidak — jadi pertanyaan
      // berikutnya membutuhkan tantangan baru.
      setTurnstileToken(null);
      setTurnstileResetSignal((n) => n + 1);
    }
  }

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Asisten informasi Pesantren Cipansor"
          className="fixed bottom-24 right-4 z-50 flex h-[min(32rem,calc(100vh-8rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <div>
              <p className="text-sm font-semibold">Asisten {siteConfig.name}</p>
              <p className="text-xs opacity-90">
                Informasi umum &amp; pendaftaran
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup asisten"
              className="rounded-md p-1 transition-colors hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            <Bubble role="assistant">{GREETING}</Bubble>

            {turns.length === 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void send(suggestion)}
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {turns.map((turn, index) => (
              <Bubble key={index} role={turn.role} failed={turn.failed}>
                {/* Only the assistant's text is formatted. What the visitor
                    typed is echoed exactly as typed — a question containing an
                    asterisk should not come back italicised. */}
                {turn.role === "assistant" && !turn.failed ? (
                  <AnswerText>{turn.content}</AnswerText>
                ) : (
                  turn.content
                )}
                {turn.sources && turn.sources.length > 0 && (
                  // Sources are shown, not just collected. A visitor deciding
                  // where to send their child should be able to open the page
                  // an answer came from and check it.
                  <span className="mt-2 flex flex-wrap gap-x-2 gap-y-1 border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
                    <span>Sumber:</span>
                    {turn.sources.map((source) =>
                      source.url ? (
                        <a
                          key={source.id}
                          href={source.url}
                          className="underline underline-offset-2 hover:text-foreground"
                        >
                          {source.title}
                        </a>
                      ) : (
                        <span key={source.id}>{source.title}</span>
                      ),
                    )}
                  </span>
                )}
              </Bubble>
            ))}

            {chat.isPending && (
              <Bubble role="assistant">
                <Loader2
                  className="h-4 w-4 animate-spin"
                  aria-label="Sedang mengetik"
                />
              </Bubble>
            )}
          </div>

          {/*
            `interaction-only`: nol tinggi sampai Cloudflare benar-benar
            menuntut interaksi. Versi pertama memakai widget biasa dan blok
            65px-nya memakan 13% tinggi panel secara permanen, menyempitkan
            ruang percakapan demi sesuatu yang hampir tidak pernah disentuh
            pengunjung. Pembungkusnya sengaja hanya berpadding horizontal:
            sebuah div tanpa isi dan tanpa padding vertikal setingginya nol,
            jadi ia hilang sendiri tanpa perlu selector `:has()` yang belum
            tentu berlaku seperti dugaan.
          */}
          <TurnstileWidget
            action="chatbot-ask"
            appearance="interaction-only"
            size="flexible"
            onToken={setTurnstileToken}
            onUnavailable={() => setTurnstileBlocked(true)}
            resetSignal={turnstileResetSignal}
            className="px-3"
          />

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
            className="flex items-center gap-2 border-t border-border p-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={1000}
              placeholder="Tulis pertanyaan Anda…"
              aria-label="Pertanyaan"
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <Button
              type="submit"
              size="icon"
              disabled={
                chat.isPending ||
                input.trim().length < 2 ||
                (turnstileRequired && !turnstileToken && !turnstileBlocked)
              }
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Kirim</span>
            </Button>
          </form>

          <p className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
            Asisten ini hanya menjawab informasi umum dan tidak memiliki akses
            ke data pribadi.
          </p>
        </div>
      )}

      {/*
        Ikon sendirian tidak memberi tahu apa pun. Sebuah lingkaran biru
        bergambar balon percakapan bisa berarti obrolan dengan petugas, formulir
        pesan, atau nomor WhatsApp — dan pengunjung yang tidak yakin tidak
        menekannya. Pil ini menyebutkan tugasnya dengan kata kerja, lalu
        menghilang begitu panelnya terbuka karena ajakan yang sudah dituruti
        hanya menjadi penghalang.
      */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          tabIndex={-1}
          aria-hidden="true"
          className="fixed bottom-[1.85rem] right-20 z-50 hidden rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-lg transition-transform hover:scale-105 sm:block"
        >
          Ada pertanyaan? Tanya di sini
        </button>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={
          open
            ? "Tutup asisten informasi"
            : "Buka asisten informasi — tanya seputar pendaftaran dan informasi umum"
        }
        className={cn(
          "fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105",
        )}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>
    </>
  );
}

function Bubble({
  role,
  failed,
  children,
}: {
  role: "user" | "assistant";
  failed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("flex", role === "user" ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "flex max-w-[85%] flex-col whitespace-pre-wrap rounded-lg px-3 py-2 text-sm",
          role === "user"
            ? "bg-primary text-primary-foreground"
            : failed
              ? "bg-destructive/10 text-foreground"
              : "bg-muted text-foreground",
        )}
      >
        {children}
      </div>
    </div>
  );
}
