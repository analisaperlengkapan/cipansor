"use client";
import { useState } from "react";
import { safeFormat } from "@/lib/date";
import { useParams, useRouter } from "next/navigation";

import { id as localeId } from "date-fns/locale";
import {
  useCompliance,
  useUpdateCompliance,
  useCreateShariaAudit,
} from "@/hooks/use-syariah";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowLeft,
  BookOpen,
  AlertCircle,
  Bookmark,
  ClipboardCheck,
  Settings,
  Upload,
} from "lucide-react";

const auditSchema = z.object({
  date: z.string().min(1, "Tanggal audit wajib diisi"),
  findings: z.string().min(5, "Temuan wajib diisi"),
  recommendation: z.string().optional(),
  auditorId: z.string().min(1, "ID Auditor wajib diisi"),
  status: z.string().min(1, "Status hasil audit wajib dipilih"),
});

export default function SyariahComplianceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const complianceId = params.id as string;

  const { data: item, isLoading } = useCompliance(complianceId);
  const updateCompliance = useUpdateCompliance();
  const createAudit = useCreateShariaAudit();

  const [auditDialogOpen, setAuditDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof auditSchema>>({
    resolver: zodResolver(auditSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      findings: "",
      recommendation: "",
      auditorId: "auto-assigned",
      status: "COMPLIANT",
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h2 className="text-2xl font-bold mb-2">
          Item Kepatuhan Tidak Ditemukan
        </h2>
        <Button onClick={() => router.back()}>Kembali</Button>
      </div>
    );
  }

  const handleStatusChange = async (newStatus: string) => {
    await updateCompliance.mutateAsync({ id: item.id, status: newStatus });
  };

  const onAuditSubmit = async (values: z.infer<typeof auditSchema>) => {
    await createAudit.mutateAsync({
      complianceId: item.id,
      date: new Date(values.date).toISOString(),
      findings: values.findings,
      recommendation: values.recommendation,
      auditorId: "user-default", // In real app, from auth session
      status: values.status,
    });
    setAuditDialogOpen(false);
    form.reset();
  };

  const statusColor =
    {
      WAITING_REVIEW: "bg-yellow-100 text-yellow-700",
      COMPLIANT: "bg-green-100 text-green-700",
      PARTIAL: "bg-blue-100 text-blue-700",
      NON_COMPLIANT: "bg-red-100 text-red-700",
      EXEMPTED: "bg-slate-100 text-slate-700",
    }[item.status as string] || "bg-gray-100 text-gray-700";

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Button
        variant="ghost"
        className="mb-2 -ml-4"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Kembali
      </Button>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <PageHeader
              title={item.title}
              description={`Kategori: ${item.category}`}
            />
            <Badge
              className={`${statusColor} hover:${statusColor} ml-2 mt-[-24px]`}
            >
              {item.status.replace("_", " ")}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {item.status === "WAITING_REVIEW" && (
            <Button
              onClick={() => handleStatusChange("COMPLIANT")}
              disabled={updateCompliance.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Tandai Compliant
            </Button>
          )}
          <Dialog open={auditDialogOpen} onOpenChange={setAuditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Bookmark className="w-4 h-4 mr-2" />
                Catat Audit Berkala
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Catat Hasil Audit Syariah</DialogTitle>
                <DialogDescription>
                  Masukkan hasil peninjauan kepatuhan syariah untuk item ini.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onAuditSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Audit</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status Kesimpulan</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih status..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="COMPLIANT">
                              Sesuai Syariah (Compliant)
                            </SelectItem>
                            <SelectItem value="PARTIAL">
                              Sebagian Sesuai (Partial)
                            </SelectItem>
                            <SelectItem value="NON_COMPLIANT">
                              Tidak Sesuai (Non-Compliant)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="findings"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Detail Temuan</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Temuan selama peninjauan..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="recommendation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rekomendasi / Tindak Lanjut</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Usulan perbaikan..."
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAuditDialogOpen(false)}
                    >
                      Batal
                    </Button>
                    <Button type="submit" disabled={createAudit.isPending}>
                      {createAudit.isPending
                        ? "Menyimpan..."
                        : "Simpan Hasil Audit"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> Deskripsi & Referensi Dalil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Objek Kepatuhan
              </h4>
              <p className="text-sm rounded-md leading-relaxed p-4 border bg-muted/30">
                {item.description || "Belum ada deskripsi spesifik."}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Referensi Syariah (Dalil / Fatwa)
              </h4>
              <p className="text-sm rounded-md leading-relaxed p-4 border bg-green-50/50 text-green-900 border-green-200 whitespace-pre-wrap">
                {item.reference || "Referensi dalil belum ditentukan."}
              </p>
            </div>
            {item.documentUrl && (
              <div className="pt-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={item.documentUrl} target="_blank" rel="noreferrer">
                    <Upload className="w-4 h-4 mr-2" />
                    Lihat Dokumen Pendukung
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5" /> Meta Informasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Kategori Area</span>
              <span className="font-medium">{item.category}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Status Validasi</span>
              <span className="font-medium">
                {item.status.replace("_", " ")}
              </span>
            </div>
            {item.reviewDate && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">
                  Tinjauan Selanjutnya
                </span>
                <span className="font-medium text-red-600">
                  {safeFormat(new Date(item.reviewDate), "dd MMM yyyy", {
                    locale: localeId,
                  })}
                </span>
              </div>
            )}
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Terakhir Diperbarui</span>
              <span className="font-medium">
                {safeFormat(new Date(item.updatedAt), "dd MMM yyyy", {
                  locale: localeId,
                })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-500" /> Riwayat Audit &
            Peninjauan
          </CardTitle>
          <CardDescription>
            Jejak rekam pemeriksaan kepatuhan syariah pada objek ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {item.audits && item.audits.length > 0 ? (
            <div className="space-y-4">
              {item.audits.map((auditRecord: any) => {
                const statusColors: Record<string, string> = {
                  COMPLIANT: "bg-green-100 text-green-800 border-green-200",
                  PARTIAL: "bg-blue-100 text-blue-800 border-blue-200",
                  NON_COMPLIANT: "bg-red-100 text-red-800 border-red-200",
                };
                const badgeClass =
                  statusColors[auditRecord.status] ||
                  "bg-slate-100 text-slate-800";

                return (
                  <div
                    key={auditRecord.id}
                    className="border rounded-md p-4 bg-muted/20"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-sm">
                          Tinjauan:{" "}
                          {safeFormat(
                            new Date(auditRecord.date),
                            "dd MMMM yyyy",
                            { locale: localeId },
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Auditor:{" "}
                          {auditRecord.auditor?.name ||
                            "Sistem/Tidak diketahui"}
                        </span>
                      </div>
                      <Badge variant="outline" className={badgeClass}>
                        {auditRecord.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="mt-3 space-y-3">
                      <div>
                        <span className="text-xs font-bold text-slate-500 mb-1 block">
                          TEMUAN:
                        </span>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {auditRecord.findings || "-"}
                        </p>
                      </div>
                      {auditRecord.recommendation && (
                        <div className="bg-primary/5 p-3 rounded border border-primary/10">
                          <span className="text-xs font-bold text-primary mb-1 block">
                            REKOMENDASI:
                          </span>
                          <p className="text-sm text-primary/90 whitespace-pre-wrap">
                            {auditRecord.recommendation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">
              <ClipboardCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Belum ada riwayat audit untuk kepatuhan ini.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
