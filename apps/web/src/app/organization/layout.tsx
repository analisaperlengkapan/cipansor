import { MainLayout } from "@/components/layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <MainLayout allowedRoles={["SUPER_ADMIN", "YAYASAN_ADMIN"]}>{children}</MainLayout>;
}
