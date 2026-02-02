"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Plus,
  Search,
  Syringe,
  CheckCircle2,
  Clock,
  User,
  ChevronsUpDown,
  Check,
  CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/shared/pagination";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import {
  useImmunizationRecords,
  useCreateImmunizationRecord,
} from "@/hooks/use-health";
import { useStudentSearch } from "@/hooks/use-students";

// --- COMPONENTS ---

function RecordImmunizationDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuthStore();
  const createMutation = useCreateImmunizationRecord();

  // Form State
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [formData, setFormData] = useState({
    vaccineName: "",
    doseNumber: 1,
    administeredDate: new Date(),
    batchNumber: "",
    notes: "",
  });

  // Student Search
  const [searchQuery, setSearchQuery] = useState("");
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const { data: students, isLoading: isLoadingStudents } = useStudentSearch(searchQuery);

  const handleSubmit = async () => {
    if (!user?.unitId || !selectedStudent) return;
    try {
      await createMutation.mutateAsync({
        studentId: selectedStudent.id,
        unitId: user.unitId,
        vaccineName: formData.vaccineName,
        doseNumber: Number(formData.doseNumber),
        administeredDate: formData.administeredDate,
        batchNumber: formData.batchNumber,
        notes: formData.notes,
        status: "COMPLETED",
      });
      toast.success("Imunisasi berhasil dicatat");
      onOpenChange(false);
      // Reset form
      setFormData({
        vaccineName: "",
        doseNumber: 1,
        administeredDate: new Date(),
        batchNumber: "",
        notes: "",
      });
      setSelectedStudent(null);
    } catch {
      toast.error("Gagal mencatat imunisasi");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Catat Imunisasi</DialogTitle>
          <DialogDescription>
            Rekam pemberian vaksin kepada santri.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Santri</Label>
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className="w-full justify-between"
                >
                  {selectedStudent ? selectedStudent.name : "Pilih santri..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Cari nama santri..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandList>
                    {isLoadingStudents && <div className="p-2 text-xs">Mencari...</div>}
                    {!isLoadingStudents && students?.length === 0 && (
                      <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                    )}
                    <CommandGroup>
                      {students?.map((student) => (
                        <CommandItem
                          key={student.id}
                          value={student.id}
                          onSelect={() => {
                            setSelectedStudent(student);
                            setComboboxOpen(false);
                            setSearchQuery("");
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedStudent?.id === student.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {student.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nama Vaksin</Label>
              <Input
                placeholder="Contoh: COVID-19, Flu"
                value={formData.vaccineName}
                onChange={(e) => setFormData({ ...formData, vaccineName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Dosis Ke-</Label>
              <Input
                type="number"
                min={1}
                value={formData.doseNumber}
                onChange={(e) => setFormData({ ...formData, doseNumber: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tanggal Pemberian</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.administeredDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.administeredDate ? (
                    format(formData.administeredDate, "PPP", { locale: localeId })
                  ) : (
                    <span>Pilih tanggal</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.administeredDate}
                  onSelect={(d) => d && setFormData({ ...formData, administeredDate: d })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Nomor Batch (Opsional)</Label>
            <Input
              placeholder="Nomor batch vaksin"
              value={formData.batchNumber}
              onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending || !selectedStudent || !formData.vaccineName}
          >
            {createMutation.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- MAIN PAGE ---

export default function ImmunizationPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: records, isLoading } = useImmunizationRecords({
    page,
    limit: 10,
    vaccineName: search,
  });

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Imunisasi</h1>
          <p className="text-muted-foreground">
            Rekam jejak vaksinasi dan imunisasi santri.
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Catat Imunisasi
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Riwayat Vaksinasi</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari vaksin..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Syringe className="h-8 w-8 animate-bounce text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Santri</TableHead>
                  <TableHead>Vaksin</TableHead>
                  <TableHead>Dosis</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records?.data?.map((record: any) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {record.administeredDate
                        ? format(new Date(record.administeredDate), "dd MMM yyyy", { locale: localeId })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{record.student?.user?.name || "Unknown"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-semibold">
                        {record.vaccineName}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      Ke-{record.doseNumber}
                    </TableCell>
                    <TableCell>
                      {record.status === "COMPLETED" ? (
                        <div className="flex items-center text-green-600 gap-1 text-sm font-medium">
                          <CheckCircle2 className="h-4 w-4" />
                          Selesai
                        </div>
                      ) : (
                        <div className="flex items-center text-yellow-600 gap-1 text-sm font-medium">
                          <Clock className="h-4 w-4" />
                          Pending
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {records?.data?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Belum ada data imunisasi.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {records && records.meta.pagination.totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                page={page}
                totalPages={records.meta.pagination.totalPages}
                pageSize={records.meta.pagination.limit}
                total={records.meta.pagination.total}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <RecordImmunizationDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
    </div>
  );
}
