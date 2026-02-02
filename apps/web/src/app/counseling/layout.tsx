'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const tabs = [
  { value: '/counseling', label: 'Kasus Konseling' },
  { value: '/counseling/assessments', label: 'Asesmen Psikologi' },
  { value: '/counseling/tests', label: 'Bank Alat Tes' },
];

export default function CounselingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Determine active tab (fuzzy match for sub-routes)
  // If exact match /counseling, match it.
  // If starts with /counseling/assessments, match assessments.
  // Default to /counseling

  let activeTab = '/counseling';
  if (pathname.startsWith('/counseling/assessments')) {
      activeTab = '/counseling/assessments';
  } else if (pathname.startsWith('/counseling/tests')) {
      activeTab = '/counseling/tests';
  }

  return (
    <MainLayout allowedRoles={['SUPER_ADMIN', 'UNIT_ADMIN', 'TEACHER']}>
      <div className="space-y-6">
        <div className="border-b">
          <Tabs value={activeTab} className="w-full">
            <TabsList className="bg-transparent p-0 h-auto">
              {tabs.map((tab) => (
                <Link key={tab.value} href={tab.value} passHref>
                  <TabsTrigger
                    value={tab.value}
                    className="data-[state=active]:bg-background data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3"
                  >
                    {tab.label}
                  </TabsTrigger>
                </Link>
              ))}
            </TabsList>
          </Tabs>
        </div>
        {children}
      </div>
    </MainLayout>
  );
}
