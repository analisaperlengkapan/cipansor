'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFoundation, useFoundationStats } from '@/hooks';
import {
  Users,
  School,
  GraduationCap,
  Briefcase,
  FileText,
  AlertTriangle,
  TrendingUp,
  Wallet
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
  Cell
} from 'recharts';
import { Loader2 } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function FoundationDashboard() {
  const { data: foundation, isLoading: isLoadingFoundation } = useFoundation();
  const { data: stats, isLoading: isLoadingStats } = useFoundationStats(foundation?.id);

  if (isLoadingFoundation || isLoadingStats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-96 items-center justify-center text-muted-foreground">
        Data tidak tersedia
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Santri</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Di seluruh {stats.totalUnits} unit pendidikan
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pegawai</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeachers + stats.totalStaff}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalTeachers} Guru & {stats.totalStaff} Staff
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dokumen Yayasan</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            {stats.expiringDocuments > 0 ? (
              <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {stats.expiringDocuments} perlu perhatian
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Semua dokumen aman</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unit Pendidikan</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUnits}</div>
            <p className="text-xs text-muted-foreground">
              Aktif beroperasi
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Student Distribution Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Distribusi Santri per Unit</CardTitle>
            <CardDescription>
              Jumlah siswa aktif di setiap unit pendidikan
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.studentsByUnit}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="unitName"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" name="Jumlah Santri" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Staff Distribution (Pie Chart) */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Komposisi SDM</CardTitle>
            <CardDescription>
              Perbandingan jumlah pegawai antar unit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.staffByUnit}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="unitName"
                  >
                    {stats.staffByUnit.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview (Placeholder for now until real integration) */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Finansial</CardTitle>
          <CardDescription>Estimasi pendapatan dan pengeluaran bulan ini (Simulasi)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
             <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-full">
                  <Wallet className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estimasi Pendapatan</p>
                  <h3 className="text-xl font-bold text-green-700">Rp {stats.financialSummary.totalRevenue.toLocaleString('id-ID')}</h3>
                </div>
             </div>
             <div className="h-8 w-px bg-slate-300 mx-4" />
             <div className="flex items-center gap-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estimasi Pengeluaran</p>
                  <h3 className="text-xl font-bold text-red-700">Rp {stats.financialSummary.totalExpense.toLocaleString('id-ID')}</h3>
                </div>
             </div>
             <div className="h-8 w-px bg-slate-300 mx-4" />
             <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">Net Income</p>
                <h3 className={`text-xl font-bold ${stats.financialSummary.netIncome >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                  Rp {stats.financialSummary.netIncome.toLocaleString('id-ID')}
                </h3>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
