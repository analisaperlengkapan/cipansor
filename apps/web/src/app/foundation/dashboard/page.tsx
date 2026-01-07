'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell
} from 'recharts';
import { Users, TrendingUp, Wallet, School, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

// Types (should match backend)
interface ExecutiveSummary {
  totalStudents: number;
  totalTeachers: number;
  totalStaff: number;
  totalUnits: number;
  growth: {
    students: number;
  };
}

interface FinancialOverview {
  currentMonth: {
    revenue: number;
    expense: number;
    net: number;
  };
  lastMonth: {
    revenue: number;
    expense: number;
    net: number;
  };
  byUnit: {
    unitId: string;
    unitName: string;
    revenue: number;
    expense: number;
  }[];
}

interface UnitComparison {
  unitId: string;
  unitName: string;
  studentCount: number;
  teacherCount: number;
  studentTeacherRatio: number;
  averageGrade: number;
}

export default function FoundationDashboardPage() {
  const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
  const [finance, setFinance] = useState<FinancialOverview | null>(null);
  const [units, setUnits] = useState<UnitComparison[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, financeRes, unitsRes] = await Promise.all([
          api.get('/foundation/stats/executive'),
          api.get('/foundation/stats/financial'),
          api.get('/foundation/stats/units'),
        ]);

        setSummary(summaryRes.data.data);
        setFinance(financeRes.data.data);
        setUnits(unitsRes.data.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Eksekutif Yayasan</h1>
          <p className="text-muted-foreground">
            Ringkasan performa seluruh unit pendidikan di bawah yayasan
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.totalStudents}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                {summary?.growth.students && summary.growth.students > 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={summary?.growth.students && summary.growth.students > 0 ? 'text-green-500' : 'text-red-500'}>
                  {summary?.growth.students}%
                </span>
                <span className="ml-1">dari bulan lalu</span>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Guru & Staff</CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(summary?.totalTeachers || 0) + (summary?.totalStaff || 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary?.totalTeachers} Guru, {summary?.totalStaff} Staff
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendapatan Bulan Ini</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(finance?.currentMonth.revenue || 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Pengeluaran: {formatCurrency(finance?.currentMonth.expense || 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Unit</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.totalUnits}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Unit Pendidikan Aktif
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financial">Keuangan</TabsTrigger>
            <TabsTrigger value="academic">Akademik & SDM</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Distribusi Siswa per Unit</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={units}>
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
                      <Bar dataKey="studentCount" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Jumlah Siswa" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Rasio Guru : Siswa</CardTitle>
                  <CardDescription>Beban kerja guru per unit</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={units} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="unitName"
                        type="category"
                        width={100}
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip cursor={{ fill: 'transparent' }} />
                      <Bar dataKey="studentTeacherRatio" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Siswa per Guru">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {units.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.studentTeacherRatio > 20 ? '#ef4444' : '#22c55e'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Perbandingan Pendapatan & Pengeluaran per Unit</CardTitle>
                <CardDescription>Bulan Ini</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={finance?.byUnit}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="unitName" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `Rp${(value / 1000000).toFixed(0)}jt`}
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      cursor={{ fill: 'transparent' }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" name="Pendapatan" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="academic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Rata-rata Nilai Akademik</CardTitle>
                <CardDescription>Berdasarkan Rapor Semester Berjalan</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={units}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="unitName" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="averageGrade"
                      name="Rata-rata Nilai"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
