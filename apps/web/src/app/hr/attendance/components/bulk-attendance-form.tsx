"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useEmployees,
  useUnits,
  useBulkStaffAttendance,
  StaffAttendanceStatus,
  STAFF_ATTENDANCE_STATUS_LABELS,
} from "@/hooks";
import { Loader2, Save, Users } from "lucide-react";
import { toast } from "sonner";

interface BulkAttendanceFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormValues {
  date: string;
  unitId: string;
  records: {
    staffId: string;
    staffName: string;
    status: StaffAttendanceStatus;
    notes?: string;
    selected: boolean;
  }[];
}

export function BulkAttendanceForm({
  onSuccess,
  onCancel,
}: BulkAttendanceFormProps) {
  const [loadingStaff, setLoadingStaff] = useState(false);

  const { register, control, handleSubmit, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      unitId: "",
      records: [],
    },
  });

  const { fields, replace } = useFieldArray({
    control,
    name: "records",
  });

  const selectedUnitId = watch("unitId");
  const selectedDate = watch("date");

  const { data: units } = useUnits();
  const { refetch: fetchEmployees } = useEmployees({
    unitId: selectedUnitId,
    status: "ACTIVE",
    limit: 1000, // Fetch all for bulk
  });

  const bulkAttendanceMutation = useBulkStaffAttendance();

  const handleLoadStaff = async () => {
    if (!selectedUnitId) {
      toast.error("Pilih unit terlebih dahulu");
      return;
    }

    setLoadingStaff(true);
    try {
      const result = await fetchEmployees();
      const staffList = result.data?.data || [];

      if (staffList.length === 0) {
        toast.warning("Tidak ada karyawan aktif di unit ini");
        replace([]);
        return;
      }

      const records = staffList.map((staff) => ({
        staffId: staff.id,
        staffName: staff.fullName,
        status: StaffAttendanceStatus.PRESENT,
        notes: "",
        selected: true,
      }));

      replace(records);
      toast.success(`${staffList.length} karyawan dimuat`);
    } catch (error) {
      toast.error("Gagal memuat data karyawan");
    } finally {
      setLoadingStaff(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    const selectedRecords = data.records.filter((r) => r.selected);

    if (selectedRecords.length === 0) {
      toast.error("Pilih minimal satu karyawan");
      return;
    }

    try {
      await bulkAttendanceMutation.mutateAsync({
        date: data.date,
        records: selectedRecords.map((r) => ({
          staffId: r.staffId,
          status: r.status,
          notes: r.notes,
        })),
      });
      toast.success("Absensi berhasil disimpan");
      onSuccess?.();
    } catch (error) {
      toast.error("Gagal menyimpan absensi");
    }
  };

  const setAllStatus = (status: StaffAttendanceStatus) => {
    const records = watch("records");
    replace(records.map((r) => ({ ...r, status })));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tanggal Absensi</Label>
          <Input type="date" {...register("date", { required: true })} />
        </div>
        <div className="space-y-2">
          <Label>Unit</Label>
          <Controller
            control={control}
            name="unitId"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Unit" />
                </SelectTrigger>
                <SelectContent>
                  {units?.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={handleLoadStaff}
          disabled={!selectedUnitId || loadingStaff}
        >
          {loadingStaff ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Users className="mr-2 h-4 w-4" />
          )}
          Muat Karyawan
        </Button>
      </div>

      {fields.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
            <div className="text-sm font-medium">Setel Semua Ke:</div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                onClick={() => setAllStatus(StaffAttendanceStatus.PRESENT)}
              >
                Hadir
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                onClick={() => setAllStatus(StaffAttendanceStatus.ABSENT)}
              >
                Alpa
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                onClick={() => setAllStatus(StaffAttendanceStatus.LEAVE)}
              >
                Izin
              </Button>
            </div>
          </div>

          <div className="border rounded-md max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={fields.every((_, i) => watch(`records.${i}.selected`))}
                      onCheckedChange={(checked) => {
                        const records = watch("records");
                        replace(
                          records.map((r) => ({ ...r, selected: !!checked }))
                        );
                      }}
                    />
                  </TableHead>
                  <TableHead>Nama Karyawan</TableHead>
                  <TableHead className="w-[150px]">Status</TableHead>
                  <TableHead>Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <Controller
                        control={control}
                        name={`records.${index}.selected`}
                        render={({ field }) => (
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {watch(`records.${index}.staffName`)}
                    </TableCell>
                    <TableCell>
                      <Controller
                        control={control}
                        name={`records.${index}.status`}
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(STAFF_ATTENDANCE_STATUS_LABELS).map(
                                ([key, label]) => (
                                  <SelectItem key={key} value={key}>
                                    {label}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        {...register(`records.${index}.notes`)}
                        className="h-8"
                        placeholder="Catatan..."
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={bulkAttendanceMutation.isPending}
            >
              {bulkAttendanceMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Simpan Absensi
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
