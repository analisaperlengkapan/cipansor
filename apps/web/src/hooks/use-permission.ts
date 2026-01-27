import { useAuth } from "./use-auth";

export const usePermission = (permission: string) => {
  const { user } = useAuth();

  // Super Admin bypass
  if (user?.role === "SUPER_ADMIN") return true;

  if (!user || !user.permissions) return false;

  return user.permissions.includes(permission);
};

export const useHasAnyPermission = (permissions: string[]) => {
  const { user } = useAuth();

  if (user?.role === "SUPER_ADMIN") return true;

  if (!user || !user.permissions) return false;

  return permissions.some((p) => user.permissions!.includes(p));
};

export const useHasAllPermissions = (permissions: string[]) => {
  const { user } = useAuth();

  if (user?.role === "SUPER_ADMIN") return true;

  if (!user || !user.permissions) return false;

  return permissions.every((p) => user.permissions!.includes(p));
};
