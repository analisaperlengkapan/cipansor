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
  GraduationCap,
  BookOpen,
  Trophy,
  Users,
  TrendingUp,
  Target,
  Award
} from "lucide-react";
import { useUnits } from "@/hooks/use-units";
import { useActiveAcademicYear } from "@/hooks/use-academic-years";
import { useUnitEducationAnalytics } from "@/hooks/use-assessment";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export default function EducationAnalyticsPage() {
  const { data: units, isLoading: loadingUnits } = useUnits();
  const { data: activeYear } = useActiveAcademicYear();
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");

  const { data: unitAnalytics, isLoading: loadingAnalytics } = useUnitEducationAnalytics(
    selectedUnitId || (units?.data?.[0]?.id ?? ""),
    activeYear?.id ?? ""
  );

  // Fallback/Mock for multi-unit comparison
  const unitKpiData = [
    { name: 'TK Quran', avgScore: 92, tahfidzTarget: 85, attendance: 96 },
    { name: 'SD IT', avgScore: 88, tahfidzTarget: 78, attendance: 94 },
    { name: 'SMP IT', avgScore: 85, tahfidzTarget: 72, attendance: 92 },
    { name: 'SMA Qur\'an', avgScore: 82, tahfidzTarget: 68, attendance: 90 },
  ];

  const enrollmentTrend = [
    { month: 'Jan', students: 1200 },
    { month: 'Feb', students: 1210 },
    { month: 'Mar', students: 1205 },
    { month: 'Apr', students: 1215 },
    { month: 'May', students: 1230 },
    { month: 'Jun', students: 1250 },
  ];

  const subjectPerformance = [
    { subject: 'Tahfidz', score: 88 },
    { subject: 'B. Arab', score: 82 },
    { subject: 'Matematika', score: 78 },
    { subject: 'B. Inggris', score: 85 },
    { subject: 'PAI', score: 92 },
    { subject: 'IPA', score: 76 },
  ];

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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
               value={selectedUnitId || (units?.data?.[0]?.id ?? "")}
               onValueChange={setSelectedUnitId}
             >
                <SelectTrigger>
                   <SelectValue placeholder="Pilih Unit" />
                </SelectTrigger>
                <SelectContent>
                   {units?.data?.map((u: any) => (
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
                 <div className="text-3xl font-bold">86.4</div>
                 <p className="text-xs mt-1 opacity-70 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> +2.4% dari semester lalu
                 </p>
              </CardContent>
           </Card>
           <Card>
              <CardHeader className="pb-2 text-muted-foreground">
                 <CardTitle className="text-sm font-medium">Pencapaian Tahfidz</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="text-3xl font-bold">75.2%</div>
                 <p className="text-xs mt-1 text-emerald-600 font-bold uppercase">Sesuai Target</p>
              </CardContent>
           </Card>
           <Card>
              <CardHeader className="pb-2 text-muted-foreground">
                 <CardTitle className="text-sm font-medium">Tingkat Kehadiran</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="text-3xl font-bold">94.8%</div>
                 <p className="text-xs mt-1 text-slate-500">Rata-rata seluruh unit</p>
              </CardContent>
           </Card>
           <Card>
              <CardHeader className="pb-2 text-muted-foreground">
                 <CardTitle className="text-sm font-medium">Siswa Berprestasi</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="text-3xl font-bold">42</div>
                 <p className="text-xs mt-1 text-indigo-600 font-bold">Tingkat Nasional/Intl</p>
              </CardContent>
           </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Card>
              <CardHeader>
                 <CardTitle className="text-base flex items-center gap-2">
                   <Target className="w-4 h-4 text-indigo-600" /> Performa Unit Pendidikan
                 </CardTitle>
                 <CardDescription>Perbandingan Skor Akademik vs Target Tahfidz</CardDescription>
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
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectPerformance} layout="vertical">
                       <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                       <XAxis type="number" domain={[0, 100]} hide />
                       <YAxis dataKey="subject" type="category" />
                       <Tooltip />
                       <Bar dataKey="score" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                 </ResponsiveContainer>
              </CardContent>
           </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="md:col-span-2">
              <CardHeader>
                 <CardTitle className="text-base">Tren Jumlah Santri Aktif</CardTitle>
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
                 <CardTitle className="text-base">Sebaran Jenjang Pendidikan</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie
                          data={[
                            { name: 'TK', value: 150 },
                            { name: 'SD', value: 450 },
                            { name: 'SMP', value: 380 },
                            { name: 'SMA', value: 270 },
                          ]}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                       >
                          {unitKpiData.map((entry, index) => (
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
