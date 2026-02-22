"use client";

import { useCompliances, useSyariahSummary } from "@/hooks/use-syariah";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

const statusColor: Record<string, string> = {
  COMPLIANT: "bg-green-100 text-green-700",
  PARTIALLY: "bg-yellow-100 text-yellow-700",
  NON_COMPLIANT: "bg-red-100 text-red-700",
  UNDER_REVIEW: "bg-blue-100 text-blue-700",
  NOT_APPLICABLE: "bg-gray-100 text-gray-500",
};

const categoryLabel: Record<string, string> = {
  MUAMALAH: "Muamalah",
  TARBIYAH: "Tarbiyah",
  IBADAH: "Ibadah",
  AKHLAQ: "Akhlaq",
  GOVERNANCE: "Tata Kelola",
};

export default function SyariahPage() {
  const { data: compliances, isLoading } = useCompliances();
  const { data: summary } = useSyariahSummary();

  return (
    <div className="container mx-auto py-6 space-y-8">
      <PageHeader
        title="Kepatuhan Syariah"
        description="Monitor kepatuhan syariah di seluruh aspek lembaga pendidikan Islam."
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Item</CardDescription>
            <CardTitle className="text-3xl">{summary?.total ?? <Skeleton className="h-9 w-12" />}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-green-200">
          <CardHeader className="pb-2">
            <CardDescription>Sesuai Syariah</CardDescription>
            <CardTitle className="text-3xl text-green-600">{summary?.compliant ?? <Skeleton className="h-9 w-12" />}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-yellow-200">
          <CardHeader className="pb-2">
            <CardDescription>Sebagian</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{summary?.partial ?? <Skeleton className="h-9 w-12" />}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardDescription>Tidak Sesuai</CardDescription>
            <CardTitle className="text-3xl text-red-600">{summary?.nonCompliant ?? <Skeleton className="h-9 w-12" />}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Skor Rata-rata</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{summary ? `${Math.round(summary.averageScore)}%` : <Skeleton className="h-9 w-12" />}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Category Breakdown */}
      {summary?.byCategory && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Berdasarkan Kategori</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Object.entries(summary.byCategory).map(([cat, data]: [string, any]) => (
              <Card key={cat}>
                <CardHeader className="pb-2">
                  <CardDescription>{categoryLabel[cat] || cat}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(data.averageScore)}%</div>
                  <Progress value={data.averageScore} className="h-2 mt-2" />
                  <div className="text-xs text-muted-foreground mt-1">{data.total} item</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Compliance List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Daftar Kepatuhan</h2>
        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
        ) : compliances?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Belum ada item kepatuhan.
            </CardContent>
          </Card>
        ) : (
          compliances?.map((item: any) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>{categoryLabel[item.category] || item.category}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.score !== null && <span className="text-sm font-medium">{item.score}%</span>}
                    <Badge className={statusColor[item.status]}>{item.status.replace("_", " ")}</Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
