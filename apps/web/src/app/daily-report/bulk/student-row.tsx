import { memo } from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { DailyMood } from "@cipansor/shared";

// Re-export StudentEntry interface to ensure consistency
export interface StudentEntry {
  studentId: string;
  name: string;
  isPresent: boolean;
  arrivalTime: string;
  mood: DailyMood | undefined;
  breakfast: string;
  lunch: string;
  activities: string;
  ibadah: string;
  notes: string;
}

const MOOD_OPTIONS: { value: DailyMood; label: string; emoji: string }[] = [
  { value: "HAPPY", label: "Senang", emoji: "😊" },
  { value: "EXCITED", label: "Antusias", emoji: "🤩" },
  { value: "NEUTRAL", label: "Biasa", emoji: "😐" },
  { value: "TIRED", label: "Lelah", emoji: "😴" },
  { value: "SAD", label: "Sedih", emoji: "😢" },
  { value: "SICK", label: "Sakit", emoji: "🤒" },
];

interface StudentRowProps {
  entry: StudentEntry;
  onChange: (id: string, field: keyof StudentEntry, value: any) => void;
}

export const StudentRow = memo(function StudentRow({
  entry,
  onChange,
}: StudentRowProps) {
  return (
    <TableRow className={!entry.isPresent ? "opacity-50 bg-muted/20" : ""}>
      <TableCell>
        <Checkbox
          checked={entry.isPresent}
          onCheckedChange={(checked) =>
            onChange(entry.studentId, "isPresent", !!checked)
          }
        />
      </TableCell>
      <TableCell className="font-medium">{entry.name}</TableCell>
      <TableCell>
        <Input
          type="time"
          className="h-8"
          value={entry.arrivalTime}
          disabled={!entry.isPresent}
          onChange={(e) =>
            onChange(entry.studentId, "arrivalTime", e.target.value)
          }
        />
      </TableCell>
      <TableCell>
        <Select
          value={entry.mood}
          onValueChange={(val) => onChange(entry.studentId, "mood", val)}
          disabled={!entry.isPresent}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MOOD_OPTIONS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.emoji} {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Select
          value={entry.lunch}
          onValueChange={(val) => onChange(entry.studentId, "lunch", val)}
          disabled={!entry.isPresent}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FULL">Habis</SelectItem>
            <SelectItem value="HALF">Setengah</SelectItem>
            <SelectItem value="QUARTER">Sedikit</SelectItem>
            <SelectItem value="NONE">Tidak Mau</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Textarea
          className="min-h-[40px] h-9 py-1 text-sm resize-none"
          value={entry.activities}
          disabled={!entry.isPresent}
          onChange={(e) =>
            onChange(entry.studentId, "activities", e.target.value)
          }
        />
      </TableCell>
      <TableCell>
        <Textarea
          className="min-h-[40px] h-9 py-1 text-sm resize-none"
          value={entry.ibadah}
          disabled={!entry.isPresent}
          onChange={(e) => onChange(entry.studentId, "ibadah", e.target.value)}
        />
      </TableCell>
      <TableCell>
        <Textarea
          className="min-h-[40px] h-9 py-1 text-sm resize-none"
          value={entry.notes}
          disabled={!entry.isPresent}
          onChange={(e) => onChange(entry.studentId, "notes", e.target.value)}
        />
      </TableCell>
    </TableRow>
  );
});
