"use client";

import { useRouter } from "next/navigation";
import { useCorrespondence } from "@/hooks/use-correspondence";
import { useAuth } from "@/hooks/use-auth";
import { useTeachers } from "@/hooks/use-teachers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LetterStatusBadge } from "@/components/e-office/letter-status-badge";
import { DispositionTimeline } from "@/components/e-office/disposition-timeline";
import { LetterPDFTemplate } from "@/components/e-office/letter-pdf-template";
import {
  ArrowLeft,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Printer,
  ShieldCheck,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function LetterDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    useLetter,
    reviewLetter,
    createDisposition,
    updateDispositionStatus,
  } = useCorrespondence(user?.unitId);
  const { data: teachers } = useTeachers({
    page: 1,
    limit: 100,
    unitId: user?.unitId,
  });
  const { data: letter, isLoading } = useLetter(params.id);

  const pdfRef = useRef<HTMLDivElement>(null);
  const [notes, setNotes] = useState("");
  const [dispositionOpen, setDispositionOpen] = useState(false);
  const [dispositionData, setDispositionData] = useState({
    recipientId: "",
    instruction: "",
    deadline: "",
    notes: "",
  });
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completeNotes, setCompleteNotes] = useState("");

  // Find active disposition for current user
  const activeDisposition = letter?.dispositions?.find(
    (d) => d.recipientId === user?.id && d.status !== "COMPLETED",
  );

  const handleUpdateDisposition = async (
    status: "IN_PROGRESS" | "COMPLETED",
    notes?: string,
  ) => {
    if (!activeDisposition) return;
    try {
      await updateDispositionStatus.mutateAsync({
        id: activeDisposition.id,
        status,
        notes,
      });
      toast.success("Status disposisi diperbarui");
    } catch (error) {
      toast.error("Gagal memperbarui status");
    }
  };

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;

    try {
      toast.info("Sedang menyiapkan PDF...");
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const ratio = pdfWidth / imgWidth;
      const scaledHeight = imgHeight * ratio;

      let heightLeft = scaledHeight;
      let position = 0;
      let page = 1;

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, scaledHeight);
      heightLeft -= pdfHeight;

      // Add remaining pages
      while (heightLeft > 0) {
        position = heightLeft - scaledHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, scaledHeight);
        heightLeft -= pdfHeight;
        page++;
      }

      pdf.save(`Surat-${letter?.letterNumber || "Draft"}.pdf`);
      toast.success("Surat berhasil diunduh");
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengunduh surat");
    }
  };

  const isUpdating = updateDispositionStatus.isPending;

  if (isLoading) {
    return <div className="p-6 text-center">Memuat data surat...</div>;
  }

  if (!letter) {
    return <div className="p-6 text-center">Surat tidak ditemukan.</div>;
  }

  const handleReview = async (action: "APPROVE" | "REJECT") => {
    try {
      await reviewLetter.mutateAsync({ id: letter.id, action, notes });
      toast.success(
        `Surat berhasil ${action === "APPROVE" ? "disetujui" : "ditolak"}`,
      );
    } catch (error) {
      toast.error("Gagal memproses review");
    }
  };

  const handleCreateDisposition = async () => {
    if (!dispositionData.recipientId || !dispositionData.instruction) {
      toast.error("Penerima dan Instruksi wajib diisi");
      return;
    }

    try {
      await createDisposition.mutateAsync({
        letterId: letter.id,
        senderId: user?.id || "",
        recipientId: dispositionData.recipientId,
        instruction: dispositionData.instruction,
        deadline: dispositionData.deadline,
        notes: dispositionData.notes,
      });
      toast.success("Disposisi berhasil dibuat");
      setDispositionOpen(false);
      setDispositionData({
        recipientId: "",
        instruction: "",
        deadline: "",
        notes: "",
      });
    } catch (error) {
      toast.error("Gagal membuat disposisi");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <Dialog open={dispositionOpen} onOpenChange={setDispositionOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Buat Disposisi</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Diteruskan Kepada</Label>
              <Select
                onValueChange={(val) =>
                  setDispositionData({ ...dispositionData, recipientId: val })
                }
                value={dispositionData.recipientId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih penerima..." />
                </SelectTrigger>
                <SelectContent>
                  {teachers?.data.map((t: any) => (
                    <SelectItem key={t.userId} value={t.userId}>
                      {t.user?.name || t.nip}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Instruksi</Label>
              <Textarea
                placeholder="Isi instruksi disposisi..."
                value={dispositionData.instruction}
                onChange={(e) =>
                  setDispositionData({
                    ...dispositionData,
                    instruction: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Batas Waktu</Label>
              <Input
                type="date"
                value={dispositionData.deadline}
                onChange={(e) =>
                  setDispositionData({
                    ...dispositionData,
                    deadline: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Catatan Tambahan</Label>
              <Textarea
                placeholder="Catatan (opsional)..."
                value={dispositionData.notes}
                onChange={(e) =>
                  setDispositionData({
                    ...dispositionData,
                    notes: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDispositionOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleCreateDisposition}>Kirim Disposisi</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Selesaikan Disposisi</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Catatan Penyelesaian</Label>
              <Textarea
                placeholder="Tuliskan laporan hasil tindak lanjut..."
                value={completeNotes}
                onChange={(e) => setCompleteNotes(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setCompleteDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              onClick={async () => {
                await handleUpdateDisposition("COMPLETED", completeNotes);
                setCompleteDialogOpen(false);
              }}
              disabled={isUpdating}
            >
              {isUpdating ? "Menyimpan..." : "Selesai"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden PDF Template */}
      <div className="fixed left-[-9999px] top-0">
        <LetterPDFTemplate ref={pdfRef} letter={letter} />
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Detail Surat</h1>
          <p className="text-muted-foreground text-sm">
            {letter.letterNumber || letter.agendaNumber || "Draft"}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {letter.status === "SIGNED" && (
            <Badge
              variant="outline"
              className="border-green-600 text-green-600 bg-green-50 gap-1"
            >
              <ShieldCheck className="h-3 w-3" />
              Status: Ditandatangani
            </Badge>
          )}
          <LetterStatusBadge status={letter.status} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Surat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Perihal
                  </label>
                  <p className="font-medium">{letter.subject}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Tanggal
                  </label>
                  <p>
                    {format(new Date(letter.date), "dd MMMM yyyy", {
                      locale: id,
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Pengirim
                  </label>
                  <p>{letter.senderName || letter.senderInstance || "-"}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Penerima
                  </label>
                  <p>
                    {letter.recipientName || letter.recipientInstance || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Sifat
                  </label>
                  <p>{letter.nature}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Urgensi
                  </label>
                  <p>{letter.urgency}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Isi Ringkas
                </label>
                <div className="mt-1 p-3 bg-muted/30 rounded-md text-sm whitespace-pre-wrap">
                  {letter.content || "-"}
                </div>
              </div>

              {letter.fileUrl && (
                <div className="flex items-center gap-2 p-3 border rounded-md">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium flex-1">
                    Lampiran Surat.pdf
                  </span>
                  <Button variant="ghost" size="sm" asChild>
                    <a
                      href={letter.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {letter.fileUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Pratinjau Naskah
                </CardTitle>
              </CardHeader>
              <CardContent>
                <object
                  data={letter.fileUrl}
                  type="application/pdf"
                  className="w-full h-[600px] rounded border bg-muted"
                >
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mb-2 opacity-50" />
                    <p className="mb-2">Pratinjau tidak tersedia.</p>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={letter.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Unduh Dokumen
                      </a>
                    </Button>
                  </div>
                </object>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Riwayat Disposisi</CardTitle>
            </CardHeader>
            <CardContent>
              <DispositionTimeline dispositions={letter.dispositions} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Active Disposition Action Card */}
          {activeDisposition && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-800">
                  Tindak Lanjut Disposisi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-blue-700">
                  Instruksi: <strong>"{activeDisposition.instruction}"</strong>
                </p>
                <div className="flex gap-2">
                  {activeDisposition.status === "PENDING" && (
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      size="sm"
                      onClick={() => handleUpdateDisposition("IN_PROGRESS")}
                      disabled={isUpdating}
                    >
                      {isUpdating ? "Memproses..." : "Mulai"}
                    </Button>
                  )}
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="sm"
                    onClick={() => setCompleteDialogOpen(true)}
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Memproses..." : "Selesai"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Aksi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                variant="outline"
                onClick={handleDownloadPDF}
              >
                <Printer className="mr-2 h-4 w-4" />
                Cetak Surat
              </Button>

              <Button
                className="w-full"
                variant="outline"
                onClick={() => setDispositionOpen(true)}
              >
                <Send className="mr-2 h-4 w-4" />
                Disposisi
              </Button>

              {/* Approval Actions (Mock Logic - should check if user is current reviewer) */}
              <div className="pt-4 border-t space-y-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Persetujuan
                </p>
                <Textarea
                  placeholder="Catatan persetujuan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mb-2 text-xs"
                />
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    size="sm"
                    onClick={() => handleReview("APPROVE")}
                  >
                    <CheckCircle className="mr-2 h-3 w-3" />
                    Setuju
                  </Button>
                  <Button
                    className="flex-1"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleReview("REJECT")}
                  >
                    <XCircle className="mr-2 h-3 w-3" />
                    Tolak
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {letter.reviewers?.map((reviewer, index) => (
                  <div
                    key={reviewer.id}
                    className="flex items-start gap-3 text-sm"
                  >
                    <div
                      className={`
                      flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                      ${
                        reviewer.status === "APPROVED"
                          ? "bg-green-100 text-green-700"
                          : reviewer.status === "REJECTED"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                      }
                    `}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{reviewer.reviewerName}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {reviewer.status.toLowerCase().replace("_", " ")}
                      </p>
                      {reviewer.notes && (
                        <p className="text-xs mt-1 bg-muted p-2 rounded">
                          "{reviewer.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {(!letter.reviewers || letter.reviewers.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center">
                    Tidak ada reviewer assigned.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
