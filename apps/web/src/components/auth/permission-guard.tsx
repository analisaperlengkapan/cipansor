"use client";

import { ReactNode } from "react";
import { usePermission } from "@/hooks/use-permission";

interface PermissionGuardProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({
  permission,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const hasAccess = usePermission(permission);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
