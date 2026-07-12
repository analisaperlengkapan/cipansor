"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker (/sw.js) once, in the browser, on a secure
 * context. Kept as a tiny client component so the rest of the app tree stays
 * server-rendered. Registration is skipped in development to avoid caching the
 * dev bundle.
 *
 * It is also skipped under browser automation (`navigator.webdriver`). A
 * navigation-intercepting service worker trips a known WebKit + Playwright bug
 * ("WebKit encountered an internal error" during navigation), which cascades
 * into flaky waitForURL/visibility failures. Real users never run with
 * `webdriver === true`, so this preserves the full PWA (install/offline)
 * experience for them while keeping the e2e suite deterministic across engines.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;
    if (navigator.webdriver) return;

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        // Non-fatal: the app works without the SW, just without offline/install.
        console.error("Service worker registration failed:", err);
      });
    };

    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
