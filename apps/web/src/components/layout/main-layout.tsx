"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ProtectedRoute } from "@/components/auth/protected-route";

interface MainLayoutProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  showSidebar?: boolean;
}

import { PageTransition } from "./page-transition";

export function MainLayout({
  children,
  allowedRoles,
  showSidebar = true,
}: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      {/* Skip Link for Keyboard Accessibility */}
      <a href="#main-content" className="skip-link">
        Langsung ke konten
      </a>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        {showSidebar && (
          <div className="hidden lg:block">
            <Sidebar
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          </div>
        )}

        {/* Mobile Sidebar */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header
            onMenuClick={showSidebar ? () => setMobileOpen(true) : undefined}
          />
          <main
            id="main-content"
            className="flex-1 overflow-auto bg-muted/30 p-4 lg:p-6 premium-gradient"
            role="main"
          >
            <PageTransition>
              <div className="mx-auto max-w-7xl">{children}</div>
            </PageTransition>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
