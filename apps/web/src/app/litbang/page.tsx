"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useProjects, useProposals, useLitbangSummary,
  useCreateProject, useDeleteProject,
  useCreateProposal, useDeleteProposal, useEvaluateProposal,
  useCreateMilestone,
  useProjectFinances,
} from "@/hooks/use-litbang";
import { useBudgets } from "@/hooks/use-finance-enhancement";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, FlaskConical, Lightbulb, BookOpen, TrendingUp, DollarSign } from "lucide-react";

const projectFormSchema = z.object({
  unitId: z.string().min(1, "Unit wajib"),
  title: z.string().min(3, "Judul minimal 3 karakter"),
  abstract: z.string().optional(),
  category: z.string().min(1, "Kategori wajib"),
  fundingSource: z.string().optional(),
  budgetId: z.string().optional(),
});

const proposalFormSchema = z.object({
  unitId: z.string().min(1, "Unit wajib"),
  title: z.string().min(3, "Judul minimal 3 karakter"),
  description: z.string().optional(),
  category: z.string().min(1, "Kategori wajib"),
  impact: z.string().optional(),
  resources: z.string().optional(),
  timeline: z.string().optional(),
});

const researchCategories = ["Pendidikan", "Teknologi", "Sosial", "Agama", "Kesehatan", "Lingkungan"];
const innovationCategories = ["Teknologi", "Pedagogi", "Administrasi", "Layanan", "Lainnya"];

const statusColor: Record<string, string> = {
  PROPOSAL: "bg-gray-100 text-gray-700",
  APPROVED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  PUBLISHED: "bg-purple-100 text-purple-700",
  CANCELLED: "bg-red-100 text-red-700",
  IDEA: "bg-gray-100 text-gray-700",
  EVALUATION: "bg-yellow-100 text-yellow-700",
  PILOT: "bg-blue-100 text-blue-700",
  IMPLEMENTED: "bg-green-100 text-green-700",
  SCALED: "bg-purple-100 text-purple-700",
  REJECTED: "bg-red-100 text-red-700",
};

