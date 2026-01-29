"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Wrench,
  Users,
  Package,
  ArrowRight,
  AlertCircle,
  Clock,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { useProcurement } from "@/hooks/use-procurement";
import { useMaintenances } from "@/hooks/use-inventory";
import { useReceptionStats } from "@/hooks/use-reception";
import { PurchaseRequestStatus } from "@cipansor/shared";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function OperationsDashboard() {
  // Fetch Procurement Data (Pending)
  const { requests: pendingPRs, isLoading: loadingPR } = useProcurement(
    undefined,
    PurchaseRequestStatus.PENDING
  );

  // Fetch Maintenance Data (Pending/In Progress)
  const { data: maintenances, isLoading: loadingMaintenance } = useMaintenances({
    limit: 5,
    status: "IN_PROGRESS", // Also want PENDING ideally, but hook filters by one status?
                           // Actually the hook takes params, maybe I can't filter multiple easily without multiple calls
                           // Let's just fetch IN_PROGRESS for "Active" tickets
  });

  // Fetch Reception Stats
  const { data: receptionStats, isLoading: loadingReception } = useReceptionStats();

  return (
    <MainLayout>
      <PageHeader
        title="Dashboard Operasional"
        description="Pusat kontrol kegiatan operasional, pengadaan, dan fasilitas."
      />

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {/* Procurement Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pengajuan Pembelian Pending
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingPR ? "..." : pendingPRs?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Menunggu persetujuan</p>
          </CardContent>
        </Card>

        {/* Maintenance Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tiket Maintenance Aktif
            </CardTitle>
            <Wrench className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingMaintenance ? "..." : maintenances?.meta?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Sedang dalam pengerjaan
            </p>
          </CardContent>
        </Card>

        {/* Reception Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamu Hari Ini</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingReception ? "..." : receptionStats?.guestsToday || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {receptionStats?.activeVisits || 0} sedang berkunjung
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Procurement List */}
        <Card className="col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pengajuan Terbaru</CardTitle>
              <CardDescription>
                Permintaan barang yang membutuhkan tindakan.
              </CardDescription>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/procurement">
                Lihat Semua <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loadingPR ? (
                <div className="text-center py-4 text-muted-foreground">
                  Loading...
                </div>
              ) : pendingPRs?.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Tidak ada pengajuan pending.
                </div>
              ) : (
                pendingPRs?.slice(0, 5).map((pr: any) => (
                  <div
                    key={pr.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{pr.code}</span>
                        <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200">
                          {pr.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {pr.requester?.name} • {pr.unit?.name}
                      </p>
                      <p className="text-sm font-medium">
                        {formatCurrency(pr.totalEstimated)}
                      </p>
                    </div>
                    <Button size="sm" asChild>
                      <Link href={`/procurement/${pr.id}`}>Review</Link>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Maintenance / Operational Alerts */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Aktivitas Operasional</CardTitle>
            <CardDescription>
              Status terkini fasilitas dan layanan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Maintenance Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Wrench className="h-4 w-4" /> Maintenance
                  </h4>
                  <Link
                    href="/facilities?tab=maintenance"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Lihat
                  </Link>
                </div>
                <div className="space-y-2">
                  {loadingMaintenance ? (
                    <div className="text-xs text-muted-foreground">Loading...</div>
                  ) : maintenances?.data?.length === 0 ? (
                    <div className="text-xs text-muted-foreground italic">
                      Semua sistem berjalan baik.
                    </div>
                  ) : (
                    maintenances?.data?.slice(0, 3).map((m: any) => (
                      <div key={m.id} className="text-sm border-l-2 border-blue-500 pl-3 py-1">
                        <p className="font-medium truncate">{m.asset?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {m.description}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Package Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4" /> Paket Santri
                  </h4>
                  <Link
                    href="/reception?tab=packages"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Lihat
                  </Link>
                </div>
                <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                  <div>
                    <p className="text-2xl font-bold">
                      {receptionStats?.pendingPackages || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Paket belum diambil
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-muted-foreground opacity-20" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
