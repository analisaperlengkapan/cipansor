"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useEnrollStudentToExtracurricular } from "@/hooks/use-extracurricular";
import { StudentSelect } from "@/components/shared/student-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AddMemberDialogProps {
  extracurricularId: string;
  unitId?: string; // To filter students by unit
}

export function AddMemberDialog({ extracurricularId, unitId }: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [notes, setNotes] = useState("");

  const enrollMutation = useEnrollStudentToExtracurricular();

  const handleSubmit = async () => {
    if (!studentId) {
      toast.error("Silakan pilih siswa terlebih dahulu");
      return;
    }

    try {
      await enrollMutation.mutateAsync({
        extracurricularId,
        studentId,
        notes,
      });
      toast.success("Siswa berhasil didaftarkan");
      setOpen(false);
      setStudentId("");
      setNotes("");
    } catch (error: any) {
      // toast.error(error.message || "Gagal mendaftarkan siswa");
      // Use fallback error message if object structure differs
      const msg = error?.response?.data?.message || error.message || "Gagal mendaftarkan siswa";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Tambah Anggota
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Anggota Ekstrakurikuler</DialogTitle>
          <DialogDescription>
            Daftarkan siswa baru ke dalam kegiatan ini.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Pilih Siswa</Label>
            <StudentSelect
              value={studentId}
              onValueChange={setStudentId}
              unitId={unitId}
            />
          </div>

          <div className="space-y-2">
            <Label>Catatan (Opsional)</Label>
            <Textarea
              placeholder="Contoh: Memiliki pengalaman lomba..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={enrollMutation.isPending}>
            {enrollMutation.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
