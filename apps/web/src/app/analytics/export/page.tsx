"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Download,
  FileSpreadsheet,
  Users,
  Calendar,
  Banknote,
  BookOpen,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";

interface ExportType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  endpoint: string;
}

const EXPORT_TYPES: ExportType[] = [
  {
    id: "students",
    name: "Data Siswa",
    description: "Export daftar siswa lengkap dengan informasi kelas dan wali",
    icon: <Users className="h-5 w-5" />,
    endpoint: "/analytics/export/students",
  },
  {
    id: "attendance",
    name: "Data Kehadiran",
    description: "Export rekap kehadiran siswa per periode",
    icon: <Calendar className="h-5 w-5" />,
    endpoint: "/analytics/export/attendance",
  },
  {
    id: "finance",
    name: "Data Keuangan",
    description: "Export data tagihan dan pembayaran",
    icon: <Banknote className="h-5 w-5" />,
    endpoint: "/analytics/export/finance",
  },
  {
    id: "tahfidz",
    name: "Data Tahfidz",
    description: "Export rekap hafalan Al-Quran santri",
    icon: <BookOpen className="h-5 w-5" />,
    endpoint: "/analytics/export/tahfidz",
  },
];

export default function ExportPage() {
  const [selectedType, setSelectedType] = useState<string>("students");
  const [unitId, setUnitId] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [format, setFormat] = useState<"json" | "csv">("csv");

  const { data: units } = useQuery<{
    success: boolean;
    data: Array<{ id: string; name: string }>;
  }>({
    queryKey: ["units"],
    queryFn: () => api.get("/units").then((res) => res.data),
  });

  const selectedExportType = EXPORT_TYPES.find((t) => t.id === selectedType);

  const {
    data: previewData,
    isLoading: previewLoading,
    refetch,
  } = useQuery({
    queryKey: ["export-preview", selectedType, unitId, startDate, endDate],
    queryFn: () => {
      const params: Record<string, string> = { format: "json" };
      if (unitId !== "all") params.unitId = unitId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      return api
        .get(selectedExportType?.endpoint || "", { params })
        .then((res) => res.data);
    },
    enabled: !!selectedExportType,
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const params: Record<string, string> = { format };
      if (unitId !== "all") params.unitId = unitId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      if (format === "csv") {
        const response = await api.get(selectedExportType?.endpoint || "", {
          params,
          responseType: "blob",
        });

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `${selectedType}_export_${new Date().toISOString().split("T")[0]}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const response = await api.get(selectedExportType?.endpoint || "", {
          params,
        });
        // Download as JSON
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataUri =
          "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
        const link = document.createElement("a");
        link.href = dataUri;
        link.setAttribute(
          "download",
          `${selectedType}_export_${new Date().toISOString().split("T")[0]}.json`,
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    },
    onSuccess: () => {
      toast.success("Export berhasil diunduh!");
    },
    onError: () => {
      toast.error("Gagal mengunduh export");
    },
  });

  const getPreviewColumns = () => {
    if (!previewData?.data || previewData.data.length === 0) return [];
    return Object.keys(previewData.data[0]).slice(0, 6);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/analytics">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Export Data</h1>
          <p className="text-muted-foreground">
            Export data ke format CSV atau JSON untuk analisis lanjutan
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Export Type Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Jenis Data</CardTitle>
            <CardDescription>Pilih data yang ingin diexport</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {EXPORT_TYPES.map((type) => (
              <div
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedType === type.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {type.icon}
                <div>
                  <p className="font-medium">{type.name}</p>
                  <p
                    className={`text-xs ${selectedType === type.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                  >
                    {type.description}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Filters and Export */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              {selectedExportType?.name}
            </CardTitle>
            <CardDescription>
              Konfigurasi filter dan format export
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={unitId} onValueChange={setUnitId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Unit</SelectItem>
                    {units?.data?.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Format</Label>
                <Select
                  value={format}
                  onValueChange={(v) => setFormat(v as "json" | "csv")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (Excel)</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(selectedType === "attendance" ||
                selectedType === "finance" ||
                selectedType === "tahfidz") && (
                <>
                  <div className="space-y-2">
                    <Label>Tanggal Mulai</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal Akhir</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => refetch()}
                variant="outline"
                disabled={previewLoading}
              >
                {previewLoading && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Preview
              </Button>
              <Button
                onClick={() => exportMutation.mutate()}
                disabled={exportMutation.isPending}
              >
                {exportMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Download {format.toUpperCase()}
              </Button>
            </div>

            {/* Preview Table */}
            {previewData?.data && previewData.data.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">
                    Preview data ({Math.min(5, previewData.data.length)} dari{" "}
                    {previewData.count || previewData.data.length} records)
                  </p>
                  <Badge variant="secondary">
                    {previewData.count || previewData.data.length} total
                  </Badge>
                </div>
                <div className="border rounded-lg overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {getPreviewColumns().map((col) => (
                          <TableHead key={col} className="whitespace-nowrap">
                            {col}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.data
                        .slice(0, 5)
                        .map((row: Record<string, unknown>, i: number) => (
                          <TableRow key={i}>
                            {getPreviewColumns().map((col) => (
                              <TableCell
                                key={col}
                                className="whitespace-nowrap"
                              >
                                {String(row[col] ?? "-")}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {previewData?.data && previewData.data.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada data untuk kriteria yang dipilih
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
