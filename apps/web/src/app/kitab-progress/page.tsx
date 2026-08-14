"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  BookOpen,
  Users,
  Award,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  GraduationCap,
  Filter,
  Download,
  Grid3X3,
  List,
} from "lucide-react";

import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

import {
  useKitabList,
  useKitabStatistics,
  useDeleteKitab,
  KITAB_CATEGORIES,
  KITAB_LEVELS,
  KITAB_CATEGORY_LABELS,
  KITAB_LEVEL_LABELS,
  KITAB_LEVEL_COLORS,
  getCategoryIcon,
  type KitabCategory,
  type KitabLevel,
  type KitabKuning,
} from "@/hooks/use-kitab-progress";
import { useUnits } from "@/hooks/use-units";
import { useDebounce } from "@/hooks/use-debounce";

export default function KitabProgressPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<KitabCategory | "ALL">("ALL");
  const [level, setLevel] = useState<KitabLevel | "ALL">("ALL");
  const [unitId, setUnitId] = useState<string>("ALL");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("kitab");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  const { data: unitsData } = useUnits();
  const units = unitsData || [];

  const {
    data: kitabData,
    isLoading,
    error,
  } = useKitabList({
    search: debouncedSearch || undefined,
    category: category !== "ALL" ? category : undefined,
    level: level !== "ALL" ? level : undefined,
    unitId: unitId !== "ALL" ? unitId : undefined,
    page,
    limit: 12,
  });

  const { data: statistics, isLoading: statsLoading } = useKitabStatistics({
    unitId: unitId !== "ALL" ? unitId : undefined,
  });

  const deleteMutation = useDeleteKitab();

  const kitabList = kitabData?.data || [];
  const meta = kitabData?.meta;

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Kitab berhasil dihapus");
      setDeleteId(null);
    } catch {
      toast.error("Gagal menghapus kitab");
    }
  };

  // Calculate stats from data
  const stats = {
    total: statistics?.totalKitab || kitabList.length,
    totalStudents: statistics?.totalStudentsLearning || 0,
    completionRate: statistics?.completionRate || 0,
    byCategory: (statistics?.byCategory || {}) as Record<KitabCategory, number>,
    byLevel: (statistics?.byLevel || {}) as Record<KitabLevel, number>,
    topKitab: statistics?.topKitab || [],
  };

  return (
    <MainLayout>
      <PageHeader
        title="Kitab Kuning"
        description="Kelola pembelajaran dan progres kitab kuning santri"
        action={{
          label: "Tambah Kitab",
          icon: <Plus className="h-4 w-4" />,
          href: "/kitab-progress/new",
        }}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <BookOpen className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Kitab</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats.total}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Santri Belajar</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats.totalStudents}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Award className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tingkat Khatam</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">
                    {stats.completionRate.toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-2">Per Level</p>
            <div className="flex flex-wrap gap-1">
              {KITAB_LEVELS.map((lvl) => (
                <Badge
                  key={lvl}
                  variant="secondary"
                  className={`text-xs ${KITAB_LEVEL_COLORS[lvl]}`}
                >
                  {KITAB_LEVEL_LABELS[lvl].split(" ")[0]}:{" "}
                  {stats.byLevel[lvl] || 0}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="kitab">
            <BookOpen className="h-4 w-4 mr-2" />
            Daftar Kitab
          </TabsTrigger>
          <TabsTrigger value="statistics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Statistik
          </TabsTrigger>
          <TabsTrigger value="progress">
            <GraduationCap className="h-4 w-4 mr-2" />
            Progress Santri
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kitab" className="mt-4">
          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari kitab..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as typeof category)}
                >
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Kategori</SelectItem>
                    {KITAB_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {getCategoryIcon(cat)} {KITAB_CATEGORY_LABELS[cat]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={level}
                  onValueChange={(v) => setLevel(v as typeof level)}
                >
                  <SelectTrigger className="w-full md:w-44">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Level</SelectItem>
                    {KITAB_LEVELS.map((lvl) => (
                      <SelectItem key={lvl} value={lvl}>
                        {KITAB_LEVEL_LABELS[lvl]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={unitId} onValueChange={setUnitId}>
                  <SelectTrigger className="w-full md:w-44">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Unit</SelectItem>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kitab List */}
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Gagal memuat data kitab</p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => window.location.reload()}
                >
                  Coba Lagi
                </Button>
              </CardContent>
            </Card>
          ) : kitabList.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Belum Ada Kitab</h3>
                <p className="text-muted-foreground mb-4">
                  Tambahkan kitab kuning pertama untuk memulai tracking progress
                  santri
                </p>
                <Button asChild>
                  <Link href="/kitab-progress/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Kitab
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === "grid" ? (
            <KitabGridView kitabList={kitabList} onDelete={setDeleteId} />
          ) : (
            <KitabListView kitabList={kitabList} onDelete={setDeleteId} />
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Sebelumnya
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Halaman {page} dari {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Selanjutnya
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="statistics" className="mt-4">
          <StatisticsView statistics={statistics} loading={statsLoading} />
        </TabsContent>

        <TabsContent value="progress" className="mt-4">
          <ProgressTrackingView
            unitId={unitId !== "ALL" ? unitId : undefined}
          />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kitab?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Semua data progress santri
              terkait kitab ini juga akan ikut terhapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}

// Grid View Component
function KitabGridView({
  kitabList,
  onDelete,
}: {
  kitabList: KitabKuning[];
  onDelete: (id: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {kitabList.map((kitab) => (
        <Card key={kitab.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {getCategoryIcon(kitab.category)}
                </span>
                <div>
                  <CardTitle className="text-lg">{kitab.title}</CardTitle>
                  {kitab.author && (
                    <CardDescription>{kitab.author}</CardDescription>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/kitab-progress/${kitab.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      Lihat Detail
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/kitab-progress/${kitab.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete(kitab.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Category & Level */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">
                  {KITAB_CATEGORY_LABELS[kitab.category]}
                </Badge>
                <Badge className={KITAB_LEVEL_COLORS[kitab.level]}>
                  {KITAB_LEVEL_LABELS[kitab.level].split(" ")[0]}
                </Badge>
                {!kitab.isActive && <Badge variant="outline">Non-aktif</Badge>}
              </div>

              {/* Description */}
              {kitab.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {kitab.description}
                </p>
              )}

              {/* Pages & Chapters */}
              <div className="flex gap-4 text-sm">
                {kitab.totalPages && (
                  <span className="text-muted-foreground">
                    📄 {kitab.totalPages} halaman
                  </span>
                )}
                {kitab.totalChapters && (
                  <span className="text-muted-foreground">
                    📑 {kitab.totalChapters} bab
                  </span>
                )}
              </div>

              {/* Students Learning */}
              {kitab._count?.progresses !== undefined &&
                kitab._count.progresses > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span>{kitab._count.progresses} santri mempelajari</span>
                  </div>
                )}

              {/* Unit */}
              {kitab.unit && (
                <p className="text-xs text-muted-foreground">
                  🏫 {kitab.unit.name}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// List View Component
function KitabListView({
  kitabList,
  onDelete,
}: {
  kitabList: KitabKuning[];
  onDelete: (id: string) => void;
}) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kitab</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Level</TableHead>
            <TableHead className="text-center">Halaman</TableHead>
            <TableHead className="text-center">Santri</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {kitabList.map((kitab) => (
            <TableRow key={kitab.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {getCategoryIcon(kitab.category)}
                  </span>
                  <div>
                    <p className="font-medium">{kitab.title}</p>
                    {kitab.author && (
                      <p className="text-sm text-muted-foreground">
                        {kitab.author}
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {KITAB_CATEGORY_LABELS[kitab.category]}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={KITAB_LEVEL_COLORS[kitab.level]}>
                  {KITAB_LEVEL_LABELS[kitab.level].split(" ")[0]}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                {kitab.totalPages || "-"}
              </TableCell>
              <TableCell className="text-center">
                {kitab._count?.progresses || 0}
              </TableCell>
              <TableCell>{kitab.unit?.name || "-"}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/kitab-progress/${kitab.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/kitab-progress/${kitab.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onDelete(kitab.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

// Statistics View Component
function StatisticsView({
  statistics,
  loading,
}: {
  statistics: any;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* By Category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribusi per Kategori</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {KITAB_CATEGORIES.map((cat) => {
              const count = statistics?.byCategory?.[cat] || 0;
              const total = statistics?.totalKitab || 1;
              const percentage = (count / total) * 100;

              return (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-2">
                      <span>{getCategoryIcon(cat)}</span>
                      {KITAB_CATEGORY_LABELS[cat]}
                    </span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* By Level */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribusi per Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {KITAB_LEVELS.map((lvl) => {
              const count = statistics?.byLevel?.[lvl] || 0;
              const total = statistics?.totalKitab || 1;
              const percentage = (count / total) * 100;

              return (
                <div key={lvl}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-2">
                      <Badge
                        className={KITAB_LEVEL_COLORS[lvl]}
                        variant="secondary"
                      >
                        {KITAB_LEVEL_LABELS[lvl]}
                      </Badge>
                    </span>
                    <span className="text-muted-foreground">{count} kitab</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              Level Penjelasan:
            </p>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>
                • <strong>Mubtadi&apos;</strong>: Kitab dasar untuk pemula
              </li>
              <li>
                • <strong>Mutawassith</strong>: Kitab menengah dengan pembahasan
                lebih dalam
              </li>
              <li>
                • <strong>Mutaqaddim</strong>: Kitab lanjut untuk santri senior
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Top Kitab */}
      <Card className="md:col-span-2">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">Kitab Populer</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
          <CardDescription>
            Kitab yang paling banyak dipelajari santri
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statistics?.topKitab?.length > 0 ? (
            <div className="space-y-4">
              {statistics.topKitab
                .slice(0, 5)
                .map((item: any, index: number) => (
                  <div
                    key={item.kitab?.id || index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-muted-foreground">
                        #{index + 1}
                      </span>
                      <span className="text-xl">
                        {getCategoryIcon(item.kitab?.category)}
                      </span>
                      <div>
                        <p className="font-medium">{item.kitab?.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.kitab?.author}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {item.studentCount} santri
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.completedCount} khatam
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Belum ada data progress santri
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Progress Tracking View Component
function ProgressTrackingView({ unitId }: { unitId?: string }) {
  const [classFilter, setClassFilter] = useState<string>("ALL");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">Tracking Progress Santri</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Kelas</SelectItem>
                  {/* Classes will be loaded dynamically */}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Pilih kelas atau santri untuk melihat progress pembelajaran kitab
            kuning
          </p>
          <div className="flex justify-center">
            <Button asChild>
              <Link href="/kitab-progress/tracking">
                <GraduationCap className="h-4 w-4 mr-2" />
                Buka Halaman Tracking
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
