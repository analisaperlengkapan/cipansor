/**
 * Client-side RBAC helpers — the single source of truth for the web app's
 * route protection and dashboard routing (used by `middleware.ts` and the
 * role-scoped layouts).
 *
 * The backend already collapses the rich `RoleCode` vocabulary
 * (`SDIT_GURU`, `YAYASAN_BENDAHARA`, …) down to a legacy `UserRole` bucket
 * via `deriveLegacyRole()` (see `apps/api/src/middleware/auth.ts`) and ships
 * it as `user.role`. This module mirrors that mapping so the web side can
 * derive the same bucket directly from `user.userRoles[].role.code` when the
 * legacy field is absent — keeping the two vocabularies aligned without
 * forcing a big-bang migration of the ~40 pages that still read `user.role`.
 *
 * IMPORTANT: `ROLE_CODE_TO_LEGACY` must stay in sync with the backend's
 * `LEGACY_ROLE_EXPANSION`. If you add a RoleCode there, mirror it here.
 */

/** The six coarse buckets the route/dashboard maps are keyed on. */
export type LegacyRole =
  | "SUPER_ADMIN"
  | "UNIT_ADMIN"
  | "TEACHER"
  | "STAFF"
  | "STUDENT"
  | "PARENT";

const LEGACY_ROLES: readonly LegacyRole[] = [
  "SUPER_ADMIN",
  "UNIT_ADMIN",
  "TEACHER",
  "STAFF",
  "STUDENT",
  "PARENT",
];

/**
 * RoleCode → legacy bucket. Mirrors the backend `LEGACY_ROLE_EXPANSION`
 * inverted (first mapping wins). Governance Yayasan roles intentionally
 * collapse to `UNIT_ADMIN`, matching the backend.
 */
export const ROLE_CODE_TO_LEGACY: Record<string, LegacyRole> = {
  SUPER_ADMIN: "SUPER_ADMIN",

  // Yayasan governance + per-unit admins → UNIT_ADMIN
  YAYASAN_ADMIN: "UNIT_ADMIN",
  YAYASAN_PEMBINA: "UNIT_ADMIN",
  YAYASAN_KETUA: "UNIT_ADMIN",
  YAYASAN_SEKRETARIS: "UNIT_ADMIN",
  YAYASAN_BENDAHARA: "UNIT_ADMIN",
  YAYASAN_ANGGOTA: "UNIT_ADMIN",
  YAYASAN_PENGAWAS: "UNIT_ADMIN",
  TKQ_ADMIN: "UNIT_ADMIN",
  SDIT_ADMIN: "UNIT_ADMIN",
  SMPIT_ADMIN: "UNIT_ADMIN",
  SMAQ_ADMIN: "UNIT_ADMIN",

  // Teachers + kepala sekolah + pesantren educators → TEACHER
  TKQ_GURU: "TEACHER",
  SDIT_GURU: "TEACHER",
  SMPIT_GURU: "TEACHER",
  SMAQ_GURU: "TEACHER",
  TKQ_KEPALA_SEKOLAH: "TEACHER",
  SDIT_KEPALA_SEKOLAH: "TEACHER",
  SMPIT_KEPALA_SEKOLAH: "TEACHER",
  SMAQ_KEPALA_SEKOLAH: "TEACHER",
  MUSYRIF: "TEACHER",
  MUHAFIDZ: "TEACHER",
  MURABBI: "TEACHER",
  WALI_KAMAR: "TEACHER",

  // Tata usaha → STAFF
  TKQ_TATA_USAHA: "STAFF",
  SDIT_TATA_USAHA: "STAFF",
  SMPIT_TATA_USAHA: "STAFF",
  SMAQ_TATA_USAHA: "STAFF",

  // Students → STUDENT
  TKQ_SISWA: "STUDENT",
  SDIT_SISWA: "STUDENT",
  SMPIT_SISWA: "STUDENT",
  SMAQ_SISWA: "STUDENT",

  // Parents → PARENT
  TKQ_ORANG_TUA: "PARENT",
  SDIT_ORANG_TUA: "PARENT",
  SMPIT_ORANG_TUA: "PARENT",
  SMAQ_ORANG_TUA: "PARENT",
};

