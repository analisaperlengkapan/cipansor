"use client";

import { MainLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import {
  TrendingUp,
  Target,
  Award
} from "lucide-react";
import { useUnits } from "@/hooks/use-units";
import { useActiveAcademicYear } from "@/hooks/use-academic-years";
import { useUnitEducationAnalytics } from "@/hooks/use-assessment";
import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export default function EducationAnalyticsPage() {
  const { data: units } = useUnits();
  const { data: activeYear } = useActiveAcademicYear();
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");

  const unitList = Array.isArray(units) ? units : (units as any)?.data ?? [];

  const { data: unitAnalytics } = useUnitEducationAnalytics(
    selectedUnitId || (unitList[0]?.id ?? ""),
    activeYear?.id ?? ""
  );

  // Derive subject performance from API data when available
  const subjectPerformance = useMemo(() => {
    if (unitAnalytics?.subjectAverages?.length > 0) {
      return unitAnalytics.subjectAverages.map((s: any) => ({
        subject: s.subjectId,
        score: s.averagePercentage,
      }));
    }
    return [];
  }, [unitAnalytics]);

  const hasSubjectData = subjectPerformance.length > 0;

  // Placeholder data for multi-unit comparison (requires multi-unit API not yet available)
  const unitKpiData = [
    { name: 'TK Quran', avgScore: 92, tahfidzTarget: 85, attendance: 96 },
    { name: 'SD IT', avgScore: 88, tahfidzTarget: 78, attendance: 94 },
    { name: 'SMP IT', avgScore: 85, tahfidzTarget: 72, attendance: 92 },
    { name: 'SMA Qur\'an', avgScore: 82, tahfidzTarget: 68, attendance: 90 },
  ];

  // Placeholder data for enrollment trend (requires enrollment history API)
  const enrollmentTrend = [
    { month: 'Jan', students: 1200 },
    { month: 'Feb', students: 1210 },
    { month: 'Mar', students: 1205 },
    { month: 'Apr', students: 1215 },
    { month: 'May', students: 1230 },
    { month: 'Jun', students: 1250 },
  ];

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const gradeDistributionData = [
    { name: 'TK', value: 150 },
    { name: 'SD', value: 450 },
    { name: 'SMP', value: 380 },
    { name: 'SMA', value: 270 },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analitik Pendidikan Terpadu</h1>
            <p className="text-muted-foreground">Monitoring KPI akademik dan perkembangan santri antar unit pendidikan.</p>
          </div>
          <div className="w-full md:w-64">
             <Select
               value={selectedUnitId || (unitList[0]?.id ?? "")}
               onValueChange={setSelectedUnitId}
             >
                <SelectTrigger>
                   <SelectValue placeholder="Pilih Unit" />
                </SelectTrigger>
                <SelectContent>
                   {unitList.map((u: any) => (
                     <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                   ))}
                </SelectContent>
             </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <Card className="bg-indigo-600 text-white">
              <CardHeader className="pb-2">
                 <CardTitle className="text-sm font-medium opacity-80">Rata-rata Skor Unit</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="text-3xl font-bold">
                   {unitAnalytics?.subjectAverages?.length > 0
                     ? (unitAnalytics.subjectAverages.reduce((sum: number, s: any) => sum + s.averagePercentage, 0) / unitAnalytics.subjectAverages.length).toFixed(1)
                     : '—'}
                 </div>
                 <p className="text-xs mt-1 opacity-70 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Unit terpilih
                 </p>
              </CardContent>
           </Card>
           <Card>
              <CardHeader className="pb-2 text-muted-foreground">
                 <CardTitle className="text-sm font-medium">Rata-rata Tahfidz (Juz)</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="text-3xl font-bold">{unitAnalytics?.averageJuz ?? '—'}</div>
                 <p className="text-xs mt-1 text-emerald-600 font-bold uppercase">Rata-rata unit</p>
              </CardContent>
           </Card>
           <Card>
              <CardHeader className="pb-2 text-muted-foreground">
                 <CardTitle className="text-sm font-medium">Jumlah Santri Aktif</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="text-3xl font-bold">{unitAnalytics?.studentCount ?? '—'}</div>
                 <p className="text-xs mt-1 text-slate-500">Unit terpilih</p>
              </CardContent>
           </Card>
           <Card>
              <CardHeader className="pb-2 text-muted-foreground">
                 <CardTitle className="text-sm font-medium">Jumlah Mata Pelajaran</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="text-3xl font-bold">{unitAnalytics?.subjectAverages?.length ?? '—'}</div>
                 <p className="text-xs mt-1 text-indigo-600 font-bold">Dengan data nilai</p>
              </CardContent>
           </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Card>
              <CardHeader>
                 <CardTitle className="text-base flex items-center gap-2">
                   <Target className="w-4 h-4 text-indigo-600" /> Performa Unit Pendidikan
                 </CardTitle>
                 <CardDescription>Perbandingan Skor Akademik vs Target Tahfidz <span className="text-amber-500 font-medium">(Data contoh)</span></CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={unitKpiData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} />
                       <XAxis dataKey="name" />
                       <YAxis />
                       <Tooltip />
                       <Legend />
                       <Bar dataKey="avgScore" name="Skor Akademik" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                       <Bar dataKey="tahfidzTarget" name="% Capaian Tahfidz" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
              </CardContent>
           </Card>

           <Card>
              <CardHeader>
                 <CardTitle className="text-base flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-600" /> Penguasaan Materi (Global)
                 </CardTitle>
                 <CardDescription>Rata-rata nilai per kategori mata pelajaran</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                 {hasSubjectData ? (
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjectPerformance} layout="vertical">
                         <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                         <XAxis type="number" domain={[0, 100]} hide />
                         <YAxis dataKey="subject" type="category" />
                         <Tooltip />
                         <Bar dataKey="score" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                   </ResponsiveContainer>
                 ) : (
                   <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                     Pilih unit dengan data nilai untuk melihat grafik.
                   </div>
                 )}
              </CardContent>
           </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="md:col-span-2">
              <CardHeader>
                 <CardTitle className="text-base">Tren Jumlah Santri Aktif <span className="text-xs font-normal text-amber-500">(Data contoh)</span></CardTitle>
              </CardHeader>
              <CardContent className="h-[250px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={enrollmentTrend}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} />
                       <XAxis dataKey="month" />
                       <YAxis domain={['dataMin - 100', 'dataMax + 100']} />
                       <Tooltip />
                       <Line type="monotone" dataKey="students" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                 </ResponsiveContainer>
              </CardContent>
           </Card>

           <Card>
              <CardHeader>
                 <CardTitle className="text-base">Sebaran Jenjang Pendidikan <span className="text-xs font-normal text-amber-500">(Data contoh)</span></CardTitle>
              </CardHeader>
              <CardContent className="h-[250px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie
                          data={gradeDistributionData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                       >
                          {gradeDistributionData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                       </Pie>
                       <Tooltip />
                       <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                 </ResponsiveContainer>
              </CardContent>
           </Card>
        </div>
      </div>
    </MainLayout>
  );
}
