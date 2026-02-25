"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Save, Shield, Trash2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import {
  useCounselingRecord,
  useUpdateCounselingRecord,
  useDeleteCounselingRecord,
  COUNSELING_CATEGORIES,
  COUNSELING_STATUSES,
  COUNSELING_PRIORITIES,
  type UpdateCounselingInput,
} from "@/hooks/use-counseling";

interface EditCounselingPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditCounselingPage({
  params,
}: EditCounselingPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data: record, isLoading, error } = useCounselingRecord(id);
  const updateMutation = useUpdateCounselingRecord();
  const deleteMutation = useDeleteCounselingRecord();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateCounselingInput>();

  // Pre-fill form when data is loaded
  useEffect(() => {
    if (record) {
      reset({
        title: record.title,
        description: record.description,
        category: record.category,
        priority: record.priority,
        status: record.status,
        scheduledAt: record.scheduledAt ? format(new Date(record.scheduledAt), "yyyy-MM-dd'T'HH:mm") : undefined,
        duration: record.duration,
        location: record.location,
        summary: record.summary,
        recommendations: record.recommendations,
        isConfidential: record.isConfidential,
      });
    }
  }, [record, reset]);

  const isConfidential = watch("isConfidential");

  const onSubmit = async (data: UpdateCounselingInput) => {
    try {
      await updateMutation.mutateAsync({
        ...data,
        id,
      });
      toast.success("Catatan konseling berhasil diperbarui");
      router.push(`/counseling/${id}`);
    } catch {
      toast.error("Gagal memperbarui catatan konseling");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Yakin ingin menghapus sesi konseling ini? Tindakan ini tidak dapat dibatalkan.")) return;

    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Sesi konseling berhasil dihapus");
      router.push("/counseling");
    } catch {
      toast.error("Gagal menghapus sesi konseling");
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </MainLayout>
    );
  }

  if (error || !record) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <h2 className="text-2xl font-bold mb-2">Data Tidak Ditemukan</h2>
          <Button asChild className="mt-4">
            <Link href="/counseling">Kembali ke Daftar</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        title="Edit Sesi Konseling"
        description={`Edit data sesi untuk ${record.student?.user?.name}`}
        backHref={`/counseling/${id}`}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            {/* Core Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Utama</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Judul Sesi *</Label>
                  <Input
                    id="title"
                    {...register("title", { required: "Judul wajib diisi" })}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kategori *</Label>
                    <Select
                      defaultValue={record.category}
                      onValueChange={(v) => setValue("category", v as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNSELING_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status *</Label>
                    <Select
                      defaultValue={record.status}
                      onValueChange={(v) => setValue("status", v as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNSELING_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi / Keluhan *</Label>
                  <Textarea
                    id="description"
                    rows={5}
                    {...register("description", { required: "Deskripsi wajib diisi" })}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Outcome & Results */}
            <Card>
              <CardHeader>
                <CardTitle>Hasil & Rekomendasi</CardTitle>
                <CardDescription>Diisi setelah sesi berlangsung</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="summary">Ringkasan & Hasil</Label>
                  <Textarea
                    id="summary"
                    rows={4}
                    placeholder="Hasil dari sesi konseling..."
                    {...register("summary")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recommendations">Rekomendasi / Tindak Lanjut</Label>
                  <Textarea
                    id="recommendations"
                    rows={4}
                    placeholder="Langkah selanjutnya..."
                    {...register("recommendations")}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Meta & Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Sesi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Prioritas</Label>
                  <Select
                    defaultValue={record.priority}
                    onValueChange={(v) => setValue("priority", v as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNSELING_PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduledAt">Jadwal</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    {...register("scheduledAt")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Durasi (menit)</Label>
                  <Input
                    id="duration"
                    type="number"
                    {...register("duration", { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Lokasi</Label>
                  <Input
                    id="location"
                    {...register("location")}
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-t mt-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="confidential" className="cursor-pointer">Rahasia</Label>
                  </div>
                  <Switch
                    id="confidential"
                    checked={isConfidential}
                    onCheckedChange={(v) => setValue("isConfidential", v)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting || updateMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Simpan Perubahan
              </Button>

              <Button
                type="button"
                variant="outline"
                asChild
              >
                <Link href={`/counseling/${id}`}>
                  Batal
                </Link>
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus Sesi
              </Button>
            </div>
          </div>
        </div>
      </form>
    </MainLayout>
  );
}
