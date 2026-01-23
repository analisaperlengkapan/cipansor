"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Target,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Settings,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useIbadahTargets,
  useDeleteIbadahTarget,
  useUpdateIbadahTarget,
  useSeedDefaultTargets,
  IBADAH_CATEGORIES,
  TARGET_TYPES,
  getCategoryInfo,
  getTargetTypeLabel,
  getTargetUnitLabel,
  type IbadahCategory,
} from "@/hooks/use-ibadah";
import { useUnits } from "@/hooks/use-units";
import { cn } from "@/lib/utils";

export default function IbadahTargetsPage() {
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [seedingUnit, setSeedingUnit] = useState<string | null>(null);

  // Queries
  const { data: units = [] } = useUnits({ limit: 100 });

  const { data: targetsData, isLoading } = useIbadahTargets({
    unitId: selectedUnit || undefined,
    category: (category as IbadahCategory) || undefined,
    limit: 100,
  });
  const targets = targetsData?.data || [];

  // Mutations
  const deleteTarget = useDeleteIbadahTarget();
  const updateTarget = useUpdateIbadahTarget();
  const seedTargets = useSeedDefaultTargets();

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTarget.mutateAsync(deleteId);
      toast.success("Target berhasil dihapus");
      setDeleteId(null);
    } catch {
      toast.error("Gagal menghapus target");
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateTarget.mutateAsync({
        id,
        data: { isActive: !isActive },
      });
      toast.success(isActive ? "Target dinonaktifkan" : "Target diaktifkan");
    } catch {
      toast.error("Gagal mengubah status target");
    }
  };

  const handleSeedDefaults = async () => {
    if (!seedingUnit) return;
    try {
      const result = await seedTargets.mutateAsync(seedingUnit);
      toast.success(`${result.length} target default berhasil ditambahkan`);
      setSeedingUnit(null);
    } catch {
      toast.error("Gagal menambah target default");
    }
  };

  // Group targets by category
  const groupedTargets = targets.reduce(
    (acc, target) => {
      const key = target.category;
      if (!acc[key]) acc[key] = [];
      acc[key].push(target);
      return acc;
    },
    {} as Record<string, typeof targets>,
  );

  return (
    <MainLayout>
      <PageHeader
        title="Kelola Target Ibadah"
        description="Atur target ibadah harian untuk santri"
        action={{
          label: "Tambah Target",
          icon: <Plus className="h-4 w-4" />,
          href: "/ibadah/targets/new",
        }}
      />

      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" asChild>
          <Link href="/ibadah">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Link>
        </Button>
      </div>

      {/* Filters & Actions */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Pilih Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Unit</SelectItem>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Kategori</SelectItem>
                  {IBADAH_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1" />

            {selectedUnit && (
              <Button
                variant="outline"
                onClick={() => setSeedingUnit(selectedUnit)}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Seed Target Default
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Targets List */}
      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-24 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : targets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-4">Belum ada target ibadah</p>
            <div className="flex justify-center gap-2">
              <Button asChild>
                <Link href="/ibadah/targets/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Target Baru
                </Link>
              </Button>
              {selectedUnit && (
                <Button
                  variant="outline"
                  onClick={() => setSeedingUnit(selectedUnit)}
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Gunakan Target Default
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTargets).map(
            ([categoryKey, categoryTargets]) => {
              const categoryInfo = getCategoryInfo(
                categoryKey as IbadahCategory,
              );
              return (
                <Card key={categoryKey}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{categoryInfo.icon}</span>
                      <div>
                        <CardTitle>{categoryInfo.label}</CardTitle>
                        <CardDescription className="font-arabic">
                          {categoryInfo.labelAr}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="ml-auto">
                        {categoryTargets.length} target
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {categoryTargets
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((target) => (
                        <div
                          key={target.id}
                          className={cn(
                            "p-4 rounded-lg border",
                            target.isActive
                              ? "bg-card"
                              : "bg-muted/50 opacity-60",
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{target.name}</h4>
                                {target.nameAr && (
                                  <span className="text-sm text-muted-foreground font-arabic">
                                    ({target.nameAr})
                                  </span>
                                )}
                                {target.isOptional && (
                                  <Badge variant="outline" className="text-xs">
                                    Opsional
                                  </Badge>
                                )}
                                {!target.isActive && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Nonaktif
                                  </Badge>
                                )}
                              </div>
                              {target.description && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {target.description}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-4 text-sm">
                                <span>
                                  <strong>Target:</strong> {target.targetCount}{" "}
                                  {getTargetUnitLabel(
                                    target.targetUnit,
                                  ).toLowerCase()}
                                </span>
                                <span>
                                  <strong>Tipe:</strong>{" "}
                                  {getTargetTypeLabel(target.targetType)}
                                </span>
                                <span className="text-yellow-600">
                                  <strong>Poin:</strong> {target.points}
                                  {target.bonusPoints > 0 && (
                                    <span className="text-green-600">
                                      {" "}
                                      (+{target.bonusPoints} bonus)
                                    </span>
                                  )}
                                </span>
                                <span>
                                  <strong>Unit:</strong>{" "}
                                  {target.unit?.name || "-"}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={target.isActive}
                                  onCheckedChange={() =>
                                    handleToggleActive(
                                      target.id,
                                      target.isActive,
                                    )
                                  }
                                />
                                <Label className="text-xs">Aktif</Label>
                              </div>
                              <Button variant="ghost" size="icon" asChild>
                                <Link
                                  href={`/ibadah/targets/${target.id}/edit`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteId(target.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              );
            },
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Hapus Target Ibadah"
        description="Apakah Anda yakin ingin menghapus target ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        onConfirm={handleDelete}
        isLoading={deleteTarget.isPending}
        variant="destructive"
      />

      {/* Seed Confirmation */}
      <ConfirmDialog
        open={!!seedingUnit}
        onOpenChange={() => setSeedingUnit(null)}
        title="Seed Target Default"
        description="Ini akan menambahkan target ibadah default (Sholat 5 waktu, Tilawah, Dzikir, dll.) untuk unit yang dipilih. Target yang sudah ada tidak akan terduplikasi."
        confirmLabel="Tambahkan"
        onConfirm={handleSeedDefaults}
        isLoading={seedTargets.isPending}
      />
    </MainLayout>
  );
}
