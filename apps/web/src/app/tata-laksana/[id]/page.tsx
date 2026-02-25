"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useSOP, useUpdateSOP, useApproveSOP, useActivateSOP, useCreateRevision } from "@/hooks/use-tata-laksana";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, FileText, CheckCircle2, History, AlertCircle, Play } from "lucide-react";

const revisionSchema = z.object({
  changes: z.string().min(5, "Perubahan wajib diisi minimal 5 karakter"),
  documentUrl: z.string().min(5, "URL Dokumen wajib diisi"),
});

export default function SOPDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sopId = params.id as string;

  const { data: sop, isLoading } = useSOP(sopId);
  const approveSOP = useApproveSOP();
  const activateSOP = useActivateSOP();
  const createRevision = useCreateRevision();

  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof revisionSchema>>({
    resolver: zodResolver(revisionSchema),
    defaultValues: { changes: "", documentUrl: "" },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!sop) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h2 className="text-2xl font-bold mb-2">SOP Tidak Ditemukan</h2>
        <Button onClick={() => router.back()}>Kembali</Button>
      </div>
    );
  }

  const handleApprove = async () => {
    if (confirm("Apakah Anda yakin ingin menyetujui SOP ini?")) {
      await approveSOP.mutateAsync(sop.id);
    }
  };

  const handleActivate = async () => {
    if (confirm("Apakah Anda yakin ingin mengaktifkan SOP ini? Status akan menjadi ACTIVE.")) {
      await activateSOP.mutateAsync(sop.id);
    }
  };

  const onRevisionSubmit = async (values: z.infer<typeof revisionSchema>) => {
    await createRevision.mutateAsync({
      sopId: sop.id,
      changes: values.changes,
      documentUrl: values.documentUrl,
    });
    setRevisionDialogOpen(false);
    form.reset();
  };

  const statusColor = {
    DRAFT: "bg-slate-100 text-slate-700",
    REVIEW: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-blue-100 text-blue-700",
    ACTIVE: "bg-green-100 text-green-700",
    OBSOLETE: "bg-red-100 text-red-700",
  }[sop.status as string] || "bg-gray-100 text-gray-700";

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Button variant="ghost" className="mb-2 -ml-4" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Kembali
      </Button>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <PageHeader title={sop.title} description={`Kode: ${sop.code}`} />
            <Badge className={`${statusColor} hover:${statusColor} ml-2 mt-[-24px]`}>
              {sop.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {sop.status === "DRAFT" || sop.status === "REVIEW" ? (
            <Button onClick={handleApprove} disabled={approveSOP.isPending} variant="secondary">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Setujui SOP
            </Button>
          ) : sop.status === "APPROVED" ? (
            <Button onClick={handleActivate} disabled={activateSOP.isPending} className="bg-green-600 hover:bg-green-700">
              <Play className="w-4 h-4 mr-2" />
              Aktifkan SOP
            </Button>
          ) : null}

          {sop.status === "ACTIVE" && (
            <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <History className="w-4 h-4 mr-2" />
                  Buat Revisi Baru
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Buat Revisi SOP</DialogTitle>
                  <DialogDescription>
                    Revisi akan meningkatkan versi SOP ini (misal v{sop.version} ke v{sop.version + 1}).
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onRevisionSubmit)} className="space-y-4">
                    <FormField control={form.control} name="changes" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catatan Perubahan</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Jelaskan bagian mana yang direvisi..." rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="documentUrl" render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Dokumen Baru</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setRevisionDialogOpen(false)}>Batal</Button>
                      <Button type="submit" disabled={createRevision.isPending}>
                        {createRevision.isPending ? "Menyimpan..." : "Simpan Revisi"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" /> Informasi Dokumen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Tujuan SOP</h4>
              <p className="text-sm border p-3 rounded-md bg-muted/30">{sop.objective || "-"}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Ruang Lingkup</h4>
              <p className="text-sm border p-3 rounded-md bg-muted/30">{sop.scope || "-"}</p>
            </div>
            <div className="flex gap-4 items-center">
              {sop.documentUrl && (
                <Button variant="outline" asChild>
                  <a href={sop.documentUrl} target="_blank" rel="noreferrer">Lihat Dokumen Lengkap</a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Detail Administrasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Kategori</span>
              <span className="font-medium">{sop.category}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Unit Kerja</span>
              <span className="font-medium">{sop.unit?.name || "-"}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Versi Saat Ini</span>
              <span className="font-medium">v{sop.version}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Dibuat Oleh</span>
              <span className="font-medium">{sop.createdBy?.name || "-"}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Tgl Berubah</span>
              <span className="font-medium">{format(new Date(sop.updatedAt), "dd MMM yyyy", { locale: id })}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {sop.revisions && sop.revisions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5" /> Riwayat Revisi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sop.revisions.map((rev: any) => (
                <div key={rev.id} className="flex gap-4 p-4 border rounded-lg items-start">
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded font-bold">
                    v{rev.version}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{rev.changes}</p>
                    <div className="text-xs text-muted-foreground flex gap-4">
                      <span>Oleh: {rev.createdBy?.name || "System"}</span>
                      <span>•</span>
                      <span>{format(new Date(rev.createdAt), "dd MMM yyyy HH:mm", { locale: id })}</span>
                    </div>
                  </div>
                  {rev.documentUrl && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={rev.documentUrl} target="_blank" rel="noreferrer">Unduh</a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
