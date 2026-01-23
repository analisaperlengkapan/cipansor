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
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Building2,
  Users,
  GraduationCap,
  AlertTriangle,
  RefreshCw,
  FileText,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth";
import { useUnits } from "@/hooks/use-units";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

interface EmisSummary {
  students: {
    total: number;
    active: number;
    male: number;
    female: number;
    withNisn: number;
    nisnCompletionRate: number;
  };
  teachers: {
    total: number;
    certified: number;
    withNuptk: number;
    nuptkCompletionRate: number;
    certificationRate: number;
  };
  classes: {
    total: number;
  };
  readinessScore: number;
}

interface ValidationIssue {
  type: string;
  severity: "error" | "warning";
  message: string;
  count: number;
}

interface ValidationResult {
  isReady: boolean;
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  issues: ValidationIssue[];
}

// Hook for EMIS summary
function useEmisSummary(unitId: string | null) {
  return useQuery<EmisSummary>({
    queryKey: ["emis-summary", unitId],
    queryFn: async () => {
      if (!unitId) throw new Error("Unit ID required");
      const response = await api.get(`/emis/summary/${unitId}`);
      return response.data.data;
    },
    enabled: !!unitId,
  });
}

// Hook for EMIS validation
function useEmisValidation(unitId: string | null) {
  return useQuery<ValidationResult>({
    queryKey: ["emis-validation", unitId],
    queryFn: async () => {
      if (!unitId) throw new Error("Unit ID required");
      const response = await api.get(`/emis/validate/${unitId}`);
      return response.data.data;
    },
    enabled: !!unitId,
  });
}

