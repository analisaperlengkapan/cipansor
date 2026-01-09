'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useReceptionStats } from '@/hooks/use-reception';
import { BookOpen, Package, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

export default function ReceptionDashboardPage() {
  const { data: stats, isLoading } = useReceptionStats();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Resepsionis</h1>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard Resepsionis</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card
          className="hover:bg-muted/50 cursor-pointer transition-colors"
          onClick={() => router.push('/reception/guest-books')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamu Hari Ini</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.guestsToday || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tamu terdaftar hari ini
            </p>
          </CardContent>
        </Card>

        <Card
          className="hover:bg-muted/50 cursor-pointer transition-colors"
          onClick={() => router.push('/reception/visits')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kunjungan Aktif</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeVisits || 0}</div>
            <p className="text-xs text-muted-foreground">
              Wali santri sedang berkunjung
            </p>
          </CardContent>
        </Card>

        <Card
          className="hover:bg-muted/50 cursor-pointer transition-colors"
          onClick={() => router.push('/reception/packages')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paket Belum Diambil</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingPackages || 0}</div>
            <p className="text-xs text-muted-foreground">
              Paket santri menunggu pengambilan
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
