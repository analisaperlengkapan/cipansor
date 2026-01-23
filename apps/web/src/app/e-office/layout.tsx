import { MainLayout } from "@/components/layout/main-layout";

export default function EOfficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
