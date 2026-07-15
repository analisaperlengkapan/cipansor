"use client";

import { useAuthStore } from "@/stores/auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Receipt,
  AlertTriangle,
  Award,
  Heart,
  FileText,
  Bell,
  LogOut,
  Menu,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

const parentNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/parent",
    icon: LayoutDashboard,
  },
  {
    title: "Anak Saya",
    href: "/parent/children",
    icon: Users,
  },
  {
    title: "Keuangan",
    href: "/parent/finance",
    icon: Receipt,
  },
  {
    title: "Pelanggaran",
    href: "/parent/violations",
    icon: AlertTriangle,
  },
  {
    title: "Penghargaan",
    href: "/parent/rewards",
    icon: Award,
  },
  {
    title: "Kesehatan",
    href: "/parent/health",
    icon: Heart,
  },
  {
    title: "Izin",
    href: "/parent/permits",
    icon: FileText,
  },
  {
    title: "Pengumuman",
    href: "/parent/announcements",
    icon: Bell,
  },
];

// Sidebar content component extracted to avoid re-creation in render
const SidebarContent = ({
  user,
  handleLogout,
  pathname,
  setMobileOpen,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
  handleLogout: () => void;
  pathname: string;
  setMobileOpen: (v: boolean) => void;
}) => (
  <div className="flex h-full flex-col">
    {/* Logo */}
    <div className="flex h-16 items-center justify-center border-b px-4">
      <GraduationCap className="h-8 w-8 text-primary mr-2" />
      <span className="text-xl font-bold">Portal Orang Tua</span>
    </div>

    {/* Navigation */}
    <ScrollArea className="flex-1 px-3 py-4">
      <nav className="space-y-1">
        {parentNavItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setMobileOpen(false)}
              >
                <Icon className="h-4 w-4" />
                <span className="ml-2">{item.title}</span>
              </Button>
            </Link>
          );
        })}
      </nav>
    </ScrollArea>

    {/* User Info & Logout */}
    <div className="border-t p-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="truncate text-sm font-medium">{user?.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {user?.email}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
        <span className="ml-2">Keluar</span>
      </Button>
    </div>
  </div>
);

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/parent");
    }
    // Check if user is a parent role
    if (user && user.role !== "PARENT" && user.role !== "SUPER_ADMIN") {
      router.push("/dashboard");
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 border-r bg-background">
        <SidebarContent
          user={user}
          handleLogout={handleLogout}
          pathname={pathname}
          setMobileOpen={setMobileOpen}
        />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent
            user={user}
            handleLogout={handleLogout}
            pathname={pathname}
            setMobileOpen={setMobileOpen}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-background px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-4 ml-auto">
            <Link href="/parent/announcements">
              <Bell className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-foreground" />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-muted/30 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