function ProjectFormDialog({ onClose }: { onClose: () => void }) {
  const createProject = useCreateProject();
  const form = useForm<z.infer<typeof projectFormSchema>>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: { unitId: "", title: "", abstract: "", category: "", fundingSource: "", budgetId: "" },
  });

  const selectedUnitId = useWatch({ control: form.control, name: "unitId" });
  const { data: budgets } = useBudgets({ unitId: selectedUnitId });

  const onSubmit = async (values: z.infer<typeof projectFormSchema>) => {
    await createProject.mutateAsync({
      ...values,
      budgetId: values.budgetId && values.budgetId !== "none" ? values.budgetId : undefined,
    });
    onClose();
  };

  return (
    <DialogContent className="sm:max-w-[520px]">
      <DialogHeader>
        <DialogTitle>Ajukan Proyek Penelitian</DialogTitle>
        <DialogDescription>Buat proposal penelitian baru.</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="unitId" render={({ field }) => (
            <FormItem><FormLabel>Unit ID</FormLabel><FormControl><Input placeholder="UUID unit" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem><FormLabel>Judul Penelitian</FormLabel><FormControl><Input placeholder="cth: Dampak AI dalam Pembelajaran" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel>Kategori</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger></FormControl>
                  <SelectContent>{researchCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="fundingSource" render={({ field }) => (
              <FormItem><FormLabel>Sumber Dana</FormLabel><FormControl><Input placeholder="Opsional" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
          <FormField control={form.control} name="abstract" render={({ field }) => (
            <FormItem><FormLabel>Abstrak (Opsional)</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="budgetId" render={({ field }) => (
            <FormItem>
              <FormLabel>Hubungkan ke Anggaran (Best Practice)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Pilih kode anggaran untuk tracking realisasi" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Tidak dihubungkan</SelectItem>
                  {budgets?.data?.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>{b.account?.code} - {b.account?.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" disabled={createProject.isPending}>{createProject.isPending ? "Menyimpan…" : "Ajukan"}</Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}

function ProposalFormDialog({ onClose }: { onClose: () => void }) {
  const createProposal = useCreateProposal();
  const form = useForm<z.infer<typeof proposalFormSchema>>({
    resolver: zodResolver(proposalFormSchema),
    defaultValues: { unitId: "", title: "", description: "", category: "", impact: "", resources: "", timeline: "" },
  });

  const onSubmit = async (values: z.infer<typeof proposalFormSchema>) => {
    await createProposal.mutateAsync(values);
    onClose();
  };

  return (
    <DialogContent className="sm:max-w-[520px]">
      <DialogHeader>
        <DialogTitle>Ajukan Usulan Inovasi</DialogTitle>
        <DialogDescription>Sampaikan ide inovasi untuk pengembangan lembaga.</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="unitId" render={({ field }) => (
            <FormItem><FormLabel>Unit ID</FormLabel><FormControl><Input placeholder="UUID unit" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem><FormLabel>Judul Inovasi</FormLabel><FormControl><Input placeholder="cth: Sistem Absensi Wajah" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel>Kategori</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger></FormControl>
                <SelectContent>{innovationCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem><FormLabel>Deskripsi</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="impact" render={({ field }) => (
            <FormItem><FormLabel>Dampak (Opsional)</FormLabel><FormControl><Textarea rows={2} placeholder="Dampak yang diharapkan..." {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" disabled={createProposal.isPending}>{createProposal.isPending ? "Menyimpan…" : "Ajukan"}</Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}

function ProjectCard({ project, onDelete }: { project: any; onDelete: () => void }) {
  const { data: finances } = useProjectFinances(project.id);

  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{project.title}</CardTitle>
            <CardDescription>
              {project.category} • {project.leader?.name}
              {project.fundingSource && ` • Dana: ${project.fundingSource}`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusColor[project.status]}>{project.status}</Badge>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Milestone Progress</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
          {project.milestones?.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-1">
              {project.milestones.map((m: any) => (
                <Badge key={m.id} variant={m.status === "COMPLETED" ? "default" : "outline"} className="text-[10px] h-5">
                  {m.title}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {finances && finances.budget > 0 && (
          <div className="pt-2 border-t space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> Realisasi Anggaran
              </span>
              <span className="font-medium">{Math.round(finances.percentage)}%</span>
            </div>
            <Progress value={finances.percentage} className="h-2" />
            <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
              <span>Rp {Math.round(finances.realization).toLocaleString()}</span>
              <span>Target: Rp {Math.round(finances.budget).toLocaleString()}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function LitbangPage() {
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false);
  const [deleteState, setDeleteState] = useState<{ type: string; id: string } | null>(null);

  const { data: projects, isLoading: loadingProjects } = useProjects();
  const { data: proposals } = useProposals();
  const { data: summary } = useLitbangSummary();
  const deleteProject = useDeleteProject();
  const deleteProposal = useDeleteProposal();

  const handleDelete = async () => {
    if (!deleteState) return;
    if (deleteState.type === "project") await deleteProject.mutateAsync(deleteState.id);
    else await deleteProposal.mutateAsync(deleteState.id);
    setDeleteState(null);
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <PageHeader title="Litbang & Inovasi" description="Kelola proyek penelitian dan usulan inovasi." />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><FlaskConical className="h-3 w-3" /> Proyek Penelitian</CardDescription>
            <CardTitle className="text-3xl">{summary?.totalProjects || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> Aktif</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{summary?.activeProjects || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Lightbulb className="h-3 w-3" /> Usulan Inovasi</CardDescription>
            <CardTitle className="text-3xl text-purple-600">{summary?.totalProposals || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Implementasi</CardDescription>
            <CardTitle className="text-3xl text-green-600">{summary?.implementedProposals || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">Proyek Penelitian</TabsTrigger>
          <TabsTrigger value="proposals">Usulan Inovasi</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-1"><Plus className="h-4 w-4" /> Ajukan Penelitian</Button>
              </DialogTrigger>
              <ProjectFormDialog onClose={() => setProjectDialogOpen(false)} />
            </Dialog>
          </div>
          {loadingProjects ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
          ) : projects?.length === 0 || !projects ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <FlaskConical className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p>Belum ada proyek penelitian.</p>
            </CardContent></Card>
          ) : (
            projects.map((project: any) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={() => setDeleteState({ type: "project", id: project.id })}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="proposals" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={proposalDialogOpen} onOpenChange={setProposalDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-1"><Plus className="h-4 w-4" /> Ajukan Inovasi</Button>
              </DialogTrigger>
              <ProposalFormDialog onClose={() => setProposalDialogOpen(false)} />
            </Dialog>
          </div>
          {proposals?.length === 0 || !proposals ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <Lightbulb className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p>Belum ada usulan inovasi.</p>
            </CardContent></Card>
          ) : (
            proposals.map((proposal: any) => (
              <Card key={proposal.id} className="hover:shadow-md transition-shadow group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{proposal.title}</CardTitle>
                      <CardDescription>
                        {proposal.category} • {proposal.proposer?.name}
                        {proposal.score != null && ` • Skor: ${proposal.score}`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColor[proposal.status]}>{proposal.status}</Badge>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteState({ type: "proposal", id: proposal.id })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                {(proposal.description || proposal.impact) && (
                  <CardContent>
                    {proposal.description && <p className="text-sm text-muted-foreground line-clamp-2">{proposal.description}</p>}
                    {proposal.impact && <p className="text-xs text-muted-foreground mt-1 italic">Dampak: {proposal.impact}</p>}
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!deleteState}
        onOpenChange={(open) => !open && setDeleteState(null)}
        title="Hapus Data?"
        description="Data ini akan dihapus permanen dan tidak dapat dibatalkan."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteProject.isPending || deleteProposal.isPending}
      />
    </div>
  );
}
