"use client";
import { useRouter } from "next/navigation";
import { authFileUrl } from "@/lib/files";
import { safeFormat } from "@/lib/date";
import { useCorrespondence } from "@/hooks/use-correspondence";
import { useAuth } from "@/hooks/use-auth";
import { useCorrespondenceParticipants } from "@/hooks/use-correspondence";
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
  ShieldOff,
  PenLine,
  Undo2,
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
import { RevokeSignatureDialog } from "@/components/e-office/revoke-signature-dialog";
import { getPrimaryRoleCode } from "@/lib/rbac";

export default function LetterDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    useLetter,
    submitForReview,
    reviewLetter,
    createDisposition,
    updateDispositionStatus,
  } = useCorrespondence(user?.unitId);
  const [participantSearch, setParticipantSearch] = useState("");
  const { data: participantsData } = useCorrespondenceParticipants({
    search: participantSearch || undefined,
    limit: 100,
  });
  const { data: letter, isLoading } = useLetter(params.id);

  const pdfRef = useRef<HTMLDivElement>(null);
  const [notes, setNotes] = useState("");
  const [dispositionOpen, setDispositionOpen] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [dispositionData, setDispositionData] = useState({
    recipientIds: [] as string[],
    instruction: "",
    deadline: "",
    notes: "",
  });
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [forwardData, setForwardData] = useState({
    nextReviewerId: "",
    isFinalSigner: false,
    notes: "",
  });
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completeNotes, setCompleteNotes] = useState("");
  const [selectedReviewerId, setSelectedReviewerId] = useState<string>("");

  // Find active disposition for current user
  const activeDisposition = letter?.dispositions?.find(
    (d) => d.recipientId === user?.id && d.status !== "COMPLETED",
  );

  /**
   * The letter's signature, and whether it still stands.
   *
   * `signatures` is ordered oldest-first by the API, so the last entry is the
   * one that speaks for the letter now. A revoked signature is deliberately
   * kept and shown: a letter that circulated must be able to explain itself,
   * and "withdrawn, for this reason" is a far more useful answer to whoever
   * holds a printout than silence.
   */
  const latestSignature = letter?.signatures?.at(-1) ?? null;
  const activeSignature = latestSignature?.revokedAt ? null : latestSignature;
  const revokedSignature = latestSignature?.revokedAt ? latestSignature : null;

  // Mirrors the server rule in `utils/esign-revocation.ts`: the signer
  // withdraws their own signature, and Super Admin may act when the signer
  // cannot — or is the problem. Shown, never enforced, here.
  const mayRevokeSignature =
    !!activeSignature &&
    (getPrimaryRoleCode(user) === "SUPER_ADMIN" ||
      letter?.reviewers?.some((r) => r.isSigner && r.reviewerId === user?.id));

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
    if (!letter?.id) return;

    try {
      toast.info("Sedang mengunduh dokumen PDF...");
      const response = await fetch(`/api/correspondence/letters/${letter.id}/pdf`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (!response.ok) {
        throw new Error("Gagal mengunduh file PDF dari server");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Surat-${letter.letterNumber || letter.agendaNumber || "Draft"}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

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

  const handleSubmitDraftForReview = async () => {
    const firstReviewerId = letter.reviewers?.[0]?.reviewerId || selectedReviewerId;
    if (!firstReviewerId) {
      toast.error("Pemeriksa pertama wajib dipilih saat mengajukan review");
      return;
    }
    try {
      await submitForReview.mutateAsync({
        id: letter.id,
        note: notes || "Mengajukan draft untuk ditinjau",
        reviewerIds: letter.reviewers?.length ? undefined : [selectedReviewerId],
      });
      toast.success("Draft surat berhasil diajukan untuk ditinjau");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal mengajukan draft untuk ditinjau");
    }
  };

  const handleForwardReview = async () => {
    const hasExistingSigner = letter.reviewers?.some((r) => r.isSigner);
    if (!forwardData.nextReviewerId && !forwardData.isFinalSigner && !hasExistingSigner) {
      toast.error("Pilih pejabat penerus atau tandai sebagai penandatangan akhir.");
      return;
    }
    try {
      await reviewLetter.mutateAsync({
        id: letter.id,
        action: "APPROVE",
        notes: forwardData.notes || notes,
        nextReviewerId: forwardData.nextReviewerId || undefined,
        isFinalSigner: forwardData.isFinalSigner,
      });
      toast.success(
        forwardData.nextReviewerId
          ? "Surat berhasil disetujui dan diteruskan"
          : "Surat berhasil disetujui"
      );
      setForwardModalOpen(false);
    } catch (error) {
      toast.error("Gagal meneruskan surat");
    }
  };

  const handleCreateDisposition = async () => {
    if ((!dispositionData.recipientIds || dispositionData.recipientIds.length === 0) || !dispositionData.instruction) {
      toast.error("Penerima dan Instruksi wajib diisi");
      return;
    }

    try {
      await createDisposition.mutateAsync({
        letterId: letter.id,
        senderId: user?.id || "",
        recipientIds: dispositionData.recipientIds,
        instruction: dispositionData.instruction,
        deadline: dispositionData.deadline,
        notes: dispositionData.notes,
      });
      toast.success("Disposisi berhasil dibuat");
      setDispositionOpen(false);
      setDispositionData({
        recipientIds: [],
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
      {/* Dialog Forward Concept Letter */}
      <Dialog open={forwardModalOpen} onOpenChange={setForwardModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Setujui & Teruskan Konsep Surat</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Diteruskan Kepada Pejabat/Atasan Berikutnya</Label>
              <Input
                placeholder="Cari pejabat..."
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                className="text-xs mb-1"
              />
              <Select
                onValueChange={(val) =>
                  setForwardData({ ...forwardData, nextReviewerId: val, isFinalSigner: false })
                }
                value={forwardData.nextReviewerId}
                disabled={forwardData.isFinalSigner}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih pejabat penerus..." />
                </SelectTrigger>
                <SelectContent>
                  {participantsData?.data
                    .filter((u) => u.id !== user?.id)
                    .map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nip ? `${u.name} (${u.nip})` : u.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="isFinalSigner"
                checked={forwardData.isFinalSigner}
                onChange={(e) =>
                  setForwardData({
                    ...forwardData,
                    isFinalSigner: e.target.checked,
                    nextReviewerId: e.target.checked ? "" : forwardData.nextReviewerId,
                  })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isFinalSigner" className="text-sm font-medium cursor-pointer">
                Atau tandai untuk langsung diajukan ke Penandatanganan Akhir
              </Label>
            </div>
            <div className="grid gap-2">
              <Label>Catatan / Instruksi Pengulas</Label>
              <Textarea
                placeholder="Catatan pengulasan atau catatan persetujuan..."
                value={forwardData.notes}
                onChange={(e) =>
                  setForwardData({ ...forwardData, notes: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setForwardModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleForwardReview}>Proses & Teruskan</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dispositionOpen} onOpenChange={setDispositionOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Buat Disposisi / Teruskan Surat Masuk</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Diteruskan Kepada (Dapat Memilih Beberapa Penerima)</Label>
              <div className="space-y-2 border rounded-md p-3">
                <Input
                  placeholder="Cari penerima disposisi..."
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  className="text-xs mb-2 bg-white"
                />
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {participantsData?.data.map((u) => (
                    <div key={u.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`disp-rec-${u.id}`}
                        value={u.id}
                        checked={dispositionData.recipientIds.includes(u.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const current = dispositionData.recipientIds;
                          if (checked) {
                            setDispositionData({
                              ...dispositionData,
                              recipientIds: [...current, u.id],
                            });
                          } else {
                            setDispositionData({
                              ...dispositionData,
                              recipientIds: current.filter((id) => id !== u.id),
                            });
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor={`disp-rec-${u.id}`} className="text-sm cursor-pointer">
                        {u.nip ? `${u.name} (${u.nip})` : u.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
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

      <RevokeSignatureDialog
        letterId={letter.id}
        letterNumber={letter.letterNumber}
        open={revokeOpen}
        onOpenChange={setRevokeOpen}
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
          {revokedSignature ? (
            <Badge
              variant="outline"
              className="border-orange-600 text-orange-700 bg-orange-50 gap-1"
            >
              <ShieldOff className="h-3 w-3" />
              Tanda tangan dicabut
            </Badge>
          ) : (
            letter.status === "SIGNED" && (
              <Badge
                variant="outline"
                className="border-green-600 text-green-600 bg-green-50 gap-1"
              >
                <ShieldCheck className="h-3 w-3" />
                Status: Ditandatangani
              </Badge>
            )
          )}
          {/* Labelled when revoked, because an unqualified green "Sudah TTD"
              beside an orange "dicabut" reads as a contradiction. The letter
              really is SIGNED in the agenda — that is what this badge says,
              and saying so removes the ambiguity. */}
          {revokedSignature && (
            <span className="text-xs text-muted-foreground">Status agenda:</span>
          )}
          <LetterStatusBadge status={letter.status} />
        </div>
      </div>

      {/* A withdrawn signature must be the first thing the page says. The
          letter keeps its SIGNED status — it really was signed, and really did
          circulate — so without this the page would still read as valid. */}
      {revokedSignature && (
        <div className="rounded-lg border border-orange-300 bg-orange-50 p-4 text-sm text-orange-900">
          <p className="flex items-center gap-2 font-semibold">
            <ShieldOff className="h-4 w-4" />
            Tanda tangan elektronik surat ini telah dicabut
          </p>
          {revokedSignature.revokedReason && (
            <p className="mt-1">{revokedSignature.revokedReason}</p>
          )}
          <p className="mt-2 text-xs text-orange-800">
            Dicabut{" "}
            {safeFormat(new Date(revokedSignature.revokedAt!), "dd MMMM yyyy HH:mm", {
              locale: id,
            })}
            {revokedSignature.revokedBy?.name
              ? ` oleh ${revokedSignature.revokedBy.name}`
              : ""}
            . Surat ini tidak lagi berlaku, dan halaman verifikasi publik
            menyatakannya demikian kepada siapa pun yang mengunggah berkasnya.
          </p>
        </div>
      )}

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
              {/* The server refuses to regenerate a revoked letter, because a
                  fresh file would not match the hash that was signed and would
                  verify publicly as a forgery. Saying so here beats offering a
                  button that fails. */}
              <Button
                className="w-full"
                variant="outline"
                onClick={handleDownloadPDF}
                disabled={!!revokedSignature}
              >
                <Printer className="mr-2 h-4 w-4" />
                Cetak Surat
              </Button>
              {revokedSignature && (
                <p className="-mt-1 text-xs text-muted-foreground">
                  Naskah yang tanda tangannya sudah dicabut tidak dapat dicetak
                  ulang. Terbitkan surat pengganti bila diperlukan.
                </p>
              )}

              <Button
                className="w-full"
                variant="outline"
                onClick={() => setDispositionOpen(true)}
              >
                <Send className="mr-2 h-4 w-4" />
                Disposisi
              </Button>

              {/*
                Menarik kembali surat yang telanjur beredar.

                Skema dan halaman verifikasi publik sudah lama siap
                menampilkannya; yang tidak pernah ada adalah jalan untuk
                melakukannya, sehingga satu-satunya cara adalah menyunting basis
                data. Wewenangnya tetap ditegakkan server — di sini ia hanya
                menentukan tombolnya ditawarkan atau tidak.
              */}
              {mayRevokeSignature && (
                <Button
                  className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                  variant="outline"
                  onClick={() => setRevokeOpen(true)}
                >
                  <Undo2 className="mr-2 h-4 w-4" />
                  Cabut Tanda Tangan
                </Button>
              )}

              {letter.status === "DRAFT" && letter.createdById === user?.id && (
                <div className="space-y-3 pt-2 border-t">
                  {(!letter.reviewers || letter.reviewers.length === 0) && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-700">Pilih Pemeriksa Pertama</Label>
                      <Input
                        placeholder="Cari pejabat..."
                        value={participantSearch}
                        onChange={(e) => setParticipantSearch(e.target.value)}
                        className="text-xs mb-1"
                      />
                      <Select
                        value={selectedReviewerId}
                        onValueChange={setSelectedReviewerId}
                      >
                        <SelectTrigger className="text-xs bg-white">
                          <SelectValue placeholder="Pilih pemeriksa/atasan..." />
                        </SelectTrigger>
                        <SelectContent>
                          {participantsData?.data.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.nip ? `${u.name} (${u.nip})` : u.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={handleSubmitDraftForReview}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Ajukan Review
                  </Button>
                </div>
              )}

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
                  (r) => r.reviewerId === user?.id,
                );
                const turn = [...reviewers]
                  .filter((r) => r.status !== "APPROVED")
                  .sort((a,b) => a.order - b.order)[0];
                const openForReview =
                  letter.status === "PENDING_REVIEW" ||
                  letter.status === "READY_TO_SIGN";

                if (!mine || !openForReview) return null;

                if (letter.status === "READY_TO_SIGN" && mine.isSigner) {
                  return (
                    <div className="pt-4 border-t space-y-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Penandatanganan
                      </p>
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        size="sm"
                        onClick={() => setSignOpen(true)}
                      >
                        <PenLine className="mr-2 h-4 w-4" />
                        Tandatangani Dokumen
                      </Button>
                    </div>
                  );
                }

                const myTurn =
                  !!mine && turn?.reviewerId === user?.id;

                if (!myTurn) {
                  return (
                    <div className="pt-4 border-t">
                      <p className="text-xs text-muted-foreground">
                        Menunggu verifikator urutan {turn?.order} lebih
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
                          onClick={() => {
                            setForwardData({
                              nextReviewerId: "",
                              isFinalSigner: false,
                              notes: notes,
                            });
                            setForwardModalOpen(true);
                          }}
                        >
                          <CheckCircle className="mr-2 h-3 w-3" />
                          Setuju & Teruskan
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
