"use client";

import { getEffectiveRole } from "@/lib/rbac";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { LEGACY_ROLE_EXPANSION, isLegacyRole } from "@cipansor/shared";

interface UserRole {
  id: string;
  isPrimary: boolean;
  role: {
    id: string;
    code: string;
    name: string;
    realm: string;
  };
  unit?: {
    id: string;
    name: string;
  } | null;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // Legacy role names (SUPER_ADMIN, UNIT_ADMIN, etc.)
  allowedRoleCodes?: string[]; // New role codes (SMPIT_ADMIN, PAUD_GURU, etc.)
  allowedRealms?: string[]; // Realms (GLOBAL, YAYASAN, PAUD, etc.)
}

// Map legacy roles to RoleCode categories (canonical bridge from shared)
function mapLegacyRoleToRoleCodes(legacyRole: string): string[] {
  if (isLegacyRole(legacyRole)) return LEGACY_ROLE_EXPANSION[legacyRole];
  return [legacyRole];
}

export function ProtectedRoute({
  children,
  allowedRoles,
  allowedRoleCodes,
  allowedRealms,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, fetchUser } = useAuthStore();
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    fetchUser().finally(() => setHasInitialized(true));
  }, [fetchUser]);

  useEffect(() => {
    // Only redirect after initialization is complete and auth check fails
    if (hasInitialized && !isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router, hasInitialized]);

  // Get active role from userRoles
  const activeRole = useMemo(() => {
    const userRoles = user?.userRoles as UserRole[] | undefined;
    return userRoles?.find((r) => r.isPrimary) || userRoles?.[0];
  }, [user?.userRoles]);

  // Check if user has access based on their active role
  const hasAccess = useMemo(() => {
    if (!user) return false;

    // If no restrictions, allow access
    if (!allowedRoles && !allowedRoleCodes && !allowedRealms) {
      return true;
    }

    // Get the role code to check
    const activeRoleCode = activeRole?.role.code || user.role;
    const activeRealm = activeRole?.role.realm;

    // Super Admin always has access
    if (activeRoleCode === "SUPER_ADMIN") {
      return true;
    }

    // Check realm-based access
    if (allowedRealms && activeRealm) {
      if (allowedRealms.includes(activeRealm)) {
        return true;
      }
    }

    // Check role code-based access
    if (allowedRoleCodes) {
      if (allowedRoleCodes.includes(activeRoleCode)) {
        return true;
      }
    }

    // Check legacy role-based access (with mapping)
    if (allowedRoles) {
      // First check direct match with the effective legacy role (resolves
      // RoleCode-only users the same way middleware.ts does)
      const legacyRole = getEffectiveRole(user);
      if (legacyRole && allowedRoles.includes(legacyRole)) {
        return true;
      }

      // Map legacy roles to role codes and check
      const expandedRoleCodes = allowedRoles.flatMap(mapLegacyRoleToRoleCodes);
      if (expandedRoleCodes.includes(activeRoleCode)) {
        return true;
      }
    }

    return false;
  }, [user, activeRole, allowedRoles, allowedRoleCodes, allowedRealms]);

  useEffect(() => {
    if (user && !hasAccess) {
      router.push("/unauthorized");
    }
  }, [user, hasAccess, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}
