"use client";

import { useParams } from "next/navigation";
import { safeFormat } from "@/lib/date";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProcurementDetail, useProcurement } from "@/hooks/use-procurement";
import { useAuth } from "@/hooks/use-auth";
import { PurchaseRequestStatus } from "@cipansor/shared";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  PackageCheck,
  AlertTriangle,
  History,
} from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { FulfillDialog } from "./fulfill-dialog";
import { getEffectiveRole } from "@/lib/rbac";

export default function ProcurementDetailPage() {
  const { id } = useParams();
  const {
    data: request,
    isLoading,
    mutate,
    auditLogs,
  } = useProcurementDetail(id as string);
  const { updateStatus, isUpdating } = useProcurement();
  const { user } = useAuth();

  const [rejectReason, setRejectReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  if (isLoading)
    return (
      <MainLayout>
        <div>Loading...</div>
      </MainLayout>
    );
  if (!request)
    return (
      <MainLayout>
        <div>Data not found</div>
      </MainLayout>
    );

  const canApprove =
    ["SUPER_ADMIN", "UNIT_ADMIN"].includes(getEffectiveRole(user) || "") &&
    request.status === PurchaseRequestStatus.PENDING;
  const canFulfill =
    ["SUPER_ADMIN", "UNIT_ADMIN"].includes(getEffectiveRole(user) || "") &&
    (request.status === PurchaseRequestStatus.APPROVED ||
      request.status === PurchaseRequestStatus.ORDERED);

  const handleApprove = async () => {
    if (confirm("Apakah Anda yakin ingin menyetujui pengajuan ini?")) {
      await updateStatus({
        id: request.id,
        status: PurchaseRequestStatus.APPROVED,
      });
      mutate();
    }
  };

  const handleReject = async () => {
    await updateStatus({
      id: request.id,
      status: PurchaseRequestStatus.REJECTED,
      rejectionReason: rejectReason,
    });
    setIsRejectDialogOpen(false);
    mutate();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/procurement">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Detail Pengajuan: {request.code}
            </h1>
            <p className="text-muted-foreground">
              Dibuat oleh {request.requester?.name} pada{" "}
              {safeFormat(new Date(request.date), "dd MMMM yyyy", {
                locale: idLocale,
              })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Status Pengajuan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                  <span className="font-medium">Status Saat Ini:</span>
                  <Badge
                    className="text-base px-4 py-1"
                    variant={
                      request.status === "REJECTED" ? "destructive" : "default"
                    }
                  >
                    {request.status}
                  </Badge>
                </div>

                {request.rejectionReason && (
                  <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
                    <p className="font-semibold flex items-center gap-2">
                      <XCircle className="h-4 w-4" /> Alasan Penolakan:
                    </p>
                    <p>{request.rejectionReason}</p>
                  </div>
                )}

                {request.status === "PENDING" && (
                  <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
                    <p className="font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" /> Menunggu Persetujuan
                    </p>
                    <p>
                      Mohon periksa anggaran sebelum menyetujui pengajuan ini.
                    </p>
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-4">
                  {canApprove && (
                    <>
                      <Dialog
                        open={isRejectDialogOpen}
                        onOpenChange={setIsRejectDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button variant="destructive">
                            <XCircle className="mr-2 h-4 w-4" /> Tolak
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Tolak Pengajuan</DialogTitle>
                            <DialogDescription>
                              Berikan alasan penolakan untuk pengajuan ini.
                            </DialogDescription>
                          </DialogHeader>
                          <Textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Alasan penolakan..."
                          />
                          <DialogFooter>
                            <Button
                              onClick={handleReject}
                              disabled={isUpdating}
                            >
                              Tolak Pengajuan
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Button
                        onClick={handleApprove}
                        disabled={isUpdating}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" /> Setujui
                      </Button>
                    </>
                  )}

                  {canFulfill && (
                    <FulfillDialog
                      request={request}
                      onSuccess={() => mutate()}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Items List */}
            <Card>
              <CardHeader>
                <CardTitle>Daftar Barang</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Barang</TableHead>
                      <TableHead>Anggaran</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Harga Est.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {request.items?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.itemName}</div>
                          {item.assetCategory && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {item.assetCategory.name}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.budget?.account ? (
                            <div className="text-sm">
                              <p className="font-medium">
                                {item.budget.account.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {item.budget.account.code}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.quantity} {item.unit}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(item.estimatedPrice)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.totalPrice)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4} className="text-right font-bold">
                        Total Estimasi:
                      </TableCell>
                      <TableCell className="text-right font-bold text-lg">
                        {formatCurrency(request.totalEstimated)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Info Detail</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Unit</p>
                  <p className="font-medium">{request.unit?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pemohon</p>
                  <p className="font-medium">{request.requester?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tanggal</p>
                  <p className="font-medium">
                    {safeFormat(new Date(request.date), "dd MMM yyyy", {
                      locale: idLocale,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Deskripsi</p>
                  <p className="whitespace-pre-wrap">
                    {request.description || "-"}
                  </p>
                </div>
                {request.approvedBy && (
                  <div className="pt-4 border-t">
                    <p className="text-muted-foreground">Disetujui Oleh</p>
                    <p className="font-medium">{request.approvedBy.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(
                        new Date(request.approvedAt!),
                        "dd MMM yyyy HH:mm",
                      )}
                    </p>
                  </div>
                )}
                {request.receivedAt && (
                  <div className="pt-4 border-t text-green-700">
                    <p className="font-medium flex items-center gap-2">
                      <CheckCircle className="h-3 w-3" /> Barang Diterima
                    </p>
                    <p className="text-xs">
                      {format(
                        new Date(request.receivedAt),
                        "dd MMM yyyy HH:mm",
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Audit Log / History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-4 w-4" /> Riwayat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditLogs?.map((log: any) => (
                    <div key={log.id} className="flex gap-3 text-sm">
                      <div className="mt-1">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {log.action.replace("PROCUREMENT_", "")}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          oleh {log.user?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {safeFormat(new Date(log.createdAt), "dd MMM HH:mm")}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!auditLogs || auditLogs.length === 0) && (
                    <p className="text-muted-foreground text-sm">
                      Belum ada riwayat.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
