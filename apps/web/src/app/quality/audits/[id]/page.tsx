"use client";
import { useState } from "react";
import { safeFormat } from "@/lib/date";
import { useParams, useRouter } from "next/navigation";

import { id as localeId } from "date-fns/locale";
import { useAuditDetails, useUpdateAuditItem } from "@/hooks/use-quality";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { MainLayout } from "@/components/layout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  Target,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  ClipboardList,
  PenLine,
} from "lucide-react";

function QualityAuditDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const auditId = params.id as string;

  const { data: audit, isLoading } = useAuditDetails(auditId);
  const updateAuditItem = useUpdateAuditItem();

  // Selected item tracking for scoring
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [scoreInput, setScoreInput] = useState<number | "">("");
  const [notesInput, setNotesInput] = useState("");

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h2 className="text-2xl font-bold mb-2">Audit Mutu Tidak Ditemukan</h2>
        <Button onClick={() => router.back()}>Kembali</Button>
      </div>
    );
  }

  const handleStartEdit = (item: any) => {
    setEditingItem(item.id);
    setScoreInput(item.score ?? "");
    setNotesInput(item.notes || "");
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    await updateAuditItem.mutateAsync({
      itemId: editingItem,
      data: {
        score: scoreInput === "" ? undefined : Number(scoreInput),
        notes: notesInput,
      },
    });

    setEditingItem(null);
  };

  const statusColor =
    {
      PLANNED: "bg-slate-100 text-slate-700",
      IN_PROGRESS: "bg-blue-100 text-blue-700",
      COMPLETED: "bg-green-100 text-green-700",
    }[audit.status as string] || "bg-gray-100 text-gray-700";

  // Calculate generic progress based on scored items
  const totalItems = audit.items?.length || 0;
  const scoredItems =
    audit.items?.filter((i: any) => i.score !== null).length || 0;
  const progressPercent =
    totalItems > 0 ? Math.round((scoredItems / totalItems) * 100) : 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Button
        variant="ghost"
        className="mb-2 -ml-4"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Kembali
      </Button>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <PageHeader
              title={audit.name}
              description={`Kode Audit: ${audit.code} | Unit: ${audit.unit?.name}`}
            />
            <Badge
              className={`${statusColor} hover:${statusColor} ml-2 mt-[-24px]`}
            >
              {audit.status}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="text-sm text-muted-foreground">Progres Penilaian</div>
          <div className="flex items-center gap-2">
            <Progress value={progressPercent} className="w-32 h-3" />
            <span className="text-sm font-bold">{progressPercent}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" /> Ringkasan Pelaksanaan Audit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground p-4 bg-muted/20 border rounded-md">
              {audit.notes || "Belum ada catatan umum terkait audit ini."}
            </p>

            <div className="pt-4 border-t grid grid-cols-2 gap-4 text-sm mt-4">
              <div>
                <span className="text-muted-foreground block mb-1">
                  Total Item Diperiksa
                </span>
                <span className="font-semibold text-xl">
                  {totalItems} Standard
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">
                  Rata-rata Skor Sementara
                </span>
                <span className="font-bold text-xl text-primary">
                  {scoredItems > 0
                    ? (
                        audit.items.reduce(
                          (acc: number, cur: any) => acc + (cur.score || 0),
                          0,
                        ) / scoredItems
                      ).toFixed(1)
                    : "0.0"}{" "}
                  / 100
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" /> Detail Administrasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Tahun Akademik</span>
              <span className="font-medium">
                {audit.academicYear?.name || "-"}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Ketua Auditor</span>
              <span className="font-medium">
                {audit.leadAuditor?.name || "-"}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Tgl Mulai</span>
              <span className="font-medium">
                {audit.startDate
                  ? safeFormat(new Date(audit.startDate), "dd MMM yyyy", {
                      locale: localeId,
                    })
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-muted-foreground">
                Tgl Selesai Realisasi
              </span>
              <span className="font-medium">
                {audit.endDate
                  ? safeFormat(new Date(audit.endDate), "dd MMM yyyy", {
                      locale: localeId,
                    })
                  : "-"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="w-5 h-5" /> Instrumen / Borang Penilaian
          </CardTitle>
          <CardDescription>
            Berikan skor dan catatan untuk setiap standar penilaian mutu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {audit.items && audit.items.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {audit.items.map((item: any, idx: number) => (
                <AccordionItem
                  value={item.id}
                  key={item.id}
                  className="border px-4 rounded-lg mb-3 shadow-sm"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex justify-between items-center w-full pr-4">
                      <div className="flex items-center gap-3 text-left">
                        <div className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">
                            [{item.standard?.code}] {item.standard?.name}
                          </div>
                          <div className="text-xs text-muted-foreground font-normal">
                            Aspek: {item.standard?.category || "-"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.score !== null ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200 shrink-0">
                            Skor: {item.score}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-slate-400 shrink-0"
                          >
                            Belum Dinilai
                          </Badge>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 border-t">
                    <div className="mb-4 bg-muted/20 p-4 rounded text-sm text-muted-foreground">
                      {item.standard?.description ||
                        "Tidak ada rincian standar."}
                    </div>

                    {editingItem === item.id ? (
                      <div className="space-y-4 p-4 border border-primary/30 bg-primary/5 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Skor (0-100)
                            </label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={scoreInput}
                              onChange={(e) =>
                                setScoreInput(
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value),
                                )
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Catatan Temuan / Penjelasan Skor
                          </label>
                          <Textarea
                            rows={3}
                            placeholder="Jelaskan alasan pemberian skor..."
                            value={notesInput}
                            onChange={(e) => setNotesInput(e.target.value)}
                          />
                        </div>
                        <div className="flex justify-end gap-2 text-sm mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingItem(null)}
                          >
                            Batal
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={updateAuditItem.isPending}
                          >
                            {updateAuditItem.isPending
                              ? "Menyimpan..."
                              : "Simpan Penilaian"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div className="flex-1 pr-8">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                            Catatan Auditor:
                          </span>
                          <p className="text-sm whitespace-pre-wrap">
                            {item.notes || (
                              <span className="text-muted-foreground italic">
                                Belum ada catatan.
                              </span>
                            )}
                          </p>
                        </div>

                        {(audit.status === "PLANNED" ||
                          audit.status === "IN_PROGRESS") && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleStartEdit(item)}
                          >
                            <PenLine className="w-4 h-4 mr-2" /> Nilai
                          </Button>
                        )}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Belum ada instrumen yang dipetakan pada audit ini.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function QualityAuditDetailPage() {
  return (
    <MainLayout>
      <QualityAuditDetailPageContent />
    </MainLayout>
  );
}
