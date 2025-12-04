'use client';

import { MainLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth';
import {
  useDashboardStats,
  useAttendanceStats,
  useFinanceStats,
} from '@/hooks';
import {
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Calendar,
  AlertTriangle,
  Award,
  Heart,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const CHART_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: stats, isLoading } = useDashboardStats();
  const { data: attendanceData } = useAttendanceStats();
  const { data: financeData } = useFinanceStats();

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Selamat datang, {user?.name}!
          </h1>
          <p className="text-muted-foreground">
            Berikut ringkasan {user?.unit?.name || 'sistem'} hari ini.
          </p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Santri"
            value={stats?.totalStudents ?? '-'}
            description="Santri terdaftar"
            icon={GraduationCap}
            trend={stats?.studentsGrowth}
            isLoading={isLoading}
          />
          <StatsCard
            title="Ustadz/Ustadzah"
            value={stats?.totalTeachers ?? '-'}
            description="Tenaga pengajar"
            icon={Users}
            isLoading={isLoading}
          />
          <StatsCard
            title="Kelas"
            value={stats?.totalClasses ?? '-'}
            description="Kelas aktif"
            icon={BookOpen}
            isLoading={isLoading}
          />
          <StatsCard
            title="Kehadiran"
            value={stats?.attendanceRate ? `${stats.attendanceRate}%` : '-'}
            description="Tingkat kehadiran"
            icon={Calendar}
            isLoading={isLoading}
          />
        </div>

        {/* Secondary Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Unit"
            value={stats?.totalUnits ?? '-'}
            description="Unit pendidikan"
            icon={Building2}
            isLoading={isLoading}
          />
          <StatsCard
            title="Tahun Ajaran"
            value={stats?.activeAcademicYear?.name ?? '-'}
            description="Tahun ajaran aktif"
            icon={Calendar}
            isLoading={isLoading}
          />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pelanggaran</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">-</div>
              <p className="text-xs text-muted-foreground">Bulan ini</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Penghargaan</CardTitle>
              <Award className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Bulan ini</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Activity Section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Attendance Chart - Recharts Area */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Kehadiran 7 Hari Terakhir
              </CardTitle>
              <CardDescription>Tingkat kehadiran harian santri</CardDescription>
            </CardHeader>
            <CardContent>
              {attendanceData && attendanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart
                    data={attendanceData.slice(-7).map(item => {
                      const total = item.present + item.absent + item.sick + item.excused;
                      return {
                        date: format(new Date(item.date), 'EEE', { locale: id }),
                        hadir: item.present,
                        sakit: item.sick,
                        izin: item.excused,
                        alpha: item.absent,
                        rate: total > 0 ? Math.round((item.present / total) * 100) : 0,
                      };
                    })}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorSakit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="hadir" 
                      stroke="#22c55e" 
                      fillOpacity={1} 
                      fill="url(#colorHadir)" 
                      name="Hadir"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sakit" 
                      stroke="#f59e0b" 
                      fillOpacity={1} 
                      fill="url(#colorSakit)" 
                      name="Sakit"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
                  Belum ada data kehadiran
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Aktivitas Terbaru
              </CardTitle>
              <CardDescription>Kegiatan sistem terkini</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <ActivityItem
                  title="Santri baru terdaftar"
                  description="Ahmad Fauzi bergabung di Kelas 7A"
                  time="2 jam lalu"
                  type="student"
                />
                <ActivityItem
                  title="Kehadiran dicatat"
                  description="Kehadiran Kelas 8B sudah direkam"
                  time="3 jam lalu"
                  type="attendance"
                />
                <ActivityItem
                  title="Progress Tahfidz"
                  description="5 santri menyelesaikan Juz 30"
                  time="5 jam lalu"
                  type="tahfidz"
                />
                <ActivityItem
                  title="Pembayaran diterima"
                  description="SPP bulan ini dari 15 santri"
                  time="6 jam lalu"
                  type="finance"
                />
                <ActivityItem
                  title="Izin disetujui"
                  description="3 izin pulang telah disetujui"
                  time="8 jam lalu"
                  type="attendance"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Finance Charts Row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Finance Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Keuangan Bulan Ini
              </CardTitle>
              <CardDescription>Perbandingan tagihan dan pembayaran</CardDescription>
            </CardHeader>
            <CardContent>
              {financeData ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={[
                      { name: 'Total Tagihan', value: financeData.totalBilled || 0, fill: '#3b82f6' },
                      { name: 'Sudah Bayar', value: financeData.totalPaid || 0, fill: '#22c55e' },
                      { name: 'Belum Bayar', value: financeData.totalUnpaid || 0, fill: '#f59e0b' },
                    ]}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis 
                      className="text-xs" 
                      tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`Rp ${(value / 1000000).toFixed(1)} jt`, '']}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {[0, 1, 2].map((index) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#22c55e', '#f59e0b'][index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
                  Belum ada data keuangan
                </div>
              )}
            </CardContent>
          </Card>

          {/* Finance Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Distribusi Pembayaran
              </CardTitle>
              <CardDescription>Tingkat koleksi pembayaran</CardDescription>
            </CardHeader>
            <CardContent>
              {financeData && financeData.totalBilled > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Lunas', value: financeData.totalPaid || 0 },
                        { name: 'Belum Bayar', value: financeData.totalUnpaid || 0 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#22c55e" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`Rp ${(value / 1000000).toFixed(1)} jt`, '']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
                  Belum ada data pembayaran
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Info Row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Health Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Kesehatan Santri
              </CardTitle>
              <CardDescription>Ringkasan kondisi kesehatan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">-</div>
                  <div className="text-xs text-muted-foreground">Sehat</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">-</div>
                  <div className="text-xs text-muted-foreground">Sakit</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">-</div>
                  <div className="text-xs text-muted-foreground">Darurat</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic Year Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Tahun Ajaran Aktif
              </CardTitle>
              <CardDescription>Informasi tahun ajaran berjalan</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.activeAcademicYear ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Nama</span>
                    <span className="font-semibold">{stats.activeAcademicYear.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Mulai</span>
                    <span className="font-semibold">
                      {format(new Date(stats.activeAcademicYear.startDate), 'd MMM yyyy', { locale: id })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Selesai</span>
                    <span className="font-semibold">
                      {format(new Date(stats.activeAcademicYear.endDate), 'd MMM yyyy', { locale: id })}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Belum ada tahun ajaran aktif
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

interface StatsCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: React.ElementType;
  trend?: number;
  isLoading?: boolean;
  negative?: boolean;
}

function StatsCard({ title, value, description, icon: Icon, trend, isLoading, negative }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${negative ? 'text-red-500' : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-8 w-20 animate-pulse rounded bg-muted" />
        ) : (
          <>
            <div className={`text-2xl font-bold ${negative ? 'text-red-600' : ''}`}>{value}</div>
            <div className="flex items-center gap-1">
              <p className="text-xs text-muted-foreground">{description}</p>
              {trend !== undefined && trend !== 0 && (
                <span
                  className={`flex items-center text-xs ${
                    trend > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {trend > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(trend)}%
                </span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface ActivityItemProps {
  title: string;
  description: string;
  time: string;
  type?: string;
}

function ActivityItem({ title, description, time, type }: ActivityItemProps) {
  const getColor = () => {
    switch (type) {
      case 'student': return 'bg-blue-500';
      case 'attendance': return 'bg-green-500';
      case 'tahfidz': return 'bg-purple-500';
      case 'violation': return 'bg-red-500';
      case 'reward': return 'bg-yellow-500';
      case 'health': return 'bg-pink-500';
      case 'finance': return 'bg-emerald-500';
      default: return 'bg-primary';
    }
  };

  return (
    <div className="flex items-start gap-3">
      <div className={`h-2 w-2 mt-2 rounded-full ${getColor()}`} />
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}