'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { ShieldCheck, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

interface GrcStatsOverviewProps {
  stats: {
    orgHealthScore: number;
    plans: { activeCount: number; averageProgress: number };
    risks: { total: number; byLevel: Record<string, number>; criticalCount: number };
    audits: { resolutionRate: number; totalFindings: number };
    sharia: { complianceRate: number };
    trend?: { month: string; avgRiskScore: number; complianceRate: number }[];
  };
}

export function GrcStatsOverview({ stats }: GrcStatsOverviewProps) {
  const riskData = [
    { name: 'Low', value: stats.risks.byLevel.LOW || 0, color: '#22c55e' },
    { name: 'Medium', value: stats.risks.byLevel.MEDIUM || 0, color: '#eab308' },
    { name: 'High', value: stats.risks.byLevel.HIGH || 0, color: '#f97316' },
    { name: 'Extreme', value: stats.risks.byLevel.EXTREME || 0, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Org Health Score</CardTitle>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orgHealthScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">Weighted composite index</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Critical Risks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stats.risks.criticalCount}</div>
            <p className="text-xs text-red-600 mt-1">High & Extreme levels</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit Resolution</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.audits.resolutionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">From {stats.audits.totalFindings} findings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sharia Compliance</CardTitle>
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sharia.complianceRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Average compliance score</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Health Trend (6 Months)</CardTitle>
            <CardDescription>Average risk score vs Compliance rate</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="complianceRate"
                  name="Compliance %"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="avgRiskScore"
                  name="Avg Risk Score"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Profile</CardTitle>
            <CardDescription>Number of open risks by level</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="value" name="Count" radius={[0, 4, 4, 0]}>
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
