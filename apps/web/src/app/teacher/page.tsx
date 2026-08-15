"use client";
import { MainLayout } from "@/components/layout";

import { useAuthStore } from "@/stores/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BookOpen,
  Users,
  Calendar,
  Bell,
  CheckCircle2,
  Clock,
  FileText,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";
import {
  useTeacherDashboard,
  getScoreDisplay,
  getScheduleStatusDisplay,
} from "@/hooks/use-teacher-dashboard";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";

function TeacherDashboardContent() {
  const { user } = useAuthStore();
  const {
    stats,
    todaySchedule,
    recentSetoran,
    classes,
    isLoading,
    isError,
    refetch,
  } = useTeacherDashboard();

  const quickActions = [
    {
      title: "Rekap Hafalan",
      description: "Kelola hafalan siswa",
      icon: BookOpen,
      href: "/tahfidz",
      color: "bg-green-500",
    },
    {
      title: "Daftar Kelas",
      description: "Lihat kelas yang diampu",
      icon: Users,
      href: "/classes",
      color: "bg-blue-500",
    },
    {
      title: "Absensi",
      description: "Rekap kehadiran",
      icon: Calendar,
      href: "/attendance",
      color: "bg-purple-500",
    },
    {
      title: "Pengumuman",
      description: "Info terbaru",
      icon: Bell,
      href: "/announcements",
      color: "bg-orange-500",
    },
  ];

  if (isLoading) {
    return <TeacherDashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Assalamu&apos;alaikum, {user?.name?.split(" ")[0] || "Ustadz/ah"}!
            👋
          </h1>
          <p className="text-muted-foreground">
            Dashboard Guru - Kelola hafalan dan pembelajaran Anda
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <div className="text-right text-sm text-muted-foreground">
            <p>
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Gagal memuat beberapa data. Klik refresh untuk mencoba lagi.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalStudents || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              dari {stats?.totalClasses || 0} kelas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Setoran Hari Ini
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.setoranToday || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.setoranToday && stats?.setoranYesterday
                ? stats.setoranToday > stats.setoranYesterday
                  ? `+${stats.setoranToday - stats.setoranYesterday} dari kemarin`
                  : stats.setoranToday < stats.setoranYesterday
                    ? `${stats.setoranToday - stats.setoranYesterday} dari kemarin`
                    : "sama dengan kemarin"
                : "setoran hari ini"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Target Tercapai
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* null means no student has a tahfidz target for the active
                year — nothing to measure against. Showing 0% there would
                read as "none of the target reached", which is a claim about
                the teacher's work that no record supports. */}
            <div className="text-2xl font-bold">
              {stats?.targetAchievement === null ||
              stats?.targetAchievement === undefined
                ? "—"
                : `${stats.targetAchievement}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.targetAchievement === null
                ? "belum ada target hafalan"
                : `${stats?.studentsWithTarget ?? 0} siswa bertarget`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Jadwal Hari Ini
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.todayScheduleCount || todaySchedule?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">sesi mengajar</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Aksi Cepat</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                  <div className={`p-2 rounded-lg ${action.color}`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Jadwal Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaySchedule && todaySchedule.length > 0 ? (
              <div className="space-y-4">
                {todaySchedule.map((item) => {
                  const statusInfo = getScheduleStatusDisplay(item.status);

                  return (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="text-sm font-medium text-muted-foreground w-14">
                        {item.time}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.activity}</p>
                        {item.room && (
                          <p className="text-xs text-muted-foreground">
                            Ruang: {item.room}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className={statusInfo.color}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Tidak ada jadwal hari ini</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Setoran Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSetoran && recentSetoran.length > 0 ? (
              <div className="space-y-4">
                {recentSetoran.map((record) => {
                  const scoreInfo = getScoreDisplay(record.score);

                  return (
                    <div
                      key={record.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {record.studentName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {record.studentName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {record.surahName}: {record.ayahStart}-
                            {record.ayahEnd}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={scoreInfo.color}>
                          {scoreInfo.label}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(record.createdAt), {
                            addSuffix: true,
                            locale: localeId,
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Belum ada setoran</p>
              </div>
            )}
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/tahfidz">Lihat Semua Setoran</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Classes Summary */}
      {classes && classes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Kelas yang Diampu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {classes.map((cls) => (
                <Link key={cls.id} href={`/classes/${cls.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{cls.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {cls.studentCount} siswa
                          </p>
                        </div>
                        <Badge variant="outline">Kelas {cls.level}</Badge>
                      </div>
                      {cls.isHomeroom && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Wali kelas
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Skeleton component for loading state
function TeacherDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-48 mt-2" />
        </div>
        <Skeleton className="h-5 w-32" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <Skeleton className="h-7 w-32 mb-4" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full mb-2" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full mb-2" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function TeacherDashboardWithShell() {
  return (
    <MainLayout>
      <TeacherDashboardContent />
    </MainLayout>
  );
}
