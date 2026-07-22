"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { getEffectiveRole } from "@/lib/rbac";
import { MainLayout } from "@/components/layout/main-layout";

/**
 * The parent portal used to ship its own hand-rolled sidebar, header and
 * logout button instead of the app shell. It had drifted from
 * `config/navigation.ts`: it omitted Raport and Laporan Harian — the two
 * things parents open the portal for — and it never linked Buku Penghubung,
 * Ibadah or Pesan at all, so those pages existed but were unreachable. It also
 * skipped the header, which is where notifications, search, theme and the
 * profile menu live.
 *
 * One navigation source of truth. This layout now only keeps the role check.
 *
 * It deliberately does NOT check `isAuthenticated` itself. `zustand/persist`
 * reports `isAuthenticated: false` on the first render, before it rehydrates
 * from storage, so an unguarded check here fired on every load and pushed
 * authenticated parents to `/login` — where middleware, seeing a valid
 * session, bounced them to their dashboard, which for PARENT *is* `/parent`.
 * The visible symptom was that all thirteen `/parent/*` links landed back on
 * the portal home. `MainLayout` -> `ProtectedRoute` already handles the
 * unauthenticated case, and it waits for initialisation before redirecting.
 */
export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // `user` is null until rehydration/fetch completes — no decision to make.
    if (!user) return;
    // Resolve the effective bucket so per-unit parent RoleCodes
    // (SDIT_ORANG_TUA, …) are recognised, not just the legacy "PARENT".
    const role = getEffectiveRole(user);
    if (role !== "PARENT" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  return <MainLayout>{children}</MainLayout>;
}
