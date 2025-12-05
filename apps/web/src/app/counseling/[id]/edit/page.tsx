"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Save,
  AlertCircle,
  User,
  School,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  useCounselingRecord,
  useUpdateCounselingRecord,
  COUNSELING_CATEGORIES,
  COUNSELING_PRIORITIES,
  COUNSELING_STATUSES,
  CounselingCategory,
  CounselingPriority,
  CounselingStatus,
} from "@/hooks/use-counseling";

// Form schema
const updateCounselingSchema = z.object({
  category: z.enum([
    "ACADEMIC",
    "SOCIAL",
    "PERSONAL",
    "CAREER",
    "FAMILY",
    "BEHAVIOR",
    "RELIGIOUS",
    "OTHER",
  ] as const),
  title: z
    .string()
    .min(5, "Judul minimal 5 karakter")
    .max(200, "Judul maksimal 200 karakter"),
  description: z
    .string()
    .min(20, "Deskripsi minimal 20 karakter")
    .max(5000, "Deskripsi maksimal 5000 karakter"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"] as const),
  status: z.enum([
    "OPEN",
    "IN_PROGRESS",
    "FOLLOW_UP",
    "RESOLVED",
    "REFERRED",
  ] as const),
  isConfidential: z.boolean(),
  reportedBy: z.string().optional(),
  resolutionNotes: z.string().optional(),
});

type UpdateCounselingFormValues = z.infer<typeof updateCounselingSchema>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const typedResolver = zodResolver(updateCounselingSchema) as any;

export default function EditCounselingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Fetch counseling record
  const { data: record, isLoading, error } = useCounselingRecord(id);

  // Update mutation
  const updateMutation = useUpdateCounselingRecord();

  // Form setup
  const form = useForm<UpdateCounselingFormValues>({
    resolver: typedResolver,
    defaultValues: {
      category: "ACADEMIC" as CounselingCategory,
      title: "",
      description: "",
      priority: "MEDIUM" as CounselingPriority,
      status: "OPEN" as CounselingStatus,
      isConfidential: false,
      reportedBy: "",
      resolutionNotes: "",
    },
  });

  // Populate form when data loads
  useEffect(() => {
    if (record) {
      form.reset({
        category: record.category,
        title: record.title,
        description: record.description,
        priority: record.priority,
        status: record.status,
        isConfidential: record.isConfidential,
        reportedBy: record.reportedBy || "",
        resolutionNotes: record.resolutionNotes || "",
      });
    }
  }, [record, form]);

  // Handle submit
  const onSubmit = async (values: UpdateCounselingFormValues) => {
    try {
      await updateMutation.mutateAsync({
        id,
        ...values,
      });
      toast.success("Data konseling berhasil diperbarui");
      router.push(`/counseling/${id}`);
    } catch (error) {
      console.error("Error updating counseling record:", error);
      toast.error("Gagal memperbarui data konseling");
    }
  };

  // Watch status to show resolution notes
  const watchStatus = form.watch("status");
  const showResolutionNotes =
    watchStatus === "RESOLVED" || watchStatus === "REFERRED";

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !record) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error ? "Gagal memuat data konseling" : "Data tidak ditemukan"}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" asChild>
            <Link href="/counseling">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Daftar
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/counseling/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Konseling</h1>
          <p className="text-muted-foreground">
            Kasus: {record.caseNumber} - {record.student?.name}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Kasus</CardTitle>
                  <CardDescription>
                    Perbarui detail dan deskripsi kasus konseling
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Category */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kategori</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COUNSELING_CATEGORIES.map((category) => (
                              <SelectItem
                                key={category.value}
                                value={category.value}
                              >
                                <div className="flex items-center gap-2">
                                  <span>{category.icon}</span>
                                  <span>{category.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Judul Kasus</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Masukkan judul kasus"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Ringkasan singkat masalah yang dialami
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deskripsi</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Deskripsikan masalah secara detail..."
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Jelaskan kronologi, latar belakang, dan detail masalah
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Reported By */}
                  <FormField
                    control={form.control}
                    name="reportedBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dilaporkan Oleh</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nama pelapor (opsional)"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Siapa yang melaporkan masalah ini (jika ada)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Status & Priority Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Status & Prioritas</CardTitle>
                  <CardDescription>
                    Atur tingkat prioritas dan status penanganan
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    {/* Priority */}
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prioritas</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih prioritas" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {COUNSELING_PRIORITIES.map((priority) => (
                                <SelectItem
                                  key={priority.value}
                                  value={priority.value}
                                >
                                  <Badge
                                    variant="secondary"
                                    className={priority.color}
                                  >
                                    {priority.label}
                                  </Badge>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Status */}
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {COUNSELING_STATUSES.map((status) => (
                                <SelectItem
                                  key={status.value}
                                  value={status.value}
                                >
                                  <Badge
                                    variant="secondary"
                                    className={status.color}
                                  >
                                    {status.label}
                                  </Badge>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Resolution Notes - shown when status is RESOLVED or REFERRED */}
                  {showResolutionNotes && (
                    <FormField
                      control={form.control}
                      name="resolutionNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Catatan Penyelesaian</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tuliskan catatan penyelesaian atau alasan rujukan..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {watchStatus === "RESOLVED"
                              ? "Jelaskan bagaimana kasus ini diselesaikan"
                              : "Jelaskan alasan dan tujuan rujukan"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Confidential Toggle */}
                  <FormField
                    control={form.control}
                    name="isConfidential"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Kasus Rahasia
                          </FormLabel>
                          <FormDescription>
                            Tandai jika kasus ini bersifat sangat sensitif dan
                            hanya dapat diakses oleh konselor terkait
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Form Actions */}
              <div className="flex items-center gap-4">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="min-w-[120px]"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Simpan
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href={`/counseling/${id}`}>Batal</Link>
                </Button>
              </div>
            </div>

            {/* Sidebar - Student Info */}
            <div className="space-y-6">
              {/* Student Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Data Siswa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {record.student ? (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-lg font-semibold text-primary">
                            {record.student.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{record.student.name}</p>
                          <p className="text-sm text-muted-foreground">
                            NIS: {record.student.nis}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Kelas:</span>
                          <span className="font-medium">
                            {record.student.currentClass?.name || "-"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Jenis Kelamin:
                          </span>
                          <span className="font-medium">
                            {record.student.gender === "MALE"
                              ? "Laki-laki"
                              : "Perempuan"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Orang Tua:
                          </span>
                          <span className="font-medium">
                            {record.student.parentName}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            No. Telp:
                          </span>
                          <span className="font-medium">
                            {record.student.parentPhone}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Data siswa tidak tersedia
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Unit Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <School className="h-4 w-4" />
                    Unit Pendidikan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">
                    {record.unit?.name || "Tidak diketahui"}
                  </p>
                </CardContent>
              </Card>

              {/* Counselor Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Konselor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">
                    {record.counselor?.name || "Tidak diketahui"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Konselor yang ditugaskan menangani kasus ini
                  </p>
                </CardContent>
              </Card>

              {/* Case Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Info Kasus</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Nomor Kasus:</span>
                    <Badge variant="outline">{record.caseNumber}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Dilaporkan:</span>
                    <span>
                      {new Date(record.reportedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sesi:</span>
                    <span>{record.sessions?.length || 0} sesi</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
