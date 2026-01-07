'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Trophy, Activity, BookOpen, Calendar, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface TakhosusDashboardProps {
  stats?: any;
  isLoading?: boolean;
}

export function TakhosusDashboard({ stats, isLoading }: TakhosusDashboardProps) {
  if (isLoading) {
    return <div className="p-8 text-center">Loading dashboard stats...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Santri</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.active || 0} santri aktif
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai 30 Juz</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completed || 0}</div>
            <p className="text-xs text-muted-foreground">
              Alumni program
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Progress</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageProgress || 0}%</div>
            <Progress value={stats?.averageProgress || 0} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Santri Keluar</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.dropped || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total dropped out
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Menu Cepat</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">Input Murojaah</h3>
                  <p className="text-sm text-muted-foreground">Catat setoran hafalan santri</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/takhosus/murojaah">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">Jadwal Simaan</h3>
                  <p className="text-sm text-muted-foreground">Kelola ujian simaan santri</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/takhosus/simaan">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
               <p>Belum ada aktivitas terbaru.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
