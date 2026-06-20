"use client";
import { use } from "react";
import { safeFormat } from "@/lib/date";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { id as localeId } from "date-fns/locale";
import {
  BookOpen,
  Pencil,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Smile,
  Heart,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  useMuhasabahRecord,
  useDeleteMuhasabah,
  MUHASABAH_MOODS,
  SHOLAT_WAJIB,
  SHOLAT_SUNNAH,
  calculateSholatCompletion,
} from "@/hooks/use-muhasabah";
import { useState } from "react";

interface Props {
  params: Promise<{ id: string }>;
}

export default function MuhasabahDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { data: muhasabah, isLoading } = useMuhasabahRecord(id);
  const deleteMuhasabah = useDeleteMuhasabah();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteMuhasabah.mutateAsync(id);
      toast.success("Data muhasabah berhasil dihapus");
      router.push("/muhasabah");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Gagal menghapus data";
      toast.error(errorMessage);
    }
  };

  const getMoodConfig = (mood: string) => {
    return MUHASABAH_MOODS.find((m) => m.value === mood) || MUHASABAH_MOODS[2];
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!muhasabah) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Data muhasabah tidak ditemukan
          </p>
          <Button asChild className="mt-4">
            <Link href="/muhasabah">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const moodConfig = getMoodConfig(muhasabah.mood);
  const sholatWajibCount = SHOLAT_WAJIB.filter((s) => muhasabah[s.key]).length;
  const sholatSunnahCount = SHOLAT_SUNNAH.filter(
    (s) => muhasabah[s.key],
  ).length;
  const sholatPercentage = calculateSholatCompletion(muhasabah);

  return (
    <MainLayout>
      <PageHeader
        title={`Muhasabah ${safeFormat(new Date(muhasabah.date), "EEEE, d MMMM yyyy", { locale: localeId })}`}
        description="Detail catatan muhasabah harian"
        backHref="/muhasabah"
        backLabel="Kembali"
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/muhasabah/${id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Hapus
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sholat Wajib */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Sholat Wajib
                </span>
                <Badge variant="secondary">{sholatWajibCount}/5</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4">
                {SHOLAT_WAJIB.map((sholat) => {
                  const completed = muhasabah[sholat.key];
                  return (
                    <div
                      key={sholat.key}
                      className={`p-4 rounded-lg text-center ${
                        completed
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {completed ? (
                        <CheckCircle2 className="h-6 w-6 mx-auto mb-2" />
                      ) : (
                        <XCircle className="h-6 w-6 mx-auto mb-2" />
                      )}
                      <p className="font-medium">{sholat.label}</p>
                      <p className="text-xs opacity-75">{sholat.time}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Sholat Sunnah */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Sholat Sunnah
                </span>
                <Badge variant="secondary">
                  {sholatSunnahCount} dilaksanakan
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {SHOLAT_SUNNAH.map((sholat) => {
                  const completed = muhasabah[sholat.key];
                  return (
                    <Badge
                      key={sholat.key}
                      variant={completed ? "default" : "outline"}
                      className={
                        completed ? "bg-yellow-500 hover:bg-yellow-600" : ""
                      }
                    >
                      {sholat.label}
                    </Badge>
                  );
                })}
              </div>
              {sholatSunnahCount === 0 && (
                <p className="text-muted-foreground text-sm mt-2">
                  Tidak ada sholat sunnah yang dicatat hari ini
                </p>
              )}
            </CardContent>
          </Card>

          {/* Ibadah Harian */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Ibadah Harian
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tilawah */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Tilawah Al-Qur&apos;an</span>
                  <span className="text-muted-foreground">
                    {muhasabah.tilawahPages || 0} halaman
                  </span>
                </div>
                <Progress
                  value={Math.min((muhasabah.tilawahPages || 0) * 5, 100)}
                  className="h-2"
                />
              </div>

              {/* Dzikir Pagi */}
              <div className="flex justify-between items-center py-2 border-b">
                <span>Dzikir Pagi</span>
                {muhasabah.dzikirPagi ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>

              {/* Dzikir Sore */}
              <div className="flex justify-between items-center py-2 border-b">
                <span>Dzikir Sore</span>
                {muhasabah.dzikirSore ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>

              {/* Istighfar */}
              <div className="flex justify-between items-center py-2 border-b">
                <span>Istighfar</span>
                <Badge variant="outline">{muhasabah.istighfar || 0}x</Badge>
              </div>

              {/* Sholawat */}
              <div className="flex justify-between items-center py-2 border-b">
                <span>Sholawat</span>
                <Badge variant="outline">{muhasabah.shalawat || 0}x</Badge>
              </div>

              {/* Murojaah */}
              {muhasabah.murojaahJuz && (
                <div className="flex justify-between items-center py-2">
                  <span>Murojaah</span>
                  <Badge variant="outline">Juz {muhasabah.murojaahJuz}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reflection */}
          {(muhasabah.gratitude ||
            muhasabah.improvement ||
            muhasabah.notes) && (
            <Card>
              <CardHeader>
                <CardTitle>Refleksi Diri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {muhasabah.gratitude && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">
                      Syukur Hari Ini
                    </h4>
                    <p className="whitespace-pre-line">{muhasabah.gratitude}</p>
                  </div>
                )}
                {muhasabah.improvement && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">
                      Perbaikan yang Perlu Dilakukan
                    </h4>
                    <p className="whitespace-pre-line">
                      {muhasabah.improvement}
                    </p>
                  </div>
                )}
                {muhasabah.notes && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">
                      Catatan Tambahan
                    </h4>
                    <p className="whitespace-pre-line">{muhasabah.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Mood Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Smile className="h-4 w-4" />
                Kondisi Hari Ini
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <span className="text-6xl">{moodConfig.emoji}</span>
                <p className={`mt-2 font-medium ${moodConfig.color}`}>
                  {moodConfig.label}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pencapaian Hari Ini</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Sholat</span>
                  <span>{sholatPercentage}%</span>
                </div>
                <Progress value={sholatPercentage} className="h-2" />
              </div>
              <div className="pt-2 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sholat Wajib</span>
                  <span className="font-medium">{sholatWajibCount}/5</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sholat Sunnah</span>
                  <span className="font-medium">{sholatSunnahCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tilawah</span>
                  <span className="font-medium">
                    {muhasabah.tilawahPages || 0} hal
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Tanggal</p>
                <p className="font-medium">
                  {safeFormat(new Date(muhasabah.date), "EEEE, d MMMM yyyy", {
                    locale: localeId,
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dicatat</p>
                <p className="font-medium">
                  {safeFormat(
                    new Date(muhasabah.createdAt),
                    "d MMM yyyy HH:mm",
                    {
                      locale: localeId,
                    },
                  )}
                </p>
              </div>
              {muhasabah.updatedAt !== muhasabah.createdAt && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Terakhir diubah
                  </p>
                  <p className="font-medium">
                    {safeFormat(
                      new Date(muhasabah.updatedAt),
                      "d MMM yyyy HH:mm",
                      {
                        locale: localeId,
                      },
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Hapus Data Muhasabah"
        description="Apakah Anda yakin ingin menghapus data muhasabah ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={handleDelete}
        isLoading={deleteMuhasabah.isPending}
      />
    </MainLayout>
  );
}
