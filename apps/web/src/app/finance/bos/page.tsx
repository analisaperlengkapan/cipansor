"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout";
import { PageHeader } from "@/components/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Plus,
  RefreshCw,
  Wallet,
  BookOpen,
  Users,
  FileText,
  Wrench,
  Zap,
  GraduationCap,
  ClipboardCheck,
  Building,
  TrendingUp,
  AlertTriangle,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth";
import { useUnits } from "@/hooks/use-units";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

// BOS Component Icons
const componentIcons: Record<string, React.ReactNode> = {
  "BOS-01": <BookOpen className="h-4 w-4" />,
  "BOS-02": <Users className="h-4 w-4" />,
  "BOS-03": <GraduationCap className="h-4 w-4" />,
  "BOS-04": <ClipboardCheck className="h-4 w-4" />,
  "BOS-05": <Building className="h-4 w-4" />,
  "BOS-06": <GraduationCap className="h-4 w-4" />,
  "BOS-07": <Zap className="h-4 w-4" />,
  "BOS-08": <Wrench className="h-4 w-4" />,
};

interface ComponentBreakdown {
  code: string;
  name: string;
  description: string;
  maxPercentage: number;
  maxAllocation: number;
  spent: number;
  remaining: number;
  usagePercentage: number;
  status: "OK" | "WARNING" | "OVER_BUDGET";
}

interface BosSummary {
  unit: {
    id: string;
    name: string;
    type: string;
  };
  period: {
    year: number;
    quarter: string;
  };
  students: {
    total: number;
    bosPerStudent: number;
  };
  budget: {
    estimatedBosAmount: number;
    totalExpenses: number;
    remainingBudget: number;
    usagePercentage: number;
  };
  componentBreakdown: ComponentBreakdown[];
  recentExpenses: any[];
}

interface ValidationResult {
  isCompliant: boolean;
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  issues: Array<{
    code: string;
    severity: "error" | "warning";
    message: string;
  }>;
}

// Hooks
function useBosSummary(unitId: string | null, year: number, quarter?: number) {
  return useQuery<BosSummary>({
    queryKey: ["bos-summary", unitId, year, quarter],
    queryFn: async () => {
      if (!unitId) throw new Error("Unit ID required");
      const params = new URLSearchParams({
        unitId,
        year: year.toString(),
        ...(quarter && { quarter: quarter.toString() }),
      });
      const response = await api.get(`/finance/bos/summary?${params}`);
      return response.data.data;
    },
    enabled: !!unitId,
  });
}

function useBosValidation(unitId: string | null, year: number) {
  return useQuery<ValidationResult>({
    queryKey: ["bos-validation", unitId, year],
    queryFn: async () => {
      if (!unitId) throw new Error("Unit ID required");
      const response = await api.get(`/finance/bos/validate/${unitId}/${year}`);
      return response.data.data;
    },
    enabled: !!unitId,
  });
}

function useBosComponents() {
  return useQuery({
    queryKey: ["bos-components"],
    queryFn: async () => {
      const response = await api.get("/finance/bos/components");
      return response.data.data;
    },
  });
}

function useRecordExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post("/finance/bos/expenses", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bos-summary"] });
      toast.success("Pengeluaran berhasil dicatat");
    },
    onError: () => {
      toast.error("Gagal mencatat pengeluaran");
    },
  });
}

