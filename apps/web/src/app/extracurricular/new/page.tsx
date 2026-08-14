"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowLeft, Plus, Trash2, Save, Clock, MapPin } from "lucide-react";
import Link from "next/link";

import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";

import {
  useCreateExtracurricular,
  EXTRACURRICULAR_CATEGORIES,
  DAY_NAMES,
  type CreateExtracurricularInput,
  type ExtracurricularSchedule,
} from "@/hooks/use-extracurricular";
import { useUnits } from "@/hooks/use-units";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useTeachers } from "@/hooks/use-teachers";

interface FormData extends Omit<CreateExtracurricularInput, "schedules"> {
  schedules: Array<Omit<ExtracurricularSchedule, "id">>;
}

export default function NewExtracurricularPage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<
    Array<Omit<ExtracurricularSchedule, "id">>
  >([]);

  const { data: unitsData } = useUnits();
  const { data: academicYearsData } = useAcademicYears();
  const { data: teachersData } = useTeachers();

  const units = unitsData || [];
  const academicYears = academicYearsData?.data || [];
  const teachers = (teachersData as any)?.data || [];
  const activeYear = academicYears.find((y) => y.isActive);

  const createMutation = useCreateExtracurricular();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      status: "ACTIVE",
      academicYearId: activeYear?.id || "",
    },
  });

  const addSchedule = () => {
    setSchedules([
      ...schedules,
      { dayOfWeek: 1, startTime: "14:00", endTime: "16:00", location: "" },
    ]);
  };

  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const updateSchedule = (
    index: number,
    field: keyof ExtracurricularSchedule,
    value: string | number,
  ) => {
    setSchedules(
      schedules.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
  };

  const onSubmit = async (data: FormData) => {
    try {
      await createMutation.mutateAsync({
        ...data,
        schedules,
        maxMembers: data.maxMembers ? Number(data.maxMembers) : undefined,
      });
      toast.success("Ekstrakurikuler berhasil dibuat");
      router.push("/extracurricular");
    } catch {
      toast.error("Gagal membuat ekstrakurikuler");
    }
  };

  return (
    <MainLayout>
      <PageHeader
        title="Tambah Ekstrakurikuler"
        description="Buat kegiatan ekstrakurikuler baru"
        backHref="/extracurricular"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Dasar</CardTitle>
            <CardDescription>
              Data dasar kegiatan ekstrakurikuler
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Ekstrakurikuler *</Label>
                <Input
                  id="name"
                  placeholder="Contoh: Pramuka, PMR, Hadroh"
                  {...register("name", { required: "Nama wajib diisi" })}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Kode *</Label>
                <Input
                  id="code"
                  placeholder="Contoh: PRM, PMR, HDR"
                  {...register("code", { required: "Kode wajib diisi" })}
                />
                {errors.code && (
                  <p className="text-sm text-destructive">
                    {errors.code.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                placeholder="Deskripsi singkat kegiatan ekstrakurikuler..."
                rows={3}
                {...register("description")}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Kategori *</Label>
                <Select
                  onValueChange={(v) =>
                    setValue("category", v as FormData["category"])
                  }
                  defaultValue={watch("category")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXTRACURRICULAR_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status *</Label>
                <Select
                  onValueChange={(v) =>
                    setValue("status", v as FormData["status"])
                  }
                  defaultValue="ACTIVE"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Aktif</SelectItem>
                    <SelectItem value="INACTIVE">Tidak Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxMembers">Maks. Anggota</Label>
                <Input
                  id="maxMembers"
                  type="number"
                  placeholder="Kosongkan jika tidak terbatas"
                  {...register("maxMembers")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unit & Academic Year */}
        <Card>
          <CardHeader>
            <CardTitle>Unit & Tahun Ajaran</CardTitle>
            <CardDescription>
              Tentukan unit dan tahun ajaran untuk ekskul ini
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unit *</Label>
                <Select onValueChange={(v) => setValue("unitId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tahun Ajaran *</Label>
                <Select
                  onValueChange={(v) => setValue("academicYearId", v)}
                  defaultValue={activeYear?.id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tahun ajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.name} {year.isActive && "(Aktif)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coach */}
        <Card>
          <CardHeader>
            <CardTitle>Pembina</CardTitle>
            <CardDescription>
              Tentukan pembina ekskul (opsional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Pembina</Label>
              <Select onValueChange={(v) => setValue("coachId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih pembina" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher: any) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.user?.name || teacher.nip || "Unknown Teacher"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Pembina dapat diisi dari daftar guru atau pegawai
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Schedules */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Jadwal Kegiatan</CardTitle>
                <CardDescription>Tentukan jadwal rutin ekskul</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSchedule}
              >
                <Plus className="h-4 w-4 mr-1" />
                Tambah Jadwal
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {schedules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Belum ada jadwal ditambahkan</p>
                <Button
                  type="button"
                  variant="link"
                  onClick={addSchedule}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Jadwal Pertama
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {schedules.map((schedule, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Hari</Label>
                        <Select
                          value={schedule.dayOfWeek.toString()}
                          onValueChange={(v) =>
                            updateSchedule(index, "dayOfWeek", parseInt(v))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DAY_NAMES.map((day, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Jam Mulai</Label>
                        <Input
                          type="time"
                          value={schedule.startTime}
                          onChange={(e) =>
                            updateSchedule(index, "startTime", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Jam Selesai</Label>
                        <Input
                          type="time"
                          value={schedule.endTime}
                          onChange={(e) =>
                            updateSchedule(index, "endTime", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Lokasi</Label>
                        <Input
                          placeholder="Contoh: Lapangan, Aula"
                          value={schedule.location || ""}
                          onChange={(e) =>
                            updateSchedule(index, "location", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive self-end md:self-center"
                      onClick={() => removeSchedule(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" asChild>
            <Link href="/extracurricular">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Batal
            </Link>
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting || createMutation.isPending
              ? "Menyimpan..."
              : "Simpan"}
          </Button>
        </div>
      </form>
    </MainLayout>
  );
}
