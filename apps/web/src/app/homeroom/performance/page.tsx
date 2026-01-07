'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout';
import { PageHeader } from '@/components/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  TrendingUp,
  TrendingDown,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  Star,
  Award,
  BarChart3,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { cn } from '@/lib/utils';

// Mock homeroom teacher performance data
const mockHomeroomData = [
  {
    id: 'hr-1',
    teacherName: 'Ust. Ahmad Fadlan',
    className: 'VII A',
    studentCount: 32,
    metrics: {
      dailyReportCompletion: 95,
      attendanceAccuracy: 98,
      parentEngagement: 85,
      tahfidzProgress: 88,
      behaviorManagement: 90,
      administrativeTask: 92,
    },
    overallScore: 91,
    trend: 'up',
    monthlyData: [
      { month: 'Jul', score: 85 },
      { month: 'Aug', score: 88 },
      { month: 'Sep', score: 87 },
      { month: 'Oct', score: 90 },
      { month: 'Nov', score: 89 },
      { month: 'Dec', score: 91 },
    ],
  },
  {
    id: 'hr-2',
    teacherName: 'Ustz. Fatimah Nur',
    className: 'VII B',
    studentCount: 30,
    metrics: {
      dailyReportCompletion: 88,
      attendanceAccuracy: 95,
      parentEngagement: 92,
      tahfidzProgress: 82,
      behaviorManagement: 85,
      administrativeTask: 88,
    },
    overallScore: 88,
    trend: 'up',
    monthlyData: [
      { month: 'Jul', score: 82 },
      { month: 'Aug', score: 84 },
      { month: 'Sep', score: 85 },
      { month: 'Oct', score: 86 },
      { month: 'Nov', score: 87 },
      { month: 'Dec', score: 88 },
    ],
  },
  {
    id: 'hr-3',
    teacherName: 'Ust. Ibrahim Hakim',
    className: 'VIII A',
    studentCount: 28,
    metrics: {
      dailyReportCompletion: 78,
      attendanceAccuracy: 90,
      parentEngagement: 75,
      tahfidzProgress: 85,
      behaviorManagement: 80,
      administrativeTask: 70,
    },
    overallScore: 80,
    trend: 'down',
    monthlyData: [
      { month: 'Jul', score: 85 },
      { month: 'Aug', score: 83 },
      { month: 'Sep', score: 82 },
      { month: 'Oct', score: 81 },
      { month: 'Nov', score: 80 },
      { month: 'Dec', score: 80 },
    ],
  },
];

const METRIC_LABELS: Record<string, string> = {
  dailyReportCompletion: 'Laporan Harian',
  attendanceAccuracy: 'Kehadiran',
  parentEngagement: 'Komunikasi Ortu',
  tahfidzProgress: 'Progress Tahfidz',
  behaviorManagement: 'Pengelolaan Perilaku',
  administrativeTask: 'Administrasi',
};

const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-green-600';
  if (score >= 80) return 'text-blue-600';
  if (score >= 70) return 'text-yellow-600';
  return 'text-red-600';
};

const getScoreBg = (score: number) => {
  if (score >= 90) return 'bg-green-100';
  if (score >= 80) return 'bg-blue-100';
  if (score >= 70) return 'bg-yellow-100';
  return 'bg-red-100';
};

export default function HomeroomPerformancePage() {
  const [selectedPeriod, setSelectedPeriod] = useState('semester');
  const [selectedTeacher, setSelectedTeacher] = useState<string>(mockHomeroomData[0].id);

  const currentTeacher = mockHomeroomData.find(t => t.id === selectedTeacher) || mockHomeroomData[0];

  // Radar chart data
  const radarData = Object.entries(currentTeacher.metrics).map(([key, value]) => ({
    metric: METRIC_LABELS[key] || key,
    value,
    fullMark: 100,
  }));

  // Average scores
  const avgScore = Math.round(
    mockHomeroomData.reduce((sum, t) => sum + t.overallScore, 0) / mockHomeroomData.length
  );

  return (
    <MainLayout allowedRoles={['SUPER_ADMIN', 'UNIT_ADMIN']}>
      <div className="space-y-6">
        <PageHeader
          title="Performa Wali Kelas"
          description="Evaluasi kinerja wali kelas berdasarkan multiple metrics"
          actions={
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Bulan Ini</SelectItem>
                <SelectItem value="semester">Semester Ini</SelectItem>
                <SelectItem value="year">Tahun Ini</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Wali Kelas</p>
                  <p className="text-2xl font-bold">{mockHomeroomData.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Skor Rata-rata</p>
                  <p className="text-2xl font-bold">{avgScore}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Star className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Performa Terbaik</p>
                  <p className="text-2xl font-bold">{mockHomeroomData.filter(t => t.overallScore >= 90).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Perlu Perhatian</p>
                  <p className="text-2xl font-bold">{mockHomeroomData.filter(t => t.overallScore < 80).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teacher Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {mockHomeroomData.map((teacher) => (
            <Card
              key={teacher.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-lg',
                selectedTeacher === teacher.id && 'ring-2 ring-primary'
              )}
              onClick={() => setSelectedTeacher(teacher.id)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold">{teacher.teacherName}</h3>
                    <p className="text-sm text-muted-foreground">{teacher.className} • {teacher.studentCount} siswa</p>
                  </div>
                  <div className={cn('text-3xl font-bold', getScoreColor(teacher.overallScore))}>
                    {teacher.overallScore}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {teacher.trend === 'up' ? (
                    <Badge className="bg-green-100 text-green-700">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Meningkat
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      Menurun
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detail Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{currentTeacher.teacherName}</CardTitle>
              <CardDescription>Detail performa per kategori</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Skor"
                      dataKey="value"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.5}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Tren Performa</CardTitle>
              <CardDescription>Perkembangan skor 6 bulan terakhir</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={currentTeacher.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="score" name="Skor" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metric Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Breakdown Metrik - {currentTeacher.teacherName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(currentTeacher.metrics).map(([key, value]) => (
                <div key={key} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{METRIC_LABELS[key]}</span>
                    <span className={cn('font-bold', getScoreColor(value))}>{value}%</span>
                  </div>
                  <Progress value={value} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
