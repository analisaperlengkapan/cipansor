"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarIcon, Plus, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  useCreateAchievement,
  ACHIEVEMENT_LEVELS,
  ExtracurricularAchievement,
} from "@/hooks/use-extracurricular";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";

interface AchievementDialogProps {
  extracurricularId: string;
  unitId?: string;
}

export function AchievementDialog({ extracurricularId, unitId }: AchievementDialogProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());

  // Form State
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState<ExtracurricularAchievement["level"]>("SCHOOL");
  const [rank, setRank] = useState("");
  const [description, setDescription] = useState("");
  const [participantIds, setParticipantIds] = useState<string[]>([]);

  // Temporary state for adding a participant
  const [tempStudentId, setTempStudentId] = useState("");

  const createMutation = useCreateAchievement();

  const handleAddParticipant = (id: string) => {
    if (id && !participantIds.includes(id)) {
      setParticipantIds([...participantIds, id]);
    }
    setTempStudentId(""); // Reset select
  };

  const removeParticipant = (id: string) => {
    setParticipantIds(participantIds.filter((p) => p !== id));
  };

  const handleSubmit = async () => {
    if (!title) {
      toast.error("Judul prestasi wajib diisi");
      return;
    }

    try {
      await createMutation.mutateAsync({
        extracurricularId,
        title,
        level,
        rank,
        description,
        date: date.toISOString(),
        participantIds,
      });
      toast.success("Prestasi berhasil ditambahkan");
      setOpen(false);

      // Reset form
      setTitle("");
      setLevel("SCHOOL");
      setRank("");
      setDescription("");
      setParticipantIds([]);
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || "Gagal menyimpan prestasi";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Prestasi
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Catat Prestasi Baru</DialogTitle>
          <DialogDescription>
            Dokumentasikan pencapaian atau kemenangan dalam kegiatan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Judul/Nama Kegiatan</Label>
            <Input
              placeholder="Contoh: Juara 1 Lomba Futsal Antar Sekolah"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tingkat</Label>
              <Select value={level} onValueChange={(v) => setLevel(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACHIEVEMENT_LEVELS.map((lvl) => (
                    <SelectItem key={lvl.value} value={lvl.value}>
                      {lvl.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Peringkat/Hasil</Label>
              <Input
                placeholder="Contoh: Juara 1"
                value={rank}
                onChange={(e) => setRank(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tanggal</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: localeId }) : <span>Pilih tanggal</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Deskripsi</Label>
            <Textarea
              placeholder="Ceritakan detail prestasi..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Peserta (Siswa)</Label>
            <StudentSelect
              value={tempStudentId}
              onValueChange={handleAddParticipant}
              unitId={unitId}
              className="mb-2"
            />

            {participantIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 p-2 border rounded-md bg-muted/20">
                {participantIds.map((pid) => (
                  <Badge key={pid} variant="secondary" className="pl-2 pr-1 py-1">
                    {/* Note: StudentSelect doesn't expose the name easily unless we fetch it.
                        Ideally we'd have the student object. For now we just show ID or "Peserta".
                        Actually, improving UX: StudentSelect only gives ID.
                        Real solution: StudentSelect should pass full object or we fetch list.
                        For now, showing "Siswa terpilih" isn't great.

                        Workaround: We trust the user knows who they added or we fetch names.
                        Wait, StudentSelect keeps internal state.

                        Better: Let's assume the user adds one by one.
                    */}
                    Siswa ID: {pid.substring(0, 8)}...
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1 hover:bg-transparent"
                      onClick={() => removeParticipant(pid)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              *Pilih siswa satu per satu untuk menambahkannya ke daftar peserta.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
