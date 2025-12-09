'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    DollarSign,
    TrendingUp,
    CheckCircle,
    RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface PaymentEvent {
    invoiceId: string;
    studentName: string;
    amount: number;
    type: string;
    unitName: string;
    time: string;
}

interface RecentPaymentsWidgetProps {
    maxItems?: number;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export function RecentPaymentsWidget({ maxItems = 10 }: RecentPaymentsWidgetProps) {
    const [payments, setPayments] = useState<PaymentEvent[]>([]);
    const [todayTotal, setTodayTotal] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    useEffect(() => {
        // Simulate polling for real-time updates
        const fetchRecentPayments = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/analytics/finance`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data) {
                        setTodayTotal(data.data.totalRevenue || 0);
                    }
                    setIsConnected(true);
                    setLastUpdate(new Date());
                }
            } catch (error) {
                setIsConnected(false);
            }
        };

        fetchRecentPayments();
        const interval = setInterval(fetchRecentPayments, 30000);

        return () => clearInterval(interval);
    }, []);

    // Demo data
    useEffect(() => {
        if (payments.length === 0) {
            const demoPayments: PaymentEvent[] = [
                {
                    invoiceId: '1',
                    studentName: 'Ahmad Fauzi',
                    amount: 1500000,
                    type: 'SPP',
                    unitName: 'SMP IT',
                    time: new Date().toISOString(),
                },
                {
                    invoiceId: '2',
                    studentName: 'Fatimah Az-Zahra',
                    amount: 750000,
                    type: 'Uang Makan',
                    unitName: 'SD IT',
                    time: new Date(Date.now() - 300000).toISOString(),
                },
                {
                    invoiceId: '3',
                    studentName: 'Muhammad Rizki',
                    amount: 2000000,
                    type: 'SPP',
                    unitName: 'SMA',
                    time: new Date(Date.now() - 600000).toISOString(),
                },
                {
                    invoiceId: '4',
                    studentName: 'Aisyah Putri',
                    amount: 500000,
                    type: 'Kegiatan',
                    unitName: 'PAUD',
                    time: new Date(Date.now() - 900000).toISOString(),
                },
            ];
            setPayments(demoPayments);
            setTodayTotal(demoPayments.reduce((sum, p) => sum + p.amount, 0));
        }
    }, [payments.length]);

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Pembayaran Terbaru
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {isConnected ? (
                            <Badge variant="outline" className="text-green-600 border-green-300">
                                <span className="mr-1 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                Live
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-gray-500">
                                Offline
                            </Badge>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">Hari ini:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(todayTotal)}</span>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[280px]">
                    <div className="space-y-1 p-4 pt-0">
                        {payments.slice(0, maxItems).map((payment, idx) => (
                            <div
                                key={`${payment.invoiceId}-${idx}`}
                                className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors border-l-2 border-green-500"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{payment.studentName}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {payment.type} • {payment.unitName}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-green-600">
                                        +{formatCurrency(payment.amount)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(payment.time), { addSuffix: true, locale: id })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
