"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker (/sw.js) once, in the browser, on a secure
 * context. Kept as a tiny client component so the rest of the app tree stays
 * server-rendered. Registration is skipped in development to avoid caching the
 * dev bundle.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

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
