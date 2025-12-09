'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    Minus,
    Users,
    DollarSign,
    AlertTriangle,
    BookOpen,
    ArrowLeft,
} from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';

interface ForecastResult {
    currentValue: number;
    predictedValue: number;
    trend: 'up' | 'down' | 'stable';
    trendPercentage: number;
    confidence: number;
    dataPoints: Array<{ date: string; value: number; predicted?: boolean }>;
}

interface OutstandingPrediction {
    currentOutstanding: number;
    predictedCollection: number;
    collectionRate: number;
    atRiskAmount: number;
    dataPoints: Array<{ category: string; amount: number }>;
}

interface TahfidzForecast {
    averageCompletionRate: number;
    projectedHafidz: number;
    currentHafidz: number;
    monthlyProgress: Array<{ month: string; totalAyah: number; students: number }>;
}

interface AllForecasts {
    enrollment: ForecastResult;
    payment: ForecastResult;
    outstanding: OutstandingPrediction;
    tahfidz: TahfidzForecast;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
};

const TrendBadge = ({ trend, percentage }: { trend: 'up' | 'down' | 'stable'; percentage: number }) => {
    const colorClass = trend === 'up' ? 'bg-green-100 text-green-800' : trend === 'down' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800';
    return (
        <Badge className={colorClass}>
            <TrendIcon trend={trend} />
            <span className="ml-1">{Math.abs(percentage).toFixed(1)}%</span>
        </Badge>
    );
};

export default function ForecastPage() {
    const [unitId, setUnitId] = useState<string>('all');

    const { data: forecasts, isLoading, error } = useQuery<{ success: boolean; data: AllForecasts }>({
        queryKey: ['forecasts', unitId],
        queryFn: () =>
            api.get('/analytics/forecast', {
                params: unitId !== 'all' ? { unitId } : undefined,
            }).then(res => res.data),
    });

    const { data: units } = useQuery<{ success: boolean; data: Array<{ id: string; name: string }> }>({
        queryKey: ['units'],
        queryFn: () => api.get('/units').then(res => res.data),
    });

    const data = forecasts?.data;

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-red-500">Error loading forecasts. Please try again.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/analytics">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Kembali
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Prediksi & Forecast</h1>
                        <p className="text-muted-foreground">
                            Analisis prediksi berdasarkan data historis 12 bulan terakhir
                        </p>
                    </div>
                </div>
                <Select value={unitId} onValueChange={setUnitId}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Pilih Unit" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Unit</SelectItem>
                        {units?.data?.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                                {unit.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {isLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader className="pb-2">
                                <div className="h-4 bg-gray-200 rounded w-24" />
                            </CardHeader>
                            <CardContent>
                                <div className="h-8 bg-gray-200 rounded w-16" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Prediksi Pendaftaran</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{data?.enrollment?.predictedValue || 0}</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-muted-foreground">6 bulan ke depan</span>
                                    {data?.enrollment && (
                                        <TrendBadge trend={data.enrollment.trend} percentage={data.enrollment.trendPercentage} />
                                    )}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Confidence: {data?.enrollment?.confidence || 0}%
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Prediksi Pembayaran</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(data?.payment?.predictedValue || 0)}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-muted-foreground">6 bulan ke depan</span>
                                    {data?.payment && (
                                        <TrendBadge trend={data.payment.trend} percentage={data.payment.trendPercentage} />
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Risiko Tunggakan</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-600">
                                    {formatCurrency(data?.outstanding?.atRiskAmount || 0)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Collection Rate: {data?.outstanding?.collectionRate?.toFixed(1) || 0}%
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Proyeksi Hafidz</CardTitle>
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    {data?.tahfidz?.projectedHafidz || 0}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Current: {data?.tahfidz?.currentHafidz || 0} | Avg: {data?.tahfidz?.averageCompletionRate || 0} ayah/bulan
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detailed Charts */}
                    <Tabs defaultValue="enrollment" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="enrollment">Pendaftaran</TabsTrigger>
                            <TabsTrigger value="payment">Pembayaran</TabsTrigger>
                            <TabsTrigger value="outstanding">Tunggakan</TabsTrigger>
                            <TabsTrigger value="tahfidz">Tahfidz</TabsTrigger>
                        </TabsList>

                        <TabsContent value="enrollment" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Trend Pendaftaran Siswa</CardTitle>
                                    <CardDescription>
                                        Data historis dan prediksi 6 bulan ke depan (area berwarna lebih terang = prediksi)
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={data?.enrollment?.dataPoints || []}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <ReferenceLine
                                                x={data?.enrollment?.dataPoints?.find(d => d.predicted)?.date}
                                                stroke="#666"
                                                strokeDasharray="3 3"
                                                label="Prediksi"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#8884d8"
                                                fill="#8884d8"
                                                fillOpacity={0.6}
                                                name="Jumlah Pendaftaran"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="payment" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Trend Penerimaan Pembayaran</CardTitle>
                                    <CardDescription>
                                        Data historis dan prediksi 6 bulan ke depan
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={data?.payment?.dataPoints || []}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`} />
                                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                            <Legend />
                                            <Area
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#00C49F"
                                                fill="#00C49F"
                                                fillOpacity={0.6}
                                                name="Total Pembayaran"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="outstanding" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Analisis Tunggakan</CardTitle>
                                    <CardDescription>
                                        Distribusi tunggakan berdasarkan usia tagihan
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data?.outstanding?.dataPoints || []} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`} />
                                            <YAxis dataKey="category" type="category" width={150} />
                                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                            <Legend />
                                            <Bar dataKey="amount" fill="#FF8042" name="Jumlah Tunggakan" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <div className="grid gap-4 md:grid-cols-3">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Total Tunggakan</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xl font-bold">
                                            {formatCurrency(data?.outstanding?.currentOutstanding || 0)}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Prediksi Tertagih</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xl font-bold text-green-600">
                                            {formatCurrency(data?.outstanding?.predictedCollection || 0)}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Berisiko Gagal Bayar</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xl font-bold text-red-600">
                                            {formatCurrency(data?.outstanding?.atRiskAmount || 0)}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="tahfidz" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Progress Tahfidz Bulanan</CardTitle>
                                    <CardDescription>
                                        Total ayah yang dihafalkan dan jumlah santri aktif per bulan
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data?.tahfidz?.monthlyProgress || []}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" />
                                            <YAxis yAxisId="left" />
                                            <YAxis yAxisId="right" orientation="right" />
                                            <Tooltip />
                                            <Legend />
                                            <Bar yAxisId="left" dataKey="totalAyah" fill="#8884d8" name="Total Ayah" />
                                            <Bar yAxisId="right" dataKey="students" fill="#82ca9d" name="Santri Aktif" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>
    );
}
