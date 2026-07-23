"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { useEsignRequests } from "@/hooks/use-esign";
import { safeFormat } from "@/lib/date";
import { id as idLocale } from "date-fns/locale";
import { ShieldCheck, Clock } from "lucide-react";

/**
 * Antrean persetujuan kunci tanda tangan elektronik — kewenangan Super Admin.
 *
 * Kunci tidak diterbitkan sendiri oleh penggunanya: ia diajukan, lalu disetujui
 * di sini, dan yang menyetujui sekaligus menentukan berapa lama kunci itu
 * berlaku. Masa berlaku ditentukan per persetujuan, bukan konstanta global,
 * supaya yang memberi wewenang menandatangani juga menanggung keputusan berapa
 * lama wewenang itu berlaku.
 *
 * Server tetap memeriksa kewenangan (isSuperAdmin) dan rentang masa berlaku;
 * halaman ini hanya menampilkan pilihan yang sah, tidak menegakkannya.
 */

const DEFAULT_DAYS = 365;
const MIN_DAYS = 30;
const MAX_DAYS = 730;

const KIND_LABEL: Record<string, string> = {
  ENROLLMENT: "Penerbitan",
  RENEWAL: "Perpanjangan",
};

const STATUS_TONE: Record<string, string> = {
  PENDING: "border-blue-600 text-blue-700 bg-blue-50",
  APPROVED: "border-emerald-600 text-emerald-700 bg-emerald-50",
  REJECTED: "border-red-600 text-red-700 bg-red-50",
};

export default function EsignRequestsPage() {
  const { requests, decide } = useEsignRequests();
  const [days, setDays] = useState<Record<string, number>>({});
  const [note, setNote] = useState<Record<string, string>>({});

  const rows: any[] = requests.data ?? [];
  const pending = rows.filter((r) => r.status === "PENDING");
  const decided = rows.filter((r) => r.status !== "PENDING");

  async function submit(id: string, approve: boolean) {
    try {
      await decide.mutateAsync({
        id,
        approve,
        grantedDays: approve ? (days[id] ?? DEFAULT_DAYS) : undefined,
        note: note[id] || undefined,
      });
      toast.success(approve ? "Pengajuan disetujui." : "Pengajuan ditolak.");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Gagal memproses pengajuan");
    }
  }

  return (
    <MainLayout allowedRoles={["SUPER_ADMIN"]}>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Pengajuan Tanda Tangan Elektronik
          </h1>
          <p className="text-sm text-muted-foreground">
            Menyetujui penerbitan dan perpanjangan kunci tanda tangan, beserta
            masa berlakunya.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Menunggu keputusan ({pending.length})
            </CardTitle>
            <CardDescription>
              Masa berlaku {MIN_DAYS}–{MAX_DAYS} hari. Batas atas ada supaya
              persetujuan tidak diam-diam menjadi wewenang seumur hidup.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {requests.isLoading && (
              <p className="text-sm text-muted-foreground">Memuat…</p>
            )}
            {!requests.isLoading && pending.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Tidak ada pengajuan yang menunggu.
              </p>
            )}

            {pending.map((r) => (
              <div key={r.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{r.user?.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {r.user?.email}
                  </span>
                  <Badge variant="outline">{KIND_LABEL[r.kind] ?? r.kind}</Badge>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {safeFormat(new Date(r.createdAt), "dd MMM yyyy HH:mm", {
                      locale: idLocale,
                    })}
                  </span>
                </div>

                {r.reason && (
                  <p className="rounded-md bg-muted/50 p-3 text-sm">{r.reason}</p>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor={`days-${r.id}`}>Masa berlaku (hari)</Label>
                    <Input
                      id={`days-${r.id}`}
                      type="number"
                      min={MIN_DAYS}
                      max={MAX_DAYS}
                      value={days[r.id] ?? DEFAULT_DAYS}
                      onChange={(e) =>
                        setDays({ ...days, [r.id]: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`note-${r.id}`}>Catatan (opsional)</Label>
                    <Textarea
                      id={`note-${r.id}`}
                      value={note[r.id] ?? ""}
                      onChange={(e) =>
                        setNote({ ...note, [r.id]: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => submit(r.id, true)}
                    disabled={decide.isPending}
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Setujui
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => submit(r.id, false)}
                    disabled={decide.isPending}
                  >
                    Tolak
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {decided.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Riwayat keputusan</CardTitle>
              <CardDescription>
                Catatan siapa memberi wewenang menandatangani, kapan, dan untuk
                berapa lama.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {decided.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center gap-2 border-b border-border py-2 text-sm last:border-0"
                >
                  <span className="font-medium">{r.user?.name}</span>
                  <Badge variant="outline">{KIND_LABEL[r.kind] ?? r.kind}</Badge>
                  <Badge variant="outline" className={STATUS_TONE[r.status]}>
                    {r.status === "APPROVED" ? "Disetujui" : "Ditolak"}
                  </Badge>
                  {r.grantedDays && (
                    <span className="text-muted-foreground">
                      {r.grantedDays} hari
                    </span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {r.decidedBy?.name ?? "-"} ·{" "}
                    {r.decidedAt
                      ? safeFormat(new Date(r.decidedAt), "dd MMM yyyy", {
                          locale: idLocale,
                        })
                      : "-"}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
