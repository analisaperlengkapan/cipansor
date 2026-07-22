"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed-until";

/**
 * The first version of this banner stored a permanent "1" under its own key.
 * Renaming the key without reading the old one meant every visitor who had
 * already dismissed it was asked again. Honoured here, and treated as
 * permanent, because that is what the user agreed to at the time.
 */
const LEGACY_DISMISS_KEY = "pwa-install-dismissed";

/** How long "X" hides the banner for. */
const SNOOZE_DAYS = 30;

/**
 * True while the user's dismissal still stands.
 *
 * Checked on every attempt to show the banner, not once on mount. Chrome
 * re-fires `beforeinstallprompt` as the user moves around, and in this app the
 * component lives in the root layout and never remounts — so a mount-time
 * check let the banner come straight back after being dismissed, on every
 * navigation. That was the reported bug.
 */
function isSnoozed(): boolean {
  try {
    if (localStorage.getItem(LEGACY_DISMISS_KEY) === "1") return true;
    const until = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return until > 0 && Date.now() < until;
  } catch {
    // Private mode or blocked storage: better to stay quiet than to nag.
    return true;
  }
}

/** Already installed — asking again would be nonsense. */
function isInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

declare global {
  interface Window {
    __installPromptEvent?: BeforeInstallPromptEvent | null;
  }
}

/**
 * Floating "install app" prompt. Appears only when the browser fires
 * `beforeinstallprompt` (i.e. the PWA is installable and not already installed)
 * and the user hasn't snoozed it. iOS Safari doesn't fire the event, so nothing
 * shows there — that's expected.
 *
 * The event itself is captured by an inline script in the document head, not
 * here: Chrome fires it once, often before hydration, so a listener attached in
 * useEffect misses it outright. This component reads whatever that script
 * stashed and also listens for late arrivals.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isInstalled()) return;

    const accept = (e: BeforeInstallPromptEvent) => {
      // Re-checked here rather than once above: this runs again every time
      // Chrome re-fires the event, long after mount.
      if (isSnoozed() || isInstalled()) return;
      setDeferred(e);
      setVisible(true);
    };

    // The event may already have fired before this component mounted.
    if (window.__installPromptEvent) {
      accept(window.__installPromptEvent);
    }

    const onReady = () => {
      if (window.__installPromptEvent) accept(window.__installPromptEvent);
    };
    const onInstalled = () => {
      window.__installPromptEvent = null;
      setVisible(false);
    };

    window.addEventListener("installpromptready", onReady);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("installpromptready", onReady);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    // The event is single-use — Chrome will not let it be prompted twice.
    window.__installPromptEvent = null;
    setDeferred(null);
    setVisible(false);
  };

  const dismiss = () => {
    try {
      localStorage.setItem(
        DISMISS_KEY,
        String(Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000),
      );
    } catch {
      // Storage unavailable. The banner still closes for this page-session;
      // dropping the click entirely would be worse than forgetting it later.
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Pasang aplikasi Cipansor"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-lg border bg-background p-4 shadow-lg sm:left-auto sm:right-4 sm:mx-0"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="Cipansor"
        className="h-10 w-10 shrink-0 rounded-lg bg-white object-contain p-1"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Pasang aplikasi Cipansor</p>
        <p className="text-xs text-muted-foreground">
          Akses lebih cepat langsung dari layar utama.
        </p>
      </div>
      <Button size="sm" onClick={install}>
        <Download className="mr-1 h-4 w-4" />
        Pasang
      </Button>
      <button
        aria-label="Tutup"
        onClick={dismiss}
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
