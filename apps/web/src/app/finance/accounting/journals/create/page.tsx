"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { useUnits } from "@/hooks/use-units";
import { useAccountCodes } from "@/hooks/use-finance-enhancement";
import { formatCurrency } from "@/lib/utils";

interface JournalRow {
  id: string;
  accountId: string;
  description: string;
  debit: number;
  credit: number;
  reference: string;
}

const createRow = (): JournalRow => ({
  id: crypto.randomUUID(),
  accountId: "",
  description: "",
  debit: 0,
  credit: 0,
  reference: "",
});

export default function CreateManualJournalPage() {
  const router = useRouter();
  const { data: units } = useUnits();
  const { data: accounts } = useAccountCodes({ isActive: true, limit: 200 });

  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [unitId, setUnitId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [rows, setRows] = useState<JournalRow[]>([createRow(), createRow()]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalDebit = rows.reduce((sum, row) => sum + (row.debit || 0), 0);
  const totalCredit = rows.reduce((sum, row) => sum + (row.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const handleAddRow = () => {
    setRows([...rows, createRow()]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 2) return;
    const newRows = [...rows];
    newRows.splice(index, 1);
    setRows(newRows);
  };

  const handleRowChange = (index: number, field: keyof JournalRow, value: string | number) => {
    const newRows = [...rows];
    // @ts-expect-error - value type depends on field but Typescript needs discriminated union which is overkill here
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const handleSubmit = async () => {
    if (!unitId) {
      toast.error("Pilih unit terlebih dahulu");
      return;
    }
    if (!description) {
      toast.error("Deskripsi jurnal wajib diisi");
      return;
    }
    if (!isBalanced) {
      toast.error("Jurnal tidak seimbang (Unbalanced)");
      return;
    }
    if (totalDebit <= 0) {
      toast.error("Nilai jurnal tidak boleh 0");
      return;
    }

    const invalidRow = rows.find(r => !r.accountId);
    if (invalidRow) {
      toast.error("Semua baris harus memiliki akun");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/finance-enhancement/manual-journals", {
        unitId,
        date,
        description,
        items: rows.map(r => ({
          accountId: r.accountId,
          description: r.description,
          debit: r.debit,
          credit: r.credit,
          reference: r.reference
        }))
      });
      toast.success("Jurnal berhasil disimpan");
      router.push("/finance/accounting?tab=journal-entries");
    } catch (error) {
      const message = (error as any).response?.data?.message || "Gagal menyimpan jurnal";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Buat Jurnal Umum"
          description="Input jurnal manual (multi-lines)"
          actions={
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
            </Button>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle>Informasi Dasar</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="date">Tanggal Transaksi</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={unitId} onValueChange={setUnitId}>
                <SelectTrigger aria-label="Unit">
                  <SelectValue placeholder="Pilih Unit" />
                </SelectTrigger>
                <SelectContent>
                  {units?.map((unit: any) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Deskripsi Jurnal</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Penyesuaian stok opname bulan Januari"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Detail Jurnal</CardTitle>
            <Button variant="secondary" size="sm" onClick={handleAddRow}>
              <Plus className="mr-2 h-4 w-4" /> Tambah Baris
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Akun</TableHead>
                    <TableHead>Keterangan (Opsional)</TableHead>
                    <TableHead className="w-[150px]">Debit</TableHead>
                    <TableHead className="w-[150px]">Kredit</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Select
                          value={row.accountId}
                          onValueChange={(val) => handleRowChange(index, "accountId", val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Akun" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts?.data.map((acc) => (
                              <SelectItem key={acc.id} value={acc.id}>
                                <span className="font-mono mr-2">{acc.code}</span>
                                {acc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.description}
                          onChange={(e) => handleRowChange(index, "description", e.target.value)}
                          placeholder={description || "Keterangan baris..."}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={row.debit || ""}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            handleRowChange(index, "debit", val);
                            if (val > 0) handleRowChange(index, "credit", 0);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={row.credit || ""}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            handleRowChange(index, "credit", val);
                            if (val > 0) handleRowChange(index, "debit", 0);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveRow(index)}
                          disabled={rows.length <= 2}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end mt-4 space-x-8 text-sm">
              <div className="flex flex-col items-end">
                <span className="text-muted-foreground">Total Debit</span>
                <span className="font-bold text-lg">{formatCurrency(totalDebit)}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-muted-foreground">Total Kredit</span>
                <span className="font-bold text-lg">{formatCurrency(totalCredit)}</span>
              </div>
              <div className="flex flex-col items-end border-l pl-8">
                <span className="text-muted-foreground">Balance</span>
                <span className={`font-bold text-lg ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                  {isBalanced ? "Seimbang" : "Tidak Seimbang"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting || !isBalanced || totalDebit === 0}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Menyimpan..." : "Simpan Jurnal"}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
