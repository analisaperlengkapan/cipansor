"use client";
import { useState } from "react";
import { safeFormat } from "@/lib/date";
import {
  useEmploymentHistory,
  useCreateEmploymentHistory,
  EmploymentAction,
} from "@/hooks/use-employment-history";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Briefcase } from "lucide-react";

const ACTIONS: EmploymentAction[] = [
  "HIRED",
  "PROMOTED",
  "DEMOTED",
  "TRANSFERRED",
  "TERMINATED",
  "RESIGNED",
  "RETIRED",
  "SALARY_ADJUSTMENT",
];

export function HistoryTab({ userId }: { userId: string }) {
  const { data: history, isLoading } = useEmploymentHistory(userId);
  const createHistory = useCreateEmploymentHistory();
  const [isOpen, setIsOpen] = useState(false);

  const [formData, setFormData] = useState({
    action: "PROMOTED" as EmploymentAction,
    newPosition: "",
    newDepartment: "",
    previousPosition: "",
    effectiveDate: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createHistory.mutateAsync({
        userId,
        action: formData.action,
        newPosition: formData.newPosition,
        newDepartment: formData.newDepartment || undefined,
        previousPosition: formData.previousPosition || undefined,
        effectiveDate: new Date(formData.effectiveDate).toISOString(),
        notes: formData.notes,
      });
      setIsOpen(false);
      setFormData({
        action: "PROMOTED",
        newPosition: "",
        newDepartment: "",
        previousPosition: "",
        effectiveDate: "",
        notes: "",
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Riwayat Karir</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="w-4 h-4 mr-2" /> Catat Mutasi/Promosi
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Catat Riwayat Pekerjaan</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Jenis Tindakan</Label>
                <Select
                  value={formData.action}
                  onValueChange={(val) =>
                    setFormData({
                      ...formData,
                      action: val as EmploymentAction,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIONS.map((action) => (
                      <SelectItem key={action} value={action}>
                        {action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Posisi Baru</Label>
                  <Input
                    value={formData.newPosition}
                    onChange={(e) =>
                      setFormData({ ...formData, newPosition: e.target.value })
                    }
                    placeholder="Contoh: Kepala Sekolah"
                    required
                  />
                </div>
                <div>
                  <Label>Departemen Baru</Label>
                  <Input
                    value={formData.newDepartment}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        newDepartment: e.target.value,
                      })
                    }
                    placeholder="Contoh: Akademik"
                  />
                </div>
              </div>
              <div>
                <Label>Posisi Sebelumnya (Opsional)</Label>
                <Input
                  value={formData.previousPosition}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      previousPosition: e.target.value,
                    })
                  }
                  placeholder="Contoh: Guru Kelas"
                />
              </div>
              <div>
                <Label>Tanggal Efektif</Label>
                <Input
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) =>
                    setFormData({ ...formData, effectiveDate: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label>Catatan</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>
              <Button
                type="submit"
                disabled={createHistory.isPending}
                className="w-full"
              >
                Simpan
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative border-l border-gray-200 dark:border-gray-700 ml-3 space-y-8">
        {history?.map((item) => (
          <div key={item.id} className="mb-10 ml-6">
            <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white dark:ring-gray-900 dark:bg-blue-900">
              <Briefcase className="w-3 h-3 text-blue-800 dark:text-blue-300" />
            </span>
            <div className="items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm sm:flex dark:bg-gray-700 dark:border-gray-600">
              <div className="time mb-1 text-xs font-normal text-gray-400 sm:order-last sm:mb-0">
                {safeFormat(new Date(item.effectiveDate), "dd MMMM yyyy")}
              </div>
              <div className="text-sm font-normal text-gray-500 dark:text-gray-300">
                <span className="font-bold text-gray-900 dark:text-white">
                  {item.action}
                </span>{" "}
                - Position:{" "}
                <span className="font-semibold">{item.newPosition}</span>
                {item.notes && (
                  <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                    {item.notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {history?.length === 0 && (
          <div className="ml-6 text-gray-500">Belum ada riwayat.</div>
        )}
      </div>
    </div>
  );
}
