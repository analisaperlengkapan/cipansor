'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFoundationStats } from '@/hooks/use-foundation';
import {
  Users,
  GraduationCap,
  Briefcase,
  Wallet,
  TrendingUp,
  TrendingDown,
  FileText,
  AlertTriangle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

interface FoundationDashboardProps {
  foundationId: string;
}

export function FoundationDashboard({ foundationId }: FoundationDashboardProps) {
  const { data: stats, isLoading } = useFoundationStats(foundationId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Tidak ada data statistik tersedia
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.summary.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Di {stats.summary.totalUnits} unit pendidikan
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
              {stats.summary.totalTeachers + stats.summary.totalStaff}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.summary.totalTeachers} Guru & {stats.summary.totalStaff} Staff
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pemasukan Bulan Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.summary.totalRevenueMonth)}</div>
            <p className="text-xs text-muted-foreground">
              Total pendapatan periode ini
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Aset</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.summary.totalAssets)}</div>
            <p className="text-xs text-muted-foreground">
              Valuasi aset tercatat
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Unit Distribution Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Distribusi Siswa & Pegawai per Unit</CardTitle>
            <CardDescription>
              Perbandingan jumlah siswa dan pegawai antar unit pendidikan
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.unitsDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value.split(' ').slice(0, 2).join(' ')} // Shorten names
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="studentCount" name="Siswa" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="teacherCount" name="Guru" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Documents & Alerts */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Status Dokumen</CardTitle>
            <CardDescription>
              Dokumen legalitas yang perlu perhatian
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentDocuments.length > 0 ? (
                stats.recentDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        doc.status === 'expired' ? 'bg-red-100 text-red-600' :
                        doc.status === 'expiring' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {doc.status === 'valid' ? <FileText className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm line-clamp-1">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.expiryDate ? format(new Date(doc.expiryDate), 'd MMM yyyy', { locale: id }) : 'Tidak ada kadaluarsa'}
                        </p>
                      </div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                      doc.status === 'expired' ? 'bg-red-100 text-red-700' :
                      doc.status === 'expiring' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {doc.status === 'expired' ? 'Expired' :
                       doc.status === 'expiring' ? 'Segera' : 'Aktif'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  Tidak ada dokumen yang perlu ditampilkan
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Tren Keuangan (6 Bulan Terakhir)</CardTitle>
          <CardDescription>
            Grafik pendapatan vs pengeluaran yayasan (simulasi tren)
          </CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.financialTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="period"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `Rp${(value / 1000000).toFixed(0)}jt`}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Pemasukan"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  name="Pengeluaran"
                  stroke="#dc2626"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
