'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Budget } from '@cipansor/shared';
import { Loader2, Plus, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast"; // kept for backward compatibility if needed, but consider using sonner
import { Progress } from "@/components/ui/progress";

// Helper Hooks
const useBudgets = (unitId: string, academicYearId: string) => {
  return useQuery({
    queryKey: ['budgets', unitId, academicYearId],
    queryFn: async () => {
      const res = await api.get(`/finance-enhancement/budgets`, {
        params: { unitId, academicYearId }
      });
      return res.data.data;
    },
    enabled: !!unitId && !!academicYearId
  });
};

const useUnits = () => {
  return useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const res = await api.get('/units');
      return res.data.data;
    }
  });
};

const useAcademicYears = () => {
  return useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const res = await api.get('/academic-years');
      return res.data.data;
    }
  });
};

const useExpenseAccounts = () => {
  return useQuery({
    queryKey: ['accounts', 'EXPENSE'],
    queryFn: async () => {
      const res = await api.get('/finance-enhancement/account-codes', {
        params: { type: 'EXPENSE', limit: 100 }
      });
      return res.data.data;
    }
  });
};

const useCreateBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/finance-enhancement/budgets', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] })
  });
};

export default function BudgetingPage() {
  const { toast } = useToast();

  const { data: units } = useUnits();
  const { data: years } = useAcademicYears();
  const { data: accounts } = useExpenseAccounts();

  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [selectedYearId, setSelectedYearId] = useState<string>('');

  const { data: budgets, isLoading } = useBudgets(selectedUnitId, selectedYearId);
  const createBudget = useCreateBudget();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ accountId: '', amount: 0, notes: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBudget.mutateAsync({
        unitId: selectedUnitId,
        academicYearId: selectedYearId,
        ...formData
      });
      toast({ title: "Success", description: "Budget created successfully" });
      setIsDialogOpen(false);
      setFormData({ accountId: '', amount: 0, notes: '' });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create budget",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Anggaran (Budgeting)</h1>
          <p className="text-muted-foreground">Kelola anggaran pengeluaran per tahun ajaran.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!selectedUnitId || !selectedYearId}>
              <Plus className="mr-2 h-4 w-4" /> Tambah Anggaran
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Buat Anggaran Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Akun Beban (Expense)</Label>
                <Select
                  value={formData.accountId}
                  onValueChange={val => setFormData({...formData, accountId: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Akun" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts?.map((acc: any) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Jumlah Anggaran</Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label>Catatan</Label>
                <Input
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={!formData.accountId || formData.amount <= 0}>
                  Simpan
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Pilih Unit" />
          </SelectTrigger>
          <SelectContent>
            {units?.map((unit: any) => (
              <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedYearId} onValueChange={setSelectedYearId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Pilih Tahun Ajaran" />
          </SelectTrigger>
          <SelectContent>
            {years?.map((year: any) => (
              <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Anggaran</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode Akun</TableHead>
                  <TableHead>Nama Akun</TableHead>
                  <TableHead>Anggaran</TableHead>
                  <TableHead>Terpakai</TableHead>
                  <TableHead>Sisa</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets?.map((budget: Budget) => {
                  const percentage = budget.amount > 0 ? (budget.usedAmount / budget.amount) * 100 : 0;
                  const isOverBudget = percentage > 100;

                  return (
                    <TableRow key={budget.id}>
                      <TableCell className="font-mono">{budget.account?.code}</TableCell>
                      <TableCell className="font-medium">{budget.account?.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(budget.amount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(budget.usedAmount)}</TableCell>
                      <TableCell className="text-right font-bold text-muted-foreground">
                        {formatCurrency(budget.amount - budget.usedAmount)}
                      </TableCell>
                      <TableCell className="w-[200px]">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-xs">
                            <span>{percentage.toFixed(1)}%</span>
                          </div>
                          <Progress
                            value={Math.min(percentage, 100)}
                            className={`h-2 ${isOverBudget ? "bg-red-200" : ""}`}
                            // Note: shadcn Progress color customization might need class overrides on the indicator
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm"><Pencil className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!budgets?.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Belum ada data anggaran.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