export default function EmisPage() {
  const { user } = useAuthStore();
  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    user?.unitId || "",
  );
  const [exportingType, setExportingType] = useState<string | null>(null);

  const { data: units } = useUnits();
  const {
    data: summary,
    isLoading: loadingSummary,
    refetch: refetchSummary,
  } = useEmisSummary(selectedUnitId);
  const {
    data: validation,
    isLoading: loadingValidation,
    refetch: refetchValidation,
  } = useEmisValidation(selectedUnitId);

  const handleExport = async (
    type: "students" | "teachers" | "institution",
  ) => {
    if (!selectedUnitId) {
      toast.error("Pilih unit terlebih dahulu");
      return;
    }

    setExportingType(type);
    try {
      let endpoint = "";
      let filename = "";

      switch (type) {
        case "students":
          endpoint = `/emis/export/students?unitId=${selectedUnitId}`;
          filename = "emis_data_siswa.json";
          break;
        case "teachers":
          endpoint = `/emis/export/teachers?unitId=${selectedUnitId}`;
          filename = "emis_data_guru.json";
          break;
        case "institution":
          endpoint = `/emis/export/institution/${selectedUnitId}`;
          filename = "emis_data_lembaga.json";
          break;
      }

      const response = await api.get(endpoint);
      const data = response.data.data;

      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Data ${type} berhasil diekspor`);
    } catch (error) {
      toast.error(`Gagal mengekspor data ${type}`);
    } finally {
      setExportingType(null);
    }
  };

  const handleRefresh = () => {
    refetchSummary();
    refetchValidation();
    toast.success("Data EMIS berhasil diperbarui");
  };

  const getReadinessColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getReadinessLabel = (score: number) => {
    if (score >= 80) return "Siap";
    if (score >= 60) return "Hampir Siap";
    return "Belum Siap";
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="EMIS Kemenag"
          description="Export data sesuai format Education Management Information System (EMIS) Kementerian Agama"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "EMIS Kemenag" },
          ]}
        />

        {/* Unit Selector */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Pilih Unit</CardTitle>
                <CardDescription>
                  Pilih unit untuk melihat data dan melakukan export EMIS
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Pilih unit..." />
              </SelectTrigger>
              <SelectContent>
                {units?.map(
                  (unit: { id: string; name: string; type: string }) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name} ({unit.type})
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedUnitId && (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Ringkasan</TabsTrigger>
              <TabsTrigger value="validation">Validasi Data</TabsTrigger>
              <TabsTrigger value="export">Export Data</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Readiness Score */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Kesiapan Data EMIS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Progress
                        value={summary?.readinessScore || 0}
                        className="h-4"
                      />
                    </div>
                    <div
                      className={`text-2xl font-bold ${getReadinessColor(summary?.readinessScore || 0)}`}
                    >
                      {summary?.readinessScore || 0}%
                    </div>
                    <Badge
                      variant={
                        summary?.readinessScore && summary.readinessScore >= 80
                          ? "default"
                          : "secondary"
                      }
                    >
                      {getReadinessLabel(summary?.readinessScore || 0)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Students Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Siswa
                    </CardTitle>
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {summary?.students.active || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {summary?.students.male || 0} L /{" "}
                      {summary?.students.female || 0} P
                    </p>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span>NISN Lengkap</span>
                        <span className="font-medium">
                          {summary?.students.nisnCompletionRate || 0}%
                        </span>
                      </div>
                      <Progress
                        value={summary?.students.nisnCompletionRate || 0}
                        className="h-1 mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Teachers Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Guru
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {summary?.teachers.total || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {summary?.teachers.certified || 0} tersertifikasi
                    </p>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span>NUPTK Lengkap</span>
                        <span className="font-medium">
                          {summary?.teachers.nuptkCompletionRate || 0}%
                        </span>
                      </div>
                      <Progress
                        value={summary?.teachers.nuptkCompletionRate || 0}
                        className="h-1 mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Classes Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Kelas
                    </CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {summary?.classes.total || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tahun ajaran aktif
                    </p>
                  </CardContent>
                </Card>

                {/* Issues Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Masalah Data
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {validation?.totalIssues || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {validation?.errorCount || 0} error,{" "}
                      {validation?.warningCount || 0} warning
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Validation Tab */}
            <TabsContent value="validation" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {validation?.isReady ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        )}
                        Status Validasi
                      </CardTitle>
                      <CardDescription>
                        {validation?.isReady
                          ? "Data siap untuk export EMIS"
                          : "Terdapat masalah yang perlu diperbaiki sebelum export"}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={validation?.isReady ? "default" : "destructive"}
                    >
                      {validation?.isReady ? "Siap" : "Belum Siap"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {validation?.issues && validation.issues.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Kategori</TableHead>
                          <TableHead>Masalah</TableHead>
                          <TableHead className="text-center">Jumlah</TableHead>
                          <TableHead>Tingkat</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validation.issues.map((issue, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Badge variant="outline">{issue.type}</Badge>
                            </TableCell>
                            <TableCell>{issue.message}</TableCell>
                            <TableCell className="text-center font-medium">
                              {issue.count}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  issue.severity === "error"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {issue.severity === "error"
                                  ? "Error"
                                  : "Warning"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
                      <p>
                        Tidak ada masalah ditemukan. Data siap untuk export.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Fix Suggestions */}
              {validation?.issues && validation.issues.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Rekomendasi Perbaikan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {validation.issues.some(
                      (i) => i.type === "student_nisn",
                    ) && (
                      <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="font-medium">
                            NISN Siswa Belum Lengkap
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Lengkapi NISN siswa di menu{" "}
                            <strong>Siswa → Edit Siswa</strong>. NISN bisa
                            diperoleh dari Dapodik atau verval NISN.
                          </p>
                        </div>
                      </div>
                    )}
                    {validation.issues.some(
                      (i) => i.type === "teacher_nuptk",
                    ) && (
                      <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="font-medium">
                            NUPTK Guru Belum Lengkap
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Lengkapi NUPTK guru di menu{" "}
                            <strong>SDM → Edit Guru</strong>. NUPTK bisa
                            diperoleh dari GTK Kemendikbud.
                          </p>
                        </div>
                      </div>
                    )}
                    {validation.issues.some((i) => i.type === "unit_npsn") && (
                      <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="font-medium">NPSN Unit Belum Terisi</p>
                          <p className="text-sm text-muted-foreground">
                            Lengkapi NPSN unit di menu{" "}
                            <strong>Pengaturan → Unit</strong>. NPSN bisa
                            diperoleh dari Dapodik.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Export Tab */}
            <TabsContent value="export" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                {/* Export Students */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Data Siswa
                    </CardTitle>
                    <CardDescription>
                      Export data siswa sesuai format EMIS (NISN, biodata,
                      kelas)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm">
                        <p>
                          <strong>{summary?.students.active || 0}</strong> siswa
                          aktif
                        </p>
                        <p className="text-muted-foreground">
                          {summary?.students.withNisn || 0} memiliki NISN
                        </p>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => handleExport("students")}
                        disabled={exportingType === "students"}
                      >
                        {exportingType === "students" ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Export Data Siswa
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Export Teachers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Data Guru
                    </CardTitle>
                    <CardDescription>
                      Export data guru sesuai format EMIS (NUPTK, sertifikasi)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm">
                        <p>
                          <strong>{summary?.teachers.total || 0}</strong> guru
                        </p>
                        <p className="text-muted-foreground">
                          {summary?.teachers.withNuptk || 0} memiliki NUPTK
                        </p>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => handleExport("teachers")}
                        disabled={exportingType === "teachers"}
                      >
                        {exportingType === "teachers" ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Export Data Guru
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Export Institution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Data Lembaga
                    </CardTitle>
                    <CardDescription>
                      Export profil lembaga (NPSN, akreditasi, yayasan)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm">
                        <p>
                          <strong>Profil Lengkap</strong>
                        </p>
                        <p className="text-muted-foreground">
                          Data lembaga dan yayasan
                        </p>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => handleExport("institution")}
                        disabled={exportingType === "institution"}
                      >
                        {exportingType === "institution" ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Export Data Lembaga
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Export Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Panduan Export EMIS
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="font-medium">Format Data</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Data diekspor dalam format JSON</li>
                        <li>Struktur sesuai standar EMIS Kemenag</li>
                        <li>Dapat dikonversi ke Excel/CSV sesuai kebutuhan</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Kelengkapan Data</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>NISN wajib untuk data siswa</li>
                        <li>NUPTK direkomendasikan untuk guru</li>
                        <li>NPSN wajib untuk data lembaga</li>
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
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Pilih unit untuk melihat data EMIS</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
