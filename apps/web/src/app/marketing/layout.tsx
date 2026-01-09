import { MainLayout } from '@/components/layout';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
