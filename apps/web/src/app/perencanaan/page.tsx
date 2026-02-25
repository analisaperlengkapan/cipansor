"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  usePlans,
  useCreatePlan,
  useUpdatePlan,
  useApprovePlan,
  useDeletePlan,
} from "@/hooks/use-perencanaan";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, CheckCircle, Filter, X } from "lucide-react";

// ─── Schemas ────────────────────────────────────────────────
const planFormSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  description: z.string().optional(),
  type: z.enum(["RENSTRA", "RKAS", "RKT", "PROGRAM"]),
  startDate: z.string().min(1, "Tanggal mulai wajib"),
  endDate: z.string().min(1, "Tanggal selesai wajib"),
  budget: z.string().optional(),
});

type PlanFormValues = z.infer<typeof planFormSchema>;

// ─── Constants ──────────────────────────────────────────────
const statusColor: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  PROPOSED: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  APPROVED: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const typeLabel: Record<string, string> = {
  RENSTRA: "Rencana Strategis",
  RKAS: "RKA Sekolah",
  RKT: "Rencana Kerja Tahunan",
  PROGRAM: "Program Kerja",
};

const typeOptions = [
  { value: "RENSTRA", label: "Rencana Strategis (5 Tahun)" },
  { value: "RKAS", label: "RKA Sekolah" },
  { value: "RKT", label: "Rencana Kerja Tahunan" },
  { value: "PROGRAM", label: "Program Kerja" },
];

const statusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "PROPOSED", label: "Diajukan" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "IN_PROGRESS", label: "Berjalan" },
  { value: "COMPLETED", label: "Selesai" },
  { value: "CANCELLED", label: "Dibatalkan" },
];

// ─── Create/Edit Dialog ─────────────────────────────────────
function PlanFormDialog({
  editData,
  onClose,
}: {
  editData?: any;
  onClose: () => void;
}) {
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const isEdit = !!editData;

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      title: editData?.title || "",
      description: editData?.description || "",
      type: editData?.type || "PROGRAM",
      startDate: editData?.startDate
        ? new Date(editData.startDate).toISOString().split("T")[0]
        : "",
      endDate: editData?.endDate
        ? new Date(editData.endDate).toISOString().split("T")[0]
        : "",
      budget: editData?.budget ? String(editData.budget) : "",
    },
  });

  const onSubmit = async (values: PlanFormValues) => {
    const payload = {
      ...values,
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate).toISOString(),
      budget: values.budget ? Number(values.budget) : undefined,
    };

    if (isEdit) {
      await updatePlan.mutateAsync({ id: editData.id, ...payload });
    } else {
      await createPlan.mutateAsync(payload);
    }
    onClose();
  };

  const isPending = createPlan.isPending || updatePlan.isPending;

  return (
    <DialogContent className="sm:max-w-[560px]">
      <DialogHeader>
        <DialogTitle>
          {isEdit ? "Edit Rencana" : "Buat Rencana Baru"}
        </DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Perbarui informasi rencana strategis."
            : "Isi data rencana strategis, RKAS, RKT, atau program kerja."}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Judul Rencana</FormLabel>
                <FormControl>
                  <Input
                    placeholder="cth: RENSTRA Yayasan 2025-2029"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jenis Rencana</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {typeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deskripsi (Opsional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Deskripsi singkat rencana…"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Mulai</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Selesai</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Anggaran (Rp, Opsional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="cth: 500000000"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan…" : isEdit ? "Perbarui" : "Simpan"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export default function PerencanaanPage() {
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: plans, isLoading } = usePlans({
    type: filterType,
    status: filterStatus,
  });
  const approvePlan = useApprovePlan();
  const deletePlan = useDeletePlan();

  const approvedCount =
    plans?.filter(
      (p) => p.status === "APPROVED" || p.status === "IN_PROGRESS"
    ).length || 0;
  const avgProgress = plans?.length
    ? Math.round(plans.reduce((s, p) => s + p.progress, 0) / plans.length)
    : 0;
  const totalBudget = plans?.reduce((s, p) => s + (p.budget || 0), 0) || 0;

  const handleEdit = (plan: any) => {
    setEditItem(plan);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditItem(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditItem(null);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deletePlan.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const hasFilters = filterType || filterStatus;

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Perencanaan Strategis"
          description="Kelola rencana strategis, RKAS, RKT, dan program kerja yayasan."
        />
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate} className="gap-1">
              <Plus className="h-4 w-4" />
              Tambah Rencana
            </Button>
          </DialogTrigger>
          <PlanFormDialog editData={editItem} onClose={handleDialogClose} />
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardDescription>Total Rencana</CardDescription>
            <CardTitle className="text-3xl">
              {isLoading ? (
                <Skeleton className="h-9 w-12" />
              ) : (
                plans?.length || 0
              )}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardDescription>Disetujui / Berjalan</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {isLoading ? <Skeleton className="h-9 w-12" /> : approvedCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="pb-2">
            <CardDescription>Rata-rata Progress</CardDescription>
            <CardTitle className="text-3xl text-indigo-600">
              {isLoading ? (
                <Skeleton className="h-9 w-12" />
              ) : (
                `${avgProgress}%`
              )}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardDescription>Total Anggaran</CardDescription>
            <CardTitle className="text-2xl">
              {isLoading ? (
                <Skeleton className="h-9 w-20" />
              ) : (
                `Rp ${(totalBudget / 1_000_000).toFixed(0)} jt`
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select
          value={filterType || "ALL"}
          onValueChange={(v) => setFilterType(v === "ALL" ? undefined : v)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Semua Jenis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Jenis</SelectItem>
            {typeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterStatus || "ALL"}
          onValueChange={(v) => setFilterStatus(v === "ALL" ? undefined : v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Status</SelectItem>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterType(undefined);
              setFilterStatus(undefined);
            }}
          >
            <X className="h-3 w-3 mr-1" />
            Reset
          </Button>
        )}
      </div>

      {/* Plans List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Daftar Rencana</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36 w-full" />
            ))}
          </div>
        ) : plans?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p className="text-lg mb-2">Belum ada rencana.</p>
              <p className="text-sm">
                Klik &quot;Tambah Rencana&quot; untuk membuat rencana baru.
              </p>
            </CardContent>
          </Card>
        ) : (
          plans?.map((plan) => (
            <Card
              key={plan.id}
              className="hover:shadow-md transition-shadow group"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{plan.title}</CardTitle>
                    <CardDescription>
                      {typeLabel[plan.type] || plan.type} •{" "}
                      {plan.createdBy?.name}
                    </CardDescription>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {plan.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColor[plan.status]}>
                      {plan.status}
                    </Badge>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      {plan.status === "DRAFT" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-green-600"
                          onClick={() => approvePlan.mutate(plan.id)}
                          title="Setujui"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleEdit(plan)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteId(plan.id)}
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Progress</span>
                    <span className="font-medium">{plan.progress}%</span>
                  </div>
                  <Progress value={plan.progress} className="h-2" />
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>{plan.objectives?.length || 0} sasaran</span>
                    {plan.budget && (
                      <span>
                        Anggaran: Rp{" "}
                        {Number(plan.budget).toLocaleString("id-ID")}
                      </span>
                    )}
                    <span>
                      {new Date(plan.startDate).toLocaleDateString("id-ID")} -{" "}
                      {new Date(plan.endDate).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Hapus Rencana?"
        description="Rencana beserta seluruh sasaran, indikator, dan kegiatan akan dihapus permanen. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deletePlan.isPending}
      />
    </div>
  );
}
