"use client";

import { MainLayout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useUnits,
  useFinancialSummary,
  useFoundation,
  useTalentAnalytics,
  useRecentAnnouncements,
} from "@/hooks";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  UserCheck,
  GraduationCap,
  AlertCircle,
  Briefcase,
  FileText,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function ExecutiveDashboard() {
  const { data: foundation } = useFoundation();
  const { data: units, isLoading: unitsLoading } = useUnits();
  const { data: financialSummary, isLoading: financeLoading } = useFinancialSummary(foundation?.id);
  const { data: talentStats } = useTalentAnalytics();
  const { data: announcements } = useRecentAnnouncements();

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (unitsLoading || financeLoading) {
    return (
      <MainLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Executive Dashboard</h1>
          <p className="text-muted-foreground">
            Laporan konsolidasi seluruh unit Yayasan Pesantren Cipansor
          </p>
        </div>

        {/* Global KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Unit</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{units?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Unit Pendidikan & Operasional</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Income (Consolidated)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(financialSummary as any)?.currentMonth?.net >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency((financialSummary as any)?.currentMonth?.net || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Bulan Berjalan</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Key Talent Ratio</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {talentStats?.percentages?.KEY_TALENT || 0}%
              </div>
              <p className="text-xs text-muted-foreground">High Potential & Key Talent</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendaftaran Aktif</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {/* TODO: Wire to PSB/Admission API */}
              <div className="text-2xl font-bold text-muted-foreground">—</div>
              <p className="text-xs text-muted-foreground">Belum tersedia</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="finance">Finance</TabsTrigger>
            <TabsTrigger value="hr">SDM & Talenta</TabsTrigger>
            <TabsTrigger value="quality">Mutu & Risiko</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Realisasi Anggaran per Unit</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={(financialSummary as any)?.byUnit || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="unitName" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `Rp${(value / 1000000).toFixed(0)}jt`}
                        />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="revenue" name="Pendapatan" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" name="Beban" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Distribusi Talenta Yayasan</CardTitle>
                  <CardDescription>Berdasarkan 9-Box Matrix</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "High Potential", value: talentStats?.distribution?.HIGH_POTENTIAL || 0 },
                            { name: "Key Talent", value: talentStats?.distribution?.KEY_TALENT || 0 },
                            { name: "Emerging", value: talentStats?.distribution?.EMERGING || 0 },
                            { name: "Solid Performer", value: talentStats?.distribution?.SOLID_PERFORMER || 0 },
                            { name: "Needs Dev", value: talentStats?.distribution?.NEEDS_DEVELOPMENT || 0 },
                          ].filter(v => v.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {COLORS.map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
               <Card>
                <CardHeader>
                  <CardTitle>Pengumuman Terbaru</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {announcements?.slice(0, 3).map((item: any) => (
                      <div key={item.id} className="flex items-start gap-4">
                        <div className="rounded-full bg-blue-100 p-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(item.createdAt), "d MMM yyyy", { locale: id })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Status Kualitas & Risiko</CardTitle>
                  <CardDescription>Konsolidasi temuan audit dan level risiko unit</CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="space-y-4">
                      {units?.slice(0, 4).map((unit: any) => (
                        <div key={unit.id} className="flex items-center justify-between border-b pb-2">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{unit.name}</p>
                            {/* TODO: Wire to Risk & Pengawasan APIs */}
                            <p className="text-xs text-muted-foreground italic">Data risiko & audit belum tersedia</p>
                          </div>
                          <div className="text-right">
                             {/* TODO: Wire to Quality Assurance API */}
                             <div className="text-sm font-bold text-muted-foreground">—</div>
                             <p className="text-[10px] text-muted-foreground">Quality Score</p>
                          </div>
                        </div>
                      ))}
                   </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