export default function BosPage() {
  const { user } = useAuthStore();
  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    user?.unitId || "",
  );
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState<number | undefined>();
  const [showAddExpenseDialog, setShowAddExpenseDialog] = useState(false);
  const [newExpense, setNewExpense] = useState({
    componentCode: "",
    amount: "",
    description: "",
    receiptNumber: "",
    vendor: "",
  });

  const { data: units } = useUnits();
  const {
    data: summary,
    isLoading: loadingSummary,
    refetch: refetchSummary,
  } = useBosSummary(selectedUnitId, selectedYear, selectedQuarter);
  const { data: validation, refetch: refetchValidation } = useBosValidation(
    selectedUnitId,
    selectedYear,
  );
  const { data: components } = useBosComponents();
  const recordExpenseMutation = useRecordExpense();

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i,
  );
  const quarters = [
    { value: undefined, label: "Semua Triwulan" },
    { value: 1, label: "Triwulan 1 (Jan-Mar)" },
    { value: 2, label: "Triwulan 2 (Apr-Jun)" },
    { value: 3, label: "Triwulan 3 (Jul-Sep)" },
    { value: 4, label: "Triwulan 4 (Okt-Des)" },
  ];

  const handleRefresh = () => {
    refetchSummary();
    refetchValidation();
    toast.success("Data BOS berhasil diperbarui");
  };

  const handleAddExpense = async () => {
    if (
      !selectedUnitId ||
      !newExpense.componentCode ||
      !newExpense.amount ||
      !newExpense.description
    ) {
      toast.error("Lengkapi semua field yang diperlukan");
      return;
    }

    await recordExpenseMutation.mutateAsync({
      unitId: selectedUnitId,
      componentCode: newExpense.componentCode,
      date: new Date().toISOString(),
      amount: parseFloat(newExpense.amount),
      description: newExpense.description,
      receiptNumber: newExpense.receiptNumber || undefined,
      vendor: newExpense.vendor || undefined,
    });

    setNewExpense({
      componentCode: "",
      amount: "",
      description: "",
      receiptNumber: "",
      vendor: "",
    });
    setShowAddExpenseDialog(false);
  };

  const handleExportReport = async () => {
    if (!selectedUnitId) {
      toast.error("Pilih unit terlebih dahulu");
      return;
    }

    try {
      const response = await api.get(
        `/finance/bos/transparency/${selectedUnitId}/${selectedYear}`,
      );
      const data = response.data.data;

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laporan_bos_${selectedYear}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Laporan berhasil diunduh");
    } catch {
      toast.error("Gagal mengunduh laporan");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OK":
        return "text-green-600";
      case "WARNING":
        return "text-yellow-600";
      case "OVER_BUDGET":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OK":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Aman
          </Badge>
        );
      case "WARNING":
        return (
          <Badge variant="default" className="bg-yellow-100 text-yellow-800">
            Perhatian
          </Badge>
        );
      case "OVER_BUDGET":
        return <Badge variant="destructive">Melebihi</Badge>;
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Dana BOS/BOP"
          description="Pengelolaan Dana Bantuan Operasional Sekolah sesuai Permendikbud"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Keuangan", href: "/finance" },
            { label: "Dana BOS" },
          ]}
        />

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Filter Data</CardTitle>
                <CardDescription>
                  Pilih unit dan periode untuk melihat data BOS
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportReport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih unit..." />
                </SelectTrigger>
                <SelectContent>
                  {units?.map((unit: { id: string; name: string }) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedYear.toString()}
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tahun..." />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedQuarter?.toString() || "all"}
                onValueChange={(v) =>
                  setSelectedQuarter(v === "all" ? undefined : parseInt(v))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih triwulan..." />
                </SelectTrigger>
                <SelectContent>
                  {quarters.map((q) => (
                    <SelectItem
                      key={q.value ?? "all"}
                      value={q.value?.toString() || "all"}
                    >
                      {q.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedUnitId && summary && (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Ringkasan</TabsTrigger>
              <TabsTrigger value="components">8 Komponen</TabsTrigger>
              <TabsTrigger value="expenses">Pengeluaran</TabsTrigger>
              <TabsTrigger value="compliance">Kepatuhan</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Estimasi Dana BOS
                    </CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(summary.budget.estimatedBosAmount)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {summary.students.total} siswa ×{" "}
                      {formatCurrency(summary.students.bosPerStudent)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Pengeluaran
                    </CardTitle>
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(summary.budget.totalExpenses)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {summary.budget.usagePercentage}% dari estimasi
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Sisa Anggaran
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${summary.budget.remainingBudget >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {formatCurrency(summary.budget.remainingBudget)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {summary.budget.remainingBudget >= 0
                        ? "Masih tersedia"
                        : "Melebihi anggaran"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Status Kepatuhan
                    </CardTitle>
                    {validation?.isCompliant ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {validation?.isCompliant ? "Patuh" : "Perlu Perhatian"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {validation?.totalIssues || 0} masalah ditemukan
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Usage Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Penggunaan Anggaran</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress Penggunaan</span>
                      <span className="font-medium">
                        {summary.budget.usagePercentage}%
                      </span>
                    </div>
                    <Progress
                      value={summary.budget.usagePercentage}
                      className="h-4"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Components Tab */}
            <TabsContent value="components" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />8 Komponen BOS
                  </CardTitle>
                  <CardDescription>
                    Breakdown penggunaan dana sesuai 8 komponen Permendikbud
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Komponen</TableHead>
                        <TableHead className="text-right">Maks %</TableHead>
                        <TableHead className="text-right">
                          Alokasi Maks
                        </TableHead>
                        <TableHead className="text-right">Terpakai</TableHead>
                        <TableHead className="text-right">Sisa</TableHead>
                        <TableHead className="text-center">Progress</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.componentBreakdown.map((component) => (
                        <TableRow key={component.code}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {componentIcons[component.code]}
                              <div>
                                <p className="font-medium">{component.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {component.code}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {component.maxPercentage}%
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(component.maxAllocation)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(component.spent)}
                          </TableCell>
                          <TableCell
                            className={`text-right ${component.remaining >= 0 ? "" : "text-red-600"}`}
                          >
                            {formatCurrency(component.remaining)}
                          </TableCell>
                          <TableCell className="w-32">
                            <Progress
                              value={Math.min(component.usagePercentage, 100)}
                              className={`h-2 ${component.status === "OVER_BUDGET" ? "bg-red-200" : ""}`}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(component.status)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Expenses Tab */}
            <TabsContent value="expenses" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Pengeluaran BOS</CardTitle>
                      <CardDescription>
                        Catatan pengeluaran dana BOS
                      </CardDescription>
                    </div>
                    <Dialog
                      open={showAddExpenseDialog}
                      onOpenChange={setShowAddExpenseDialog}
                    >
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Catat Pengeluaran
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Catat Pengeluaran BOS</DialogTitle>
                          <DialogDescription>
                            Masukkan detail pengeluaran dana BOS
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Komponen *</Label>
                            <Select
                              value={newExpense.componentCode}
                              onValueChange={(v) =>
                                setNewExpense({
                                  ...newExpense,
                                  componentCode: v,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih komponen..." />
                              </SelectTrigger>
                              <SelectContent>
                                {components?.map((c: any) => (
                                  <SelectItem key={c.code} value={c.code}>
                                    {c.code} - {c.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Jumlah (Rp) *</Label>
                            <Input
                              type="number"
                              value={newExpense.amount}
                              onChange={(e) =>
                                setNewExpense({
                                  ...newExpense,
                                  amount: e.target.value,
                                })
                              }
                              placeholder="0"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Deskripsi *</Label>
                            <Textarea
                              value={newExpense.description}
                              onChange={(e) =>
                                setNewExpense({
                                  ...newExpense,
                                  description: e.target.value,
                                })
                              }
                              placeholder="Jelaskan penggunaan dana..."
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>No. Kwitansi</Label>
                              <Input
                                value={newExpense.receiptNumber}
                                onChange={(e) =>
                                  setNewExpense({
                                    ...newExpense,
                                    receiptNumber: e.target.value,
                                  })
                                }
                                placeholder="KW-001"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Vendor/Supplier</Label>
                              <Input
                                value={newExpense.vendor}
                                onChange={(e) =>
                                  setNewExpense({
                                    ...newExpense,
                                    vendor: e.target.value,
                                  })
                                }
                                placeholder="Nama vendor"
                              />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setShowAddExpenseDialog(false)}
                          >
                            Batal
                          </Button>
                          <Button
                            onClick={handleAddExpense}
                            disabled={recordExpenseMutation.isPending}
                          >
                            {recordExpenseMutation.isPending
                              ? "Menyimpan..."
                              : "Simpan"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {summary.recentExpenses &&
                  summary.recentExpenses.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Komponen</TableHead>
                          <TableHead>Deskripsi</TableHead>
                          <TableHead className="text-right">Jumlah</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {summary.recentExpenses.map(
                          (expense: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>
                                {new Date(expense.date).toLocaleDateString(
                                  "id-ID",
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {expense.componentCode}
                                </Badge>
                              </TableCell>
                              <TableCell>{expense.description}</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(expense.amount)}
                              </TableCell>
                            </TableRow>
                          ),
                        )}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Belum ada pengeluaran tercatat</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Compliance Tab */}
            <TabsContent value="compliance" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {validation?.isCompliant ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <CardTitle>Status Kepatuhan BOS</CardTitle>
                        <CardDescription>
                          Validasi penggunaan dana sesuai ketentuan Permendikbud
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant={
                        validation?.isCompliant ? "default" : "destructive"
                      }
                    >
                      {validation?.isCompliant ? "Patuh" : "Tidak Patuh"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {validation?.issues && validation.issues.length > 0 ? (
                    <div className="space-y-4">
                      {validation.issues.map((issue, index) => (
                        <div
                          key={index}
                          className={`flex items-start gap-3 p-3 rounded-lg ${
                            issue.severity === "error"
                              ? "bg-red-50"
                              : "bg-yellow-50"
                          }`}
                        >
                          {issue.severity === "error" ? (
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          )}
                          <div>
                            <p className="font-medium">{issue.code}</p>
                            <p className="text-sm text-muted-foreground">
                              {issue.message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
                      <p className="font-medium">
                        Penggunaan BOS Sesuai Ketentuan
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Tidak ada masalah kepatuhan ditemukan
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Compliance Guidelines */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Panduan Kepatuhan BOS
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="font-medium">Ketentuan Umum</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Dana BOS hanya untuk 8 komponen yang ditetapkan</li>
                        <li>
                          Setiap komponen memiliki batas maksimum penggunaan
                        </li>
                        <li>Wajib dilaporkan secara transparan</li>
                        <li>Bukti pengeluaran harus disimpan</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Larangan Penggunaan</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Tidak untuk pembelian kendaraan</li>
                        <li>Tidak untuk pembangunan gedung baru</li>
                        <li>Tidak untuk investasi/deposito</li>
                        <li>Tidak untuk kepentingan pribadi</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {!selectedUnitId && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Pilih unit untuk melihat data BOS</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
