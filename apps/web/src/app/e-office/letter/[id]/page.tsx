"use client";
import { useRouter } from "next/navigation";
import { authFileUrl } from "@/lib/files";
import { safeFormat } from "@/lib/date";
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
  PenLine,
} from "lucide-react";

import { id } from "date-fns/locale";
import { useState, useRef } from "react";
/**
 * `html2canvas-pro`, not `html2canvas`.
 *
 * Tailwind v4 compiles this app's palette to `lab()` colours, and
 * html2canvas 1.4.1 throws "Attempting to parse an unsupported color function"
 * on the first element whose computed colour is one — which is essentially
 * every element. The download therefore rejected before producing anything,
 * for every letter, and the user only saw "Gagal mengunduh". The pro fork is
 * the same API with modern colour-function support.
 */
import html2canvas from "html2canvas-pro";
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
import {
  LetterType,
  LetterNature,
  LETTER_TYPE_LABELS,
  LETTER_NATURE_LABELS,
} from "@cipansor/shared";
import { LetterFlowHistory } from "@/components/e-office/letter-flow-history";
import { SignLetterDialog } from "@/components/e-office/sign-letter-dialog";

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
  const [signOpen, setSignOpen] = useState(false);
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
      const scale = 2;
      const canvas = await html2canvas(pdfRef.current, { scale, useCORS: true });
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const pxPerMm = canvas.width / pdfWidth;
      const pageHeightPx = pdfHeight * pxPerMm;

      /**
       * Where a page may be cut.
       *
       * The previous version sliced every `pdfHeight` regardless of what was
       * there, so a two-page letter opened page 2 with the bottom half of a
       * line of text and ended it mid-sentence. Paragraphs are marked in the
       * naskah with `data-naskah-block`; their top edges are the offsets where
       * a cut lands between lines instead of through one. A little white space
       * at the foot of a page is the correct trade.
       */
      const naskahTop = pdfRef.current.getBoundingClientRect().top;
      const breakpoints = Array.from(
        pdfRef.current.querySelectorAll("[data-naskah-block]"),
      )
        .map((el) => (el.getBoundingClientRect().top - naskahTop) * scale)
        .filter((y) => y > 0);

      /**
       * Margins for the sheets the naskah itself does not provide.
       *
       * The naskah's own padding only produces white space at the very top of
       * page 1 and the very bottom of the last page. Every cut in between was
       * laid flush against the paper edge, so page 2 of a long letter opened
       * with a line of text touching the top edge and closed with one touching
       * the bottom — underneath the page number, which is drawn over the image.
       * Beyond looking wrong, most printers cannot print within about 5 mm of
       * the edge, so those lines came out clipped on paper.
       *
       * Page 1 keeps its own top margin (the kop is drawn inside it); the
       * bottom margin applies to every page and is where the page number sits.
       */
      const TOP_MARGIN_MM = 15;
      const BOTTOM_MARGIN_MM = 15;
      const usableFirstPx = (pdfHeight - BOTTOM_MARGIN_MM) * pxPerMm;
      const usableRestPx =
        (pdfHeight - TOP_MARGIN_MM - BOTTOM_MARGIN_MM) * pxPerMm;

      const pages: number[] = [0];
      while (true) {
        const top = pages[pages.length - 1];
        const usable = pages.length === 1 ? usableFirstPx : usableRestPx;
        if (top + usable >= canvas.height) break;
        // The last breakpoint that still fits on this page.
        const next = breakpoints.filter((y) => y > top && y <= top + usable).pop();
        // No breakpoint fits (a single block taller than a page) — fall back to
        // a hard cut rather than loop forever.
        pages.push(next ?? top + usable);
      }

      const slice = document.createElement("canvas");
      const sctx = slice.getContext("2d")!;
      pages.forEach((top, i) => {
        // Ends where the next page begins, not a full page-height further on.
        // Taking the full height re-drew the paragraphs that belong to the next
        // page, so a page started cleanly and still ran off mid-sentence.
        const height = (pages[i + 1] ?? canvas.height) - top;
        slice.width = canvas.width;
        slice.height = height;
        sctx.fillStyle = "#ffffff";
        sctx.fillRect(0, 0, slice.width, slice.height);
        sctx.drawImage(canvas, 0, -top);
        if (i > 0) pdf.addPage();
        pdf.addImage(
          slice.toDataURL("image/png"),
          "PNG",
          0,
          // Page 1 begins at the paper edge because the kop already sits inside
          // the naskah's own padding; continuation pages need the margin drawn.
          i === 0 ? 0 : TOP_MARGIN_MM,
          pdfWidth,
          height / pxPerMm,
        );
        // Continuation pages carry no letterhead, so they need to say which
        // page they are — a loose sheet from a five-page edaran otherwise has
        // nothing on it identifying where it belongs.
        if (pages.length > 1) {
          pdf.setFontSize(9);
          pdf.setTextColor(120);
          pdf.text(
            `Halaman ${i + 1} dari ${pages.length}`,
            pdfWidth - 15,
            pdfHeight - 8,
            { align: "right" },
          );
        }
      });

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

      <SignLetterDialog
        letterId={letter.id}
        letterNumber={letter.letterNumber}
        open={signOpen}
        onOpenChange={setSignOpen}
      />

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
                    {safeFormat(new Date(letter.date), "dd MMMM yyyy", {
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
                    Jenis Naskah
                  </label>
                  <p>
                    {letter.type
                      ? LETTER_TYPE_LABELS[letter.type as LetterType]
                      : "Surat Dinas (Korespondensi)"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Sifat
                  </label>
                  {/* Was the raw enum (e.g. "STRICTLY_CONFIDENTIAL"); the
                      label reads as Indonesian, matching the form. */}
                  <p>
                    {LETTER_NATURE_LABELS[letter.nature as LetterNature] ??
                      letter.nature}
                  </p>
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
                      href={authFileUrl(letter.fileUrl)}
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
                  data={authFileUrl(letter.fileUrl)}
                  type="application/pdf"
                  className="w-full h-[600px] rounded border bg-muted"
                >
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mb-2 opacity-50" />
                    <p className="mb-2">Pratinjau tidak tersedia.</p>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={authFileUrl(letter.fileUrl)}
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

          {/* The full flow history: every forward, paraf, return and archive,
              in order. Distinct from the disposition list above, which shows
              only the routing hops; this also captures verification and
              revision, which is what "who returned this and when" needs. */}
          <Card>
            <CardHeader>
              <CardTitle>Histori Alur Surat</CardTitle>
            </CardHeader>
            <CardContent>
              <LetterFlowHistory events={letter.flowEvents} />
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

              {/*
                Verifikasi berjenjang.

                Sebelumnya blok ini bertanda "Mock Logic" dan menampilkan
                Setuju/Tolak kepada siapa pun yang membuka surat. Sejak
                pemeriksaan giliran ditegakkan di server (utils/letter-workflow),
                tombol itu menjanjikan sesuatu yang akan ditolak API. Panel ini
                kini menawarkan persis apa yang akan diterima — dan menyebut
                siapa yang sedang ditunggu bila bukan giliran kita.

                Penandatangan tidak memakai "Setuju": ia menandatangani, dengan
                passphrase. Itulah bedanya paraf dengan tanda tangan.
              */}
              {(() => {
                const reviewers = letter.reviewers ?? [];
                const mine = reviewers.find(
                  (r: any) => r.reviewerId === user?.id,
                );
                const turn = [...reviewers]
                  .filter((r: any) => r.status !== "APPROVED")
                  .sort((a: any, b: any) => a.order - b.order)[0];
                const openForReview =
                  letter.status === "PENDING_REVIEW" ||
                  letter.status === "READY_TO_SIGN";
                const myTurn =
                  !!mine && (turn as any)?.reviewerId === user?.id;

                if (!mine || !openForReview) return null;

                if (!myTurn) {
                  return (
                    <div className="pt-4 border-t">
                      <p className="text-xs text-muted-foreground">
                        Menunggu verifikator urutan {(turn as any)?.order} lebih
                        dahulu.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="pt-4 border-t space-y-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      {mine.isSigner ? "Penandatanganan" : "Paraf / Persetujuan"}
                    </p>
                    <Textarea
                      placeholder="Catatan (opsional)..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="mb-2 text-xs"
                    />
                    <div className="flex gap-2">
                      {mine.isSigner ? (
                        <Button
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          size="sm"
                          onClick={() => setSignOpen(true)}
                        >
                          <PenLine className="mr-2 h-3 w-3" />
                          Tandatangani
                        </Button>
                      ) : (
                        <Button
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          size="sm"
                          onClick={() => handleReview("APPROVE")}
                        >
                          <CheckCircle className="mr-2 h-3 w-3" />
                          Setuju
                        </Button>
                      )}
                      <Button
                        className="flex-1"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleReview("REJECT")}
                      >
                        <XCircle className="mr-2 h-3 w-3" />
                        Kembalikan
                      </Button>
                    </div>
                  </div>
                );
              })()}
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
