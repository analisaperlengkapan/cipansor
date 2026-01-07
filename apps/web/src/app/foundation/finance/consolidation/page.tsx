'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout';
import { PageHeader } from '@/components/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Building2, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  PiggyBank,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
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
  Legend,
} from 'recharts';

// Mock consolidated financial data across all units
const mockFinancialData = {
  totalRevenue: 4850000000,
  totalExpenses: 3920000000,
  netIncome: 930000000,
  previousMonthRevenue: 4500000000,
  cashOnHand: 2150000000,
  receivables: 580000000,
  payables: 320000000,
  units: [
    { name: 'Pesantren', revenue: 1850000000, expenses: 1450000000, students: 450, color: '#22c55e' },
    { name: 'SMA Al-Quran', revenue: 1200000000, expenses: 950000000, students: 320, color: '#6366f1' },
    { name: 'SMP IT', revenue: 980000000, expenses: 780000000, students: 280, color: '#f59e0b' },
    { name: 'SD IT', revenue: 650000000, expenses: 580000000, students: 210, color: '#ec4899' },
    { name: 'TK', revenue: 170000000, expenses: 160000000, students: 85, color: '#14b8a6' },
  ],
  monthlyTrend: [
    { month: 'Jul', income: 750, expense: 620 },
    { month: 'Aug', income: 820, expense: 680 },
    { month: 'Sep', income: 780, expense: 640 },
    { month: 'Oct', income: 850, expense: 720 },
    { month: 'Nov', income: 890, expense: 750 },
    { month: 'Dec', income: 930, expense: 780 },
  ],
};

const formatCurrency = (value: number) => {
  if (value >= 1000000000) {
    return `Rp ${(value / 1000000000).toFixed(1)} M`;
  }
  if (value >= 1000000) {
    return `Rp ${(value / 1000000).toFixed(0)} Jt`;
  }
  return `Rp ${value.toLocaleString('id-ID')}`;
};

export default function FinanceConsolidationPage() {
  const [period, setPeriod] = useState('current-year');
  const data = mockFinancialData;
  
  const revenueGrowth = ((data.totalRevenue - data.previousMonthRevenue) / data.previousMonthRevenue) * 100;

  return (
    <MainLayout allowedRoles={['SUPER_ADMIN', 'FOUNDATION_ADMIN']}>
      <div className="space-y-6">
        <PageHeader
          title="Konsolidasi Keuangan Yayasan"
          description="Laporan keuangan terintegrasi seluruh unit pendidikan"
          actions={
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-month">Bulan Ini</SelectItem>
                <SelectItem value="current-year">Tahun Ini</SelectItem>
                <SelectItem value="last-year">Tahun Lalu</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Pendapatan</p>
                  <p className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1 text-sm">
                {revenueGrowth >= 0 ? (
                  <>
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">+{revenueGrowth.toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                    <span className="text-red-600">{revenueGrowth.toFixed(1)}%</span>
                  </>
                )}
                <span className="text-muted-foreground">vs bulan lalu</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Pengeluaran</p>
                  <p className="text-2xl font-bold">{formatCurrency(data.totalExpenses)}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Laba Bersih</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(data.netIncome)}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <PiggyBank className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Kas Tersedia</p>
                  <p className="text-2xl font-bold">{formatCurrency(data.cashOnHand)}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Wallet className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue by Unit */}
          <Card>
            <CardHeader>
              <CardTitle>Pendapatan per Unit</CardTitle>
              <CardDescription>Distribusi pendapatan seluruh unit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.units}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="revenue"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {data.units.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Tren Bulanan</CardTitle>
              <CardDescription>Pendapatan vs Pengeluaran (dalam juta)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="income" name="Pendapatan" fill="#22c55e" />
                    <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Unit Details Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Rincian per Unit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Unit</th>
                    <th className="text-right py-3 px-4">Pendapatan</th>
                    <th className="text-right py-3 px-4">Pengeluaran</th>
                    <th className="text-right py-3 px-4">Laba</th>
                    <th className="text-right py-3 px-4">Siswa</th>
                    <th className="text-right py-3 px-4">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {data.units.map((unit) => {
                    const profit = unit.revenue - unit.expenses;
                    const margin = (profit / unit.revenue) * 100;
                    return (
                      <tr key={unit.name} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: unit.color }} />
                            <span className="font-medium">{unit.name}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4">{formatCurrency(unit.revenue)}</td>
                        <td className="text-right py-3 px-4">{formatCurrency(unit.expenses)}</td>
                        <td className="text-right py-3 px-4 text-green-600 font-medium">
                          {formatCurrency(profit)}
                        </td>
                        <td className="text-right py-3 px-4">{unit.students}</td>
                        <td className="text-right py-3 px-4">
                          <Badge variant={margin > 15 ? 'default' : margin > 5 ? 'secondary' : 'destructive'}>
                            {margin.toFixed(1)}%
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50 font-bold">
                    <td className="py-3 px-4">Total</td>
                    <td className="text-right py-3 px-4">{formatCurrency(data.totalRevenue)}</td>
                    <td className="text-right py-3 px-4">{formatCurrency(data.totalExpenses)}</td>
                    <td className="text-right py-3 px-4 text-green-600">{formatCurrency(data.netIncome)}</td>
                    <td className="text-right py-3 px-4">{data.units.reduce((sum, u) => sum + u.students, 0)}</td>
                    <td className="text-right py-3 px-4">
                      <Badge>{((data.netIncome / data.totalRevenue) * 100).toFixed(1)}%</Badge>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