/** Role → default dashboard landing route. */
export const roleDashboardMap: Record<LegacyRole, string> = {
  SUPER_ADMIN: "/dashboard",
  UNIT_ADMIN: "/dashboard",
  TEACHER: "/teacher",
  STAFF: "/staff",
  STUDENT: "/student",
  PARENT: "/parent",
};

/** Role → allowed route prefixes (`"*"` = all). */
export const roleRouteAccess: Record<LegacyRole, string[]> = {
  SUPER_ADMIN: ["*"],
  UNIT_ADMIN: [
    "/dashboard",
    "/students",
    "/classes",
    "/teachers",
    "/staff",
    "/finance",
    "/tahfidz",
    "/health",
    "/permits",
    "/violations",
    "/rewards",
    "/reports",
    "/announcements",
    "/settings",
    "/daily-report",
  ],
  TEACHER: [
    "/teacher",
    "/tahfidz",
    "/classes",
    "/students",
    "/attendance",
    "/announcements",
    "/daily-report",
  ],
  STAFF: [
    "/staff",
    "/students",
    "/health",
    "/permits",
    "/violations",
    "/rewards",
    "/finance",
    "/announcements",
  ],
  STUDENT: ["/student", "/tahfidz", "/schedule", "/announcements"],
  PARENT: ["/parent"],
};

/** Type guard: is this string one of the six legacy buckets? */
export function isLegacyRole(value: unknown): value is LegacyRole {
  return (
    typeof value === "string" && LEGACY_ROLES.includes(value as LegacyRole)
  );
}

/** Derive the legacy bucket for a RoleCode, or `undefined` if unmapped. */
export function deriveLegacyRole(roleCode: string): LegacyRole | undefined {
  if (isLegacyRole(roleCode)) return roleCode;
  return ROLE_CODE_TO_LEGACY[roleCode];
}

/** Minimal shape of the persisted user needed for RBAC decisions. */
export interface RbacUser {
  role?: string | null;
  userRoles?: Array<{
    isPrimary?: boolean;
    role?: { code?: string | null } | null;
  }> | null;
}

/**
 * Resolve the effective legacy bucket for a user.
 *
 * Backward-compatible by design: the legacy `user.role` field (still emitted
 * by the backend) wins when it is a valid bucket, so existing behavior is
 * preserved exactly. Only when it is missing/invalid do we derive the bucket
 * from the primary `userRoles[].role.code` (RoleCode) — the alignment path.
 */
export function getEffectiveRole(
  user: RbacUser | null | undefined,
): LegacyRole | undefined {
  if (!user) return undefined;

  if (isLegacyRole(user.role)) return user.role;

  const assignments = user.userRoles ?? [];
  const primary =
    assignments.find((a) => a?.isPrimary) ?? assignments[0] ?? undefined;
  const code = primary?.role?.code;
  if (code) {
    const derived = deriveLegacyRole(code);
    if (derived) return derived;
  }

  // Last-ditch: a raw RoleCode sitting in `user.role`.
  if (typeof user.role === "string") {
    return deriveLegacyRole(user.role);
  }
  return undefined;
}

/** Can this role reach `pathname`? */
export function canAccessRoute(
  role: LegacyRole | undefined,
  pathname: string,
): boolean {
  if (!role) return false;
  const allowed = roleRouteAccess[role];
  if (!allowed || allowed.length === 0) return false;
  if (allowed.includes("*")) return true;
  return allowed.some((route) => pathname.startsWith(route));
}

/** The dashboard a role should land on. */
export function getDashboardForRole(role: LegacyRole | undefined): string {
  return role ? roleDashboardMap[role] : "/dashboard";
}
