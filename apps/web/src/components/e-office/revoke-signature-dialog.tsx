"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useRevokeLetterSignature } from "@/hooks/use-esign";
import { AlertTriangle, Undo2 } from "lucide-react";

/** Sama dengan MIN_REVOCATION_REASON_LENGTH di server. */
const MIN_REASON = 10;

/**
 * Menarik kembali tanda tangan elektronik pada surat yang telanjur beredar.
 *
 * Dua hal yang wajib terbaca sebelum tombolnya ditekan, dan keduanya tertulis
 * di sini, bukan disembunyikan di balik "Anda yakin?":
 *
 * 1. **Alasannya dibaca publik.** Ia ditampilkan apa adanya di halaman
 *    verifikasi kepada siapa pun yang mengunggah berkas suratnya. Yang menulis
 *    perlu tahu itu sebelum menulis, bukan sesudah.
 * 2. **Tidak dapat dibatalkan.** Tidak ada "batal cabut" — surat yang keliru
 *    dicabut harus diterbitkan ulang dan ditandatangani ulang.
 *
 * Passphrase tidak diminta: mencabut tidak menghasilkan bukti kriptografis
 * baru, ia menyatakan yang lama tidak lagi berlaku.
 */
export function RevokeSignatureDialog({
  letterId,
  letterNumber,
  open,
  onOpenChange,
}: {
  letterId: string;
  letterNumber?: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const revoke = useRevokeLetterSignature();
  const [reason, setReason] = useState("");

  const trimmed = reason.trim();
  const tooShort = trimmed.length < MIN_REASON;

  async function submit() {
    try {
      await revoke.mutateAsync({ letterId, reason: trimmed });
      setReason("");
      onOpenChange(false);
      toast.success("Tanda tangan surat telah dicabut.");
    } catch (e: any) {
      toast.error(
        e?.response?.data?.error?.message ??
          e?.response?.data?.message ??
          "Gagal mencabut tanda tangan surat"
      );
    }
  }

  function close(v: boolean) {
    if (!v) setReason("");
    onOpenChange(v);
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-700">
            <Undo2 className="h-5 w-5" />
            Cabut Tanda Tangan Elektronik
          </DialogTitle>
          <DialogDescription>
            {letterNumber ? `Surat ${letterNumber}` : "Surat ini"} akan
            dinyatakan tidak lagi berlaku. Suratnya tetap tersimpan dalam
            agenda — yang dicabut adalah keabsahan tanda tangannya.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex gap-2 rounded-md border border-orange-300 bg-orange-50 p-3 text-sm text-orange-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium">Alasan ini dibaca publik.</p>
              <p>
                Siapa pun yang mengunggah berkas surat ini ke halaman verifikasi
                akan membacanya apa adanya. Tulislah keterangan yang memang
                pantas dibaca umum — jangan memuat data pribadi atau hal yang
                bersifat rahasia.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="revoke-reason">Alasan pencabutan</Label>
            <Textarea
              id="revoke-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Nomor surat ganda; diterbitkan ulang dengan nomor 512/…"
            />
            <p className="text-xs text-muted-foreground">
              Sekurang-kurangnya {MIN_REASON} karakter
              {tooShort && trimmed.length > 0
                ? ` — kurang ${MIN_REASON - trimmed.length} lagi`
                : ""}
              . Pencabutan tidak dapat dibatalkan; surat yang keliru dicabut
              harus diterbitkan dan ditandatangani ulang.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => close(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={submit}
              disabled={revoke.isPending || tooShort}
            >
              {revoke.isPending ? "Mencabut…" : "Cabut Tanda Tangan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
