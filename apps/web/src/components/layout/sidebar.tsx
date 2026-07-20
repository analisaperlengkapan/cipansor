"use client";

import { getEffectiveRole } from "@/lib/rbac";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  getNavigationForRole,
  getNavigationForRoleCode,
  type NavGroup,
} from "@/config/navigation";
import { useAuthStore } from "@/stores/auth";
import { ChevronLeft, LogOut } from "lucide-react";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

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

// Realm colors for badges
const realmColors: Record<string, string> = {
  GLOBAL: "bg-purple-500",
  YAYASAN: "bg-amber-500",
  TK: "bg-pink-500",
  SD_IT: "bg-green-500",
  SMP_IT: "bg-blue-500",
  SMA_ALQURAN: "bg-emerald-500",
};

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  if (typeof window !== "undefined") {
    console.log("Sidebar rendering, user:", JSON.stringify(user));
  }

  // Get active role from userRoles
  const userRoles = user?.userRoles as UserRole[] | undefined;
  const activeRole = userRoles?.find((r) => r.isPrimary) || userRoles?.[0];

  // Get navigation based on active role code or fallback to legacy role
  const navigation = activeRole
    ? getNavigationForRoleCode(activeRole.role.code)
    : user
      ? getNavigationForRole(getEffectiveRole(user) ?? user.role)
      : [];

  return (
    <div
      className={cn(
        "flex h-screen flex-col border-r sidebar-gradient transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              C
            </div>
            <span className="font-semibold">Cipansor</span>
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            C
          </div>
        )}
        {onToggle && !collapsed && (
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        {navigation.map((group, index) => (
          <NavGroupComponent
            key={group.title}
            group={group}
            pathname={pathname}
            collapsed={collapsed}
            showSeparator={index > 0}
          />
        ))}
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4">
        {!collapsed && user && (
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">{user.name}</p>
              {activeRole && (
                <div className="flex items-center gap-1">
                  <Badge
                    className={cn(
                      "text-[10px] px-1 py-0 text-white",
                      realmColors[activeRole.role.realm],
                    )}
                  >
                    {activeRole.role.realm.replace("_", " ")}
                  </Badge>
                  <span className="truncate text-xs text-muted-foreground">
                    {activeRole.role.name}
                  </span>
                </div>
              )}
              {!activeRole && (
                <p className="truncate text-xs text-muted-foreground">
                  {user.role}
                </p>
              )}
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start",
            collapsed && "justify-center px-2",
          )}
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </div>
  );
}

interface NavGroupComponentProps {
  group: NavGroup;
  pathname: string;
  collapsed: boolean;
  showSeparator: boolean;
}

function NavGroupComponent({
  group,
  pathname,
  collapsed,
  showSeparator,
}: NavGroupComponentProps) {
  return (
    <div className="mb-4">
      {showSeparator && <Separator className="mb-4" />}
      {!collapsed && (
        <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {group.title}
        </h4>
      )}
      <nav className="space-y-1">
        {group.items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start transition-all duration-200 hover:translate-x-1",
                  isActive && "active-glow bg-secondary/80 font-medium",
                  collapsed && "justify-center px-2 hover:translate-x-0",
                )}
              >
                <Icon className="h-4 w-4" />
                {!collapsed && <span className="ml-2">{item.title}</span>}
              </Button>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
