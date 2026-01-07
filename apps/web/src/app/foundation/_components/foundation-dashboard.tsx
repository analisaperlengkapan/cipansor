'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFoundationStats } from '@/hooks/use-foundation';
import {
  Users,
  GraduationCap,
  Building2,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Loader2 } from 'lucide-react';

interface FoundationDashboardProps {
  foundationId: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function FoundationDashboard({ foundationId }: FoundationDashboardProps) {
  const { data: stats, isLoading, isError } = useFoundationStats(foundationId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-destructive">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <p>Gagal memuat data statistik</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Data statistik tidak tersedia
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Tersebar di {stats.totalUnits} unit pendidikan
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pegawai</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalTeachers + stats.totalStaff}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalTeachers} Guru & {stats.totalStaff} Staff
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendapatan Bersih (YTD)</CardTitle>
            {stats.financialSummary.netIncome >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.financialSummary.netIncome < 0 ? 'text-red-500' : 'text-green-600'}`}>
              {formatCurrency(stats.financialSummary.netIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              Rev: {formatCurrency(stats.financialSummary.totalRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Dokumen</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {stats.expiringDocuments > 0 ? (
                <span className="text-amber-500 flex items-center font-medium">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  {stats.expiringDocuments} perlu perhatian
                </span>
              ) : (
                <span className="text-green-600 flex items-center">
                  Semua dokumen aman
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Student Distribution Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Distribusi Siswa per Unit</CardTitle>
            <CardDescription>
              Jumlah siswa aktif berdasarkan unit pendidikan
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.studentDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="unitName"
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [`${value} Siswa`, 'Jumlah']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Siswa" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Staff Distribution (Simulated Pie Chart from Units Summary) */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Komposisi SDM</CardTitle>
            <CardDescription>
              Perbandingan Guru dan Tenaga Kependidikan
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Guru', value: stats.totalTeachers },
                    { name: 'Staff', value: stats.totalStaff },
                    { name: 'Pengurus', value: stats.activeBoardMembers },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#0088FE" />
                  <Cell fill="#00C49F" />
                  <Cell fill="#FFBB28" />
                </Pie>
                <Tooltip />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                  <tspan x="50%" dy="-1em" fontSize="24" fontWeight="bold">
                    {stats.totalTeachers + stats.totalStaff + stats.activeBoardMembers}
                  </tspan>
                  <tspan x="50%" dy="1.5em" fontSize="12" fill="#666">
                    Total SDM
                  </tspan>
                </text>
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#0088FE]" />
                <span>Guru ({stats.totalTeachers})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#00C49F]" />
                <span>Staff ({stats.totalStaff})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FFBB28]" />
                <span>Pengurus ({stats.activeBoardMembers})</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity / Units Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Performa Unit Pendidikan</CardTitle>
          <CardDescription>Ringkasan data per unit di bawah yayasan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stats.unitsSummary.map((unit) => (
              <div
                key={unit.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1">
                  <p className="font-medium leading-none">{unit.name}</p>
                  <p className="text-xs text-muted-foreground">{unit.type.replace('_', ' ')}</p>
                </div>
                <div className="text-right text-sm">
                  <div className="font-medium">{unit._count.students} Siswa</div>
                  <div className="text-muted-foreground text-xs">
                    {unit._count.teachers} Guru
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
