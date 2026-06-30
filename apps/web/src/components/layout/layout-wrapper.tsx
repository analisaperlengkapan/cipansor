"use client";

import { usePathname } from "next/navigation";
import { MainLayout } from "./main-layout";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();

  // Routes excluded from MainLayout - these render without sidebar/header
  // NOTE: Update this list when adding new public/auth routes
  const isExcluded =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/unauthorized" ||
    pathname.startsWith("/parent") ||
    pathname.startsWith("/public/") ||
    pathname.startsWith("/certificates/verify");

  if (isExcluded) {
    return <main id="main-content">{children}</main>;
  }

  return <MainLayout>{children}</MainLayout>;
}
