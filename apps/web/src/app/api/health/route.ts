import { NextResponse } from "next/server";

/**
 * Lightweight health endpoint on the web origin. Used by the offline
 * detection (use-online-status / offline-banner) as a connectivity probe —
 * `navigator.onLine` alone misreports behind VPNs/proxies and in automated
 * browsers, so the client verifies with a real request against this route.
 */
export function GET() {
  return NextResponse.json({ status: "ok" });
}

export function HEAD() {
  return new Response(null, { status: 200 });
}
