"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useProject, useProjectFinances, useCreateMilestone, useUpdateMilestone, useUpdateProject } from "@/hooks/use-litbang";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Target, Users, Calendar, Flag, CheckCircle2, Wallet } from "lucide-react";

const milestoneSchema = z.object({
  title: z.string().min(5, "Judul wajib diisi minimal 5 karakter"),
  description: z.string().optional(),
  dueDate: z.string().min(1, "Batas waktu wajib diisi"),
});

export default function LitbangProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data: project, isLoading } = useProject(projectId);
  const { data: finances, isLoading: loadingFinances } = useProjectFinances(projectId);
  const createMilestone = useCreateMilestone();
  const updateMilestone = useUpdateMilestone();
  const updateProject = useUpdateProject();

  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof milestoneSchema>>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: { title: "", description: "", dueDate: "" },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h2 className="text-2xl font-bold mb-2">Proyek Tidak Ditemukan</h2>
        <Button onClick={() => router.back()}>Kembali</Button>
      </div>
    );
  }

  const onMilestoneSubmit = async (values: z.infer<typeof milestoneSchema>) => {
    await createMilestone.mutateAsync({
      projectId: project.id,
      title: values.title,
      description: values.description,
      dueDate: new Date(values.dueDate).toISOString(),
    });
    setMilestoneDialogOpen(false);
    form.reset();
  };

  const handleCompleteMilestone = async (milestoneId: string) => {
    await updateMilestone.mutateAsync({
      id: milestoneId,
      status: "COMPLETED",
      completedAt: new Date().toISOString(),
    });
  };

  const statusColor = {
    PLANNED: "bg-slate-100 text-slate-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
  }[project.status as string] || "bg-gray-100 text-gray-700";

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Button variant="ghost" className="mb-2 -ml-4" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Kembali
      </Button>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <PageHeader title={project.title} description={`Kategori: ${project.category}`} />
            <Badge className={`${statusColor} hover:${statusColor} ml-2 mt-[-24px]`}>
              {project.status}
            </Badge>
          </div>
        </div>
        
        {project.status === "PLANNED" && (
          <Button onClick={() => updateProject.mutate({ id: project.id, status: "IN_PROGRESS" })}>
            Mulai Proyek
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5" /> Abstrak & Metodologi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Abstrak Proyek</h4>
              <p className="text-sm border p-4 rounded-md bg-muted/30 whitespace-pre-wrap leading-relaxed">{project.abstract || "Belum ada abstrak."}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Metodologi</h4>
              <p className="text-sm border p-4 rounded-md bg-muted/30 whitespace-pre-wrap leading-relaxed">{project.methodology || "Belum ada metodologi yang didefinisikan."}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" /> Info Proyek
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Ketua Peneliti</span>
              <span className="font-medium">{project.leader?.name || "-"}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Sumber Dana</span>
              <span className="font-medium">{project.fundingSource || "-"}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Anggaran</span>
              <span className="font-medium">Rp {Number(project.budget || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground"><Calendar className="inline w-4 h-4 mr-1"/> Mulai</span>
              <span className="font-medium">{project.startDate ? format(new Date(project.startDate), "dd MMM yyyy", { locale: localeId }) : "-"}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground"><Calendar className="inline w-4 h-4 mr-1"/> Selesai</span>
              <span className="font-medium">{project.endDate ? format(new Date(project.endDate), "dd MMM yyyy", { locale: localeId }) : "-"}</span>
            </div>

            <div className="pt-2">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Progres</span>
                <span className="text-sm font-medium">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Financial Realization Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600" /> Realisasi Anggaran
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingFinances ? (
              <Skeleton className="h-20 w-full" />
            ) : finances ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Anggaran</span>
                  <span className="font-bold">Rp {finances.budget.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Realisasi</span>
                  <span className="font-bold text-emerald-600">Rp {finances.realization.toLocaleString('id-ID')}</span>
                </div>
                <div className="pt-2">
                  <div className="flex justify-between mb-1 text-xs">
                    <span>Penyerapan</span>
                    <span className="font-medium">{finances.percentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={finances.percentage} className="h-2 bg-emerald-100" />
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 italic">
                  * Dihitung berdasarkan entri jurnal beban/aset pada unit terkait selama periode proyek.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Data keuangan tidak tersedia.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Flag className="w-5 h-5" /> Milestones Proyek
            </CardTitle>
            <CardDescription>Tahapan capaian dalam penelitian ini.</CardDescription>
          </div>
          <Dialog open={milestoneDialogOpen} onOpenChange={setMilestoneDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Tambah Milestone</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Milestone</DialogTitle>
                <DialogDescription>
                  Tambahkan target pencapaian baru untuk proyek ini.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onMilestoneSubmit)} className="space-y-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Judul Capaian</FormLabel>
                      <FormControl><Input placeholder="Contoh: Pengumpulan Data Tahap 1" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi</FormLabel>
                      <FormControl><Textarea placeholder="Detail target..." rows={3} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="dueDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Selesai</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setMilestoneDialogOpen(false)}>Batal</Button>
                    <Button type="submit" disabled={createMilestone.isPending}>
                      {createMilestone.isPending ? "Menyimpan..." : "Simpan"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {project.milestones && project.milestones.length > 0 ? (
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
              {project.milestones.map((ms: any, index: number) => (
                <div key={ms.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 group-[.is-active]:bg-primary text-slate-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors">
                    {ms.status === "COMPLETED" ? <CheckCircle2 className="w-5 h-5 text-white" /> : <span className="text-xs font-bold">{index + 1}</span>}
                  </div>
                  
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-sm">{ms.title}</h4>
                      <time className="text-xs font-medium text-muted-foreground">
                        {ms.dueDate ? format(new Date(ms.dueDate), "dd/MM/yyyy") : "-"}
                      </time>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{ms.description}</p>
                    
                    {ms.status !== "COMPLETED" && (
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleCompleteMilestone(ms.id)} disabled={updateMilestone.isPending}>
                        Tandai Selesai
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                <Flag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Belum ada milestone tercatat untuk proyek ini.</p>
              </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
