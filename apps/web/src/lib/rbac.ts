/**
 * Client-side RBAC helpers — used by `middleware.ts`, `ProtectedRoute`, and
 * the role-scoped layouts.
 *
 * Two sources of truth, both shared:
 *  - Role vocabulary & bucket grouping: `@cipansor/shared` (roles.ts), kept
 *    in sync with the backend by an API-side test.
 *  - Route access: derived from the navigation registry
 *    (`@/config/nav-registry`) — a role may open exactly the routes its menu
 *    links to (plus a few always-allowed utility routes). No second
 *    hand-maintained allow-list.
 *
 * Everything here is RoleCode-native. The six coarse `LegacyRole` buckets
 * survive only as a GROUPING (derived from the RoleCode) for pages that
 * branch on "is this an admin/teacher/student"-level distinctions.
 */

import {
  ROLE_CODE_TO_LEGACY,
  isLegacyRole,
  legacyRoleFor,
  type LegacyRole,
} from "@cipansor/shared";
import { roleCodeCanAccess } from "@/config/nav-registry";

export { ROLE_CODE_TO_LEGACY, isLegacyRole };
export type { LegacyRole };

/** Derive the legacy bucket for a RoleCode, or `undefined` if unmapped. */
export function deriveLegacyRole(roleCode: string): LegacyRole | undefined {
  return legacyRoleFor(roleCode);
}

/** Role bucket → default dashboard landing route. */
export const roleDashboardMap: Record<LegacyRole, string> = {
  SUPER_ADMIN: "/dashboard",
  UNIT_ADMIN: "/dashboard",
  TEACHER: "/teacher",
  STAFF: "/staff",
  STUDENT: "/student",
  PARENT: "/parent",
};

/** Minimal shape of the persisted user needed for RBAC decisions. */
export interface RbacUser {
  role?: string | null;
  userRoles?: Array<{
    isPrimary?: boolean;
    role?: { code?: string | null } | null;
  }> | null;
}

/**
 * Resolve the user's ACTIVE RoleCode: the primary assignment first, then the
 * first assignment. `user.role` is only consulted when it already is a
 * RoleCode (e.g. SUPER_ADMIN) — every seeded account carries assignments.
 */
export function getActiveRoleCode(
  user: RbacUser | null | undefined,
): string | undefined {
  if (!user) return undefined;

  const assignments = user.userRoles ?? [];
  const primary =
    assignments.find((a) => a?.isPrimary) ?? assignments[0] ?? undefined;
  const code = primary?.role?.code;
  if (code) return code;

  if (typeof user.role === "string" && legacyRoleFor(user.role)) {
    // A raw RoleCode sitting in user.role (SUPER_ADMIN is also a RoleCode).
    if (!isLegacyRole(user.role) || user.role === "SUPER_ADMIN") {
      return user.role;
    }
  }
  return undefined;
}

/**
 * The coarse bucket for a user (derived from the active RoleCode). Pages use
 * this for "admin vs teacher vs student"-level branching.
 */
export function getEffectiveRole(
  user: RbacUser | null | undefined,
): LegacyRole | undefined {
  const code = getActiveRoleCode(user);
  if (code) return legacyRoleFor(code);
  // No assignments: a bucket in user.role is still meaningful for grouping.
  if (user && isLegacyRole(user.role)) return user.role;
  return undefined;
}

/** Can this RoleCode open `pathname`? Derived from the nav registry. */
export function canAccessRoute(
  roleCode: string | undefined,
  pathname: string,
): boolean {
  if (!roleCode) return false;
  return roleCodeCanAccess(roleCode, pathname);
}

/** The dashboard a RoleCode should land on. */
export function getDashboardForRole(roleCode: string | undefined): string {
  if (!roleCode) return "/dashboard";
  // Pesantren educators have their own dashboard even though their coarse
  // bucket is TEACHER.
  if (
    [
      "MUSYRIF",
      "MUSYRIFAH",
      "MUHAFIDZ",
      "MUHAFIDZAH",
      "MURABBI",
      "WALI_KAMAR",
      "USTADZ",
      "PESANTREN_PENGASUH",
      "PESANTREN_DIREKTUR",
    ].includes(roleCode)
  ) {
    return "/musyrif";
  }
  const bucket = isLegacyRole(roleCode) ? roleCode : legacyRoleFor(roleCode);
  return bucket ? roleDashboardMap[bucket] : "/dashboard";
}
