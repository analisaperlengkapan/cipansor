"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Award,
  BookOpen,
  Users,
  Building2,
  GraduationCap,
  Wallet,
  Settings,
  ClipboardCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  FileText,
  Calculator,
  Target,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useCurrentUnit } from "@/hooks";
import { toast } from "sonner";

// 8 Standar Nasional Pendidikan
const SNP_ICONS: Record<string, React.ReactNode> = {
  SKL: <GraduationCap className="h-5 w-5" />,
  SI: <BookOpen className="h-5 w-5" />,
  SPR: <Settings className="h-5 w-5" />,
  SPE: <ClipboardCheck className="h-5 w-5" />,
  SPTK: <Users className="h-5 w-5" />,
  SSP: <Building2 className="h-5 w-5" />,
  SPG: <Target className="h-5 w-5" />,
  SPB: <Wallet className="h-5 w-5" />,
};

const GRADE_COLORS: Record<string, string> = {
  A: "bg-green-500",
  B: "bg-blue-500",
  C: "bg-yellow-500",
  TT: "bg-red-500",
};

const GRADE_TEXT_COLORS: Record<string, string> = {
  A: "text-green-600",
  B: "text-blue-600",
  C: "text-yellow-600",
  TT: "text-red-600",
};

interface Standard {
  code: string;
  name: string;
  description: string;
  weight: number;
  indicators: Array<{
    code: string;
    name: string;
    maxScore: number;
  }>;
}

