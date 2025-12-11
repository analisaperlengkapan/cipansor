'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout';
import { PageHeader } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRealtimeDashboard } from '@/hooks/use-realtime-dashboard';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  GraduationCap,
  UserCheck,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Bell,
  RefreshCw,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Mock data for initial state
const mockEnrollmentTrend = [
  { month: 'Jul', PAUD: 120, SDIT: 250, SMPIT: 180, SMAQ: 95, Pesantren: 65 },
  { month: 'Agt', PAUD: 125, SDIT: 255, SMPIT: 185, SMAQ: 98, Pesantren: 68 },
  { month: 'Sep', PAUD: 130, SDIT: 260, SMPIT: 188, SMAQ: 100, Pesantren: 70 },
  { month: 'Okt', PAUD: 135, SDIT: 265, SMPIT: 192, SMAQ: 102, Pesantren: 72 },
  { month: 'Nov', PAUD: 138, SDIT: 268, SMPIT: 195, SMAQ: 105, Pesantren: 75 },
  { month: 'Des', PAUD: 142, SDIT: 272, SMPIT: 198, SMAQ: 108, Pesantren: 78 },
];

const mockAttendanceByUnit = [
  { unit: 'PAUD', rate: 92, present: 131, total: 142, color: '#22c55e' },
  { unit: 'SDIT', rate: 88, present: 239, total: 272, color: '#3b82f6' },
  { unit: 'SMPIT', rate: 85, present: 168, total: 198, color: '#f59e0b' },
  { unit: 'SMAQ', rate: 90, present: 97, total: 108, color: '#8b5cf6' },
  { unit: 'Pesantren', rate: 94, present: 73, total: 78, color: '#ec4899' },
];

interface Alert {
  id: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  timestamp: string;
  unitId: string;
}

const mockAlerts: Alert[] = [
  {
    id: '1',
    message: 'Kehadiran SMPIT hari ini dibawah target (85%)',
    severity: 'WARNING',
    timestamp: new Date().toISOString(),
    unitId: 'smpit-1',
  },
  {
    id: '2',
    message: '12 santri belum murojaah hari ini',
    severity: 'INFO',
    timestamp: new Date().toISOString(),
    unitId: 'pesantren-1',
  },
];

export default function ExecutiveDashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [alerts, setAlerts] = useState(mockAlerts);

  // Initialize WebSocket connection
  const { isConnected, lastUpdate, reconnect } = useRealtimeDashboard({
    enabled: true,
    unitIds: ['all'],
    metrics: ['students', 'attendance', 'tahfidz', 'academic'],
    onMetricsUpdate: (data) => {
      console.log('Metrics updated:', data);
      setMetrics(data);
    },
    onAlert: (alert) => {
      console.log('New alert:', alert);
      setAlerts((prev) => [alert, ...prev].slice(0, 10)); // Keep last 10 alerts
    },
  });

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'w-2 h-2 rounded-full',
          isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        )}
      />
      <span className="text-sm text-muted-foreground">
        {isConnected ? 'Terhubung' : 'Terputus'}
      </span>
      {lastUpdate && (
        <span className="text-xs text-muted-foreground">
          • Update {format(lastUpdate, 'HH:mm:ss')}
        </span>
      )}
      {!isConnected && (
        <Button variant="ghost" size="sm" onClick={reconnect}>
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <PageHeader
              title="Dashboard Eksekutif Yayasan"
              description="Monitoring real-time seluruh unit pendidikan"
            />
          </div>
          <div className="flex items-center gap-3">
            <ConnectionStatus />
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Alerts Panel */}
        {alerts.length > 0 && (
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-orange-600" />
                  <CardTitle className="text-sm">Notifikasi & Alert</CardTitle>
                </div>
                <Badge variant="secondary">{alerts.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 p-3 bg-white rounded-lg border"
                  >
                    <AlertTriangle
                      className={cn(
                        'h-4 w-4 mt-0.5',
                        alert.severity === 'CRITICAL' && 'text-red-600',
                        alert.severity === 'WARNING' && 'text-orange-600',
                        alert.severity === 'INFO' && 'text-blue-600'
                      )}
                    />
                    <div className="flex-1">
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(alert.timestamp), 'HH:mm', { locale: idLocale })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.students?.total || 798}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {metrics?.students?.active || 750} aktif
                </Badge>
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +5.2%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Dari bulan lalu
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Guru</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.teachers?.total || 85}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  82 aktif
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Across all units
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Kehadiran Hari Ini</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.attendance?.rate || 89}%
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs">
                  {metrics?.attendance?.present || 708} dari {metrics?.attendance?.total || 798}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Update real-time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tahfidz Progress</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.tahfidz?.totalHafidz || 156}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs">
                  Avg: {metrics?.tahfidz?.avgQuality || 84.5}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {metrics?.tahfidz?.simaanThisMonth || 12} simaan
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Bulan ini
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Enrollment Trend */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Tren Pendaftaran Siswa</CardTitle>
              <CardDescription>
                Jumlah siswa aktif per unit dalam 6 bulan terakhir
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockEnrollmentTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="PAUD"
                      stackId="1"
                      stroke="#22c55e"
                      fill="#22c55e"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="SDIT"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="SMPIT"
                      stackId="1"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="SMAQ"
                      stackId="1"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="Pesantren"
                      stackId="1"
                      stroke="#ec4899"
                      fill="#ec4899"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Attendance by Unit */}
          <Card>
            <CardHeader>
              <CardTitle>Kehadiran per Unit</CardTitle>
              <CardDescription>Tingkat kehadiran hari ini</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockAttendanceByUnit}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="unit" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="rate" fill="#3b82f6" name="Kehadiran (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Unit Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Perbandingan Unit</CardTitle>
              <CardDescription>Kehadiran dan siswa aktif</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAttendanceByUnit.map((unit) => (
                  <div key={unit.unit} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: unit.color }}
                        />
                        <span className="font-medium">{unit.unit}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">
                          {unit.present}/{unit.total}
                        </span>
                        <Badge
                          variant={unit.rate >= 90 ? 'default' : 'secondary'}
                          className="min-w-[60px] justify-center"
                        >
                          {unit.rate}%
                        </Badge>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${unit.rate}%`,
                          backgroundColor: unit.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Activity Feed */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <CardTitle>Aktivitas Real-time</CardTitle>
              </div>
              <Badge variant="outline" className="gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground text-center py-8">
              Streaming aktivitas akan muncul di sini...
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
