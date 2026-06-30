"use client";

import { useAuth } from "@/hooks/use-auth";
import { useIbadahAchievements } from "@/hooks/use-ibadah";
import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Flame, Star, Award, Zap, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StudentAchievementsPage() {
  const { user } = useAuth();
  // In real app, student ID might be linked to user.id or a property
  const studentId = user?.student?.id || "current";

  const { data, isLoading } = useIbadahAchievements(studentId);

  if (isLoading) return <AchievementsSkeleton />;

  // Default values if data not found
  const achievements = data || {
    totalPoints: 1250,
    currentStreak: 5,
    level: 2,
    badges: [
      { id: '1', name: 'Mubtadi', icon: '🌱' },
      { id: '2', name: 'Pejuang Subuh', icon: '☀️' },
    ],
    nextLevelAt: 2000,
    progressToNextLevel: 25
  };

  return (
    <MainLayout>
      <PageHeader
        title="Prestasi & Level Saya"
        description="Pantau progres karakter dan ibadah harianmu"
      />

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              Level Karakter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-1">LV {achievements.level}</div>
            <p className="text-sm text-muted-foreground mb-4">{achievements.totalPoints} Total Poin</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span>Progres ke LV {achievements.level + 1}</span>
                <span>{achievements.progressToNextLevel}%</span>
              </div>
              <Progress value={achievements.progressToNextLevel} className="h-2" />
              <p className="text-[10px] text-muted-foreground text-center">
                {achievements.nextLevelAt - achievements.totalPoints} poin lagi untuk naik level
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
              Streak Ibadah
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="text-5xl font-extrabold text-orange-600 mb-1">{achievements.currentStreak}</div>
            <div className="text-sm font-medium">HARI ISTIQOMAH</div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {achievements.currentStreak > 0
                ? "Luar biasa! Pertahankan semangatmu hari ini."
                : "Ayo mulai catat ibadahmu hari ini!"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Badge Terkoleksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 pt-2">
              {achievements.badges.map((badge: any) => (
                <div
                  key={badge.id}
                  className="group relative flex flex-col items-center p-3 border rounded-xl bg-muted/30 hover:bg-primary/5 hover:border-primary/30 transition-all cursor-help"
                  title={badge.name}
                >
                  <span className="text-3xl mb-1">{badge.icon}</span>
                  <span className="text-[10px] font-bold text-center leading-tight uppercase tracking-tighter">
                    {badge.name}
                  </span>
                </div>
              ))}
              <div className="flex flex-col items-center p-3 border border-dashed rounded-xl opacity-40">
                <Zap className="h-6 w-6 mb-1 text-muted-foreground" />
                <span className="text-[10px] font-medium">???</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Misi Karakter</CardTitle>
            <CardDescription>Selesaikan misi untuk mendapat poin tambahan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <MissionItem
              title="Sholat Jamaah 7 Hari"
              progress={85}
              points={500}
              icon={<Target className="h-4 w-4" />}
            />
            <MissionItem
              title="Khatam 1 Juz Pekan Ini"
              progress={40}
              points={300}
              icon={<Award className="h-4 w-4" />}
            />
            <MissionItem
              title="Sedekah Jum'at Berkah"
              progress={0}
              points={100}
              icon={<Star className="h-4 w-4" />}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analitik Karakter</CardTitle>
            <CardDescription>Grafik pertumbuhan karakter mingguan</CardDescription>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center border rounded-lg m-4 bg-muted/10">
            <div className="text-center text-muted-foreground">
              <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm italic">Grafik Karakter Sedang Disiapkan</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

function MissionItem({ title, progress, points, icon }: any) {
  return (
    <div className="space-y-2 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-1.5 rounded-full text-primary">
            {icon}
          </div>
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <Badge variant="outline" className="text-xs">+{points} Poin</Badge>
      </div>
      <Progress value={progress} className="h-1.5" />
    </div>
  );
}

function AchievementsSkeleton() {
  return (
    <MainLayout>
      <PageHeader title="Memuat Prestasi..." description="Sabar ya, lagi menghitung pahala :)" />
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </MainLayout>
  );
}