export default function AccreditationPage() {
  const { data: currentUnit } = useCurrentUnit();
  const unitId = currentUnit?.id;

  const [simulationScores, setSimulationScores] = useState<
    Record<string, number>
  >({
    SKL: 75,
    SI: 80,
    SPR: 70,
    SPE: 75,
    SPTK: 65,
    SSP: 70,
    SPG: 80,
    SPB: 75,
  });

  // Fetch standards
  const { data: standards, isLoading: standardsLoading } = useQuery<Standard[]>(
    {
      queryKey: ["accreditation-standards"],
      queryFn: async () => {
        const res = await api.get("/foundation/accreditation/standards");
        return res.data.data;
      },
    },
  );

  // Fetch dashboard data
  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ["accreditation-dashboard", unitId],
    queryFn: async () => {
      const res = await api.get(
        `/foundation/accreditation/units/${unitId}/dashboard`,
      );
      return res.data.data;
    },
    enabled: !!unitId,
  });

  // Simulate score mutation
  const simulateMutation = useMutation({
    mutationFn: async (scores: Record<string, number>) => {
      const res = await api.post(
        `/foundation/accreditation/units/${unitId}/simulate`,
        { scores },
      );
      return res.data.data;
    },
  });

  const handleSimulate = () => {
    simulateMutation.mutate(simulationScores);
  };

  if (standardsLoading || dashboardLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Memuat data akreditasi...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Evaluasi Diri Akreditasi
            </h1>
            <p className="text-muted-foreground">
              Penilaian mandiri berdasarkan 8 Standar Nasional Pendidikan (SNP)
            </p>
          </div>
          <Badge variant="outline" className="text-lg py-2 px-4">
            <Award className="h-5 w-5 mr-2" />
            Akreditasi Saat Ini:{" "}
            {dashboard?.unit?.currentAccreditation ?? "Belum Terakreditasi"}
          </Badge>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Ringkasan</TabsTrigger>
            <TabsTrigger value="standards">8 Standar SNP</TabsTrigger>
            <TabsTrigger value="simulator">Simulator Nilai</TabsTrigger>
            <TabsTrigger value="assessment">Evaluasi Diri</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Guru
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboard?.statistics?.teachers?.total ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboard?.statistics?.teachers?.certified ?? 0}{" "}
                    bersertifikasi (
                    {dashboard?.statistics?.teachers?.certificationRate ?? 0}%)
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Siswa
                  </CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboard?.statistics?.students?.total ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Siswa aktif</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ruang Kelas
                  </CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboard?.statistics?.facilities?.classes ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboard?.statistics?.facilities?.dormitories ?? 0}{" "}
                    asrama, {dashboard?.statistics?.facilities?.totalRooms ?? 0}{" "}
                    kamar
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Kesiapan
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboard?.overallReadiness ?? 0}%
                  </div>
                  <Progress
                    value={dashboard?.overallReadiness ?? 0}
                    className="mt-2"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Readiness per Standard */}
            <Card>
              <CardHeader>
                <CardTitle>Kesiapan Per Standar</CardTitle>
                <CardDescription>
                  Estimasi kesiapan berdasarkan data yang tersedia di sistem
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard?.readinessScores?.map((score: any) => (
                    <div key={score.standardCode} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {SNP_ICONS[score.standardCode]}
                          <span className="font-medium">
                            {score.standardCode}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            - {score.standardName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${score.autoScore >= 70 ? "text-green-600" : "text-yellow-600"}`}
                          >
                            {score.autoScore}%
                          </span>
                          {score.needsManualAssessment && (
                            <Badge variant="outline" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Perlu Evaluasi
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Progress value={score.autoScore} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            {dashboard?.recommendedActions?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Rekomendasi Perbaikan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {dashboard.recommendedActions.map(
                      (action: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 mt-1 text-muted-foreground" />
                          <span>{action}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Standards Tab */}
          <TabsContent value="standards" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {standards?.map((std) => (
                <Card key={std.code}>
                  <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {SNP_ICONS[std.code]}
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {std.code} - {std.name}
                          </CardTitle>
                          <Badge variant="outline" className="mt-1">
                            Bobot: {std.weight}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="mt-2">
                      {std.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        Indikator ({std.indicators.length}):
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {std.indicators.slice(0, 3).map((ind) => (
                          <li
                            key={ind.code}
                            className="flex items-center gap-2"
                          >
                            <span className="w-2 h-2 bg-primary rounded-full" />
                            {ind.name}
                          </li>
                        ))}
                        {std.indicators.length > 3 && (
                          <li className="text-xs text-muted-foreground">
                            +{std.indicators.length - 3} indikator lainnya
                          </li>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Simulator Tab */}
          <TabsContent value="simulator" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Simulator Nilai Akreditasi
                </CardTitle>
                <CardDescription>
                  Geser slider untuk memproyeksikan nilai akreditasi berdasarkan
                  estimasi skor per standar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {standards?.map((std) => (
                  <div key={std.code} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {SNP_ICONS[std.code]}
                        <span className="font-medium">{std.name}</span>
                        <Badge variant="outline" className="text-xs">
                          Bobot {std.weight}%
                        </Badge>
                      </div>
                      <span className="font-bold text-lg">
                        {simulationScores[std.code]}%
                      </span>
                    </div>
                    <Slider
                      value={[simulationScores[std.code]]}
                      onValueChange={(value) =>
                        setSimulationScores((prev) => ({
                          ...prev,
                          [std.code]: value[0],
                        }))
                      }
                      min={0}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                ))}

                <div className="pt-4 border-t">
                  <Button
                    onClick={handleSimulate}
                    disabled={simulateMutation.isPending}
                  >
                    {simulateMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Calculator className="mr-2 h-4 w-4" />
                    )}
                    Hitung Proyeksi
                  </Button>
                </div>

                {simulateMutation.data && (
                  <Card className="mt-4 bg-muted/50">
                    <CardHeader>
                      <CardTitle className="text-center">
                        Hasil Simulasi
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Total Skor
                          </p>
                          <p className="text-4xl font-bold">
                            {simulateMutation.data.totalScore.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Predikat
                          </p>
                          <Badge
                            className={`text-lg py-2 px-6 ${GRADE_COLORS[simulateMutation.data.grade]}`}
                          >
                            {simulateMutation.data.grade} -{" "}
                            {simulateMutation.data.gradeDescription}
                          </Badge>
                        </div>
                      </div>

                      <Table className="mt-6">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Standar</TableHead>
                            <TableHead className="text-right">Skor</TableHead>
                            <TableHead className="text-right">Bobot</TableHead>
                            <TableHead className="text-right">
                              Nilai Terbobot
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {simulateMutation.data.breakdown.map((b: any) => (
                            <TableRow key={b.standardCode}>
                              <TableCell className="font-medium">
                                {b.standardCode}
                              </TableCell>
                              <TableCell className="text-right">
                                {b.score}%
                              </TableCell>
                              <TableCell className="text-right">
                                12.5%
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {b.weightedScore.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assessment Tab */}
          <TabsContent value="assessment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Evaluasi Diri
                </CardTitle>
                <CardDescription>
                  Lengkapi penilaian untuk setiap indikator dengan bukti
                  pendukung
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Form Evaluasi Diri</p>
                  <p className="text-sm mt-2">
                    Fitur ini memungkinkan Anda untuk melengkapi evaluasi diri
                    akreditasi dengan mengisi skor dan bukti untuk setiap
                    indikator.
                  </p>
                  <Button className="mt-4" disabled>
                    Mulai Evaluasi Diri
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Grading Legend */}
        <Card>
          <CardHeader>
            <CardTitle>Pedoman Peringkat Akreditasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <Badge className={GRADE_COLORS["A"]}>A</Badge>
                <p className="font-semibold mt-2">Unggul</p>
                <p className="text-sm text-muted-foreground">Skor ≥ 91</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Badge className={GRADE_COLORS["B"]}>B</Badge>
                <p className="font-semibold mt-2">Baik</p>
                <p className="text-sm text-muted-foreground">Skor 81-90</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <Badge className={GRADE_COLORS["C"]}>C</Badge>
                <p className="font-semibold mt-2">Cukup</p>
                <p className="text-sm text-muted-foreground">Skor 71-80</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <Badge className={GRADE_COLORS["TT"]}>TT</Badge>
                <p className="font-semibold mt-2">Tidak Terakreditasi</p>
                <p className="text-sm text-muted-foreground">Skor &lt; 71</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
