"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ShieldAlert, TrendingUp, CheckCircle2, ClipboardCheck, Scale, Activity } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";

// Mock Data for the Dashboard
const planProgressData = [
  { name: 'RENSTRA Pusat', expected: 100, actual: 85 },
  { name: 'RKAS Thn 2025', expected: 40, actual: 45 },
  { name: 'Program IT', expected: 60, actual: 50 },
  { name: 'Pengembangan SDM', expected: 80, actual: 65 },
];

const riskMatrixData = [
  { level: 'Extreme', count: 3, color: 'bg-red-600' },
  { level: 'High', count: 12, color: 'bg-orange-500' },
  { level: 'Medium', count: 24, color: 'bg-yellow-400' },
  { level: 'Low', count: 15, color: 'bg-green-500' },
];

export default function GrcDashboardPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <PageHeader 
        title="Executive GRC Dashboard" 
        description="Pusat Kendali Governance, Risk, and Compliance SIM Cipansor" 
      />

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-600 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-sm font-medium flex items-center justify-between">
              Strategic Plans <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardDescription>
            <CardTitle className="text-2xl pt-2">12 Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground mt-1">Average Progress: 68%</div>
            <Progress value={68} className="h-1 mt-2 bg-blue-100" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-600 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-sm font-medium flex items-center justify-between">
              Critical Risks <ShieldAlert className="h-4 w-4 text-rose-600" />
            </CardDescription>
            <CardTitle className="text-2xl pt-2">15 Risks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground mt-1">
              <span className="text-rose-600 font-bold">3 Extreme</span>, 12 High
            </div>
            <Progress value={85} className="h-1 mt-2 bg-rose-100" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-600 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-sm font-medium flex items-center justify-between">
              Open Audits <ClipboardCheck className="h-4 w-4 text-amber-600" />
            </CardDescription>
            <CardTitle className="text-2xl pt-2">8 Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground mt-1">
              <span className="text-amber-600 font-bold">5 Unresolved</span>, 3 In Progress
            </div>
            <Progress value={35} className="h-1 mt-2 bg-amber-100" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-sm font-medium flex items-center justify-between">
              Sharia Compliance <Scale className="h-4 w-4 text-emerald-600" />
            </CardDescription>
            <CardTitle className="text-2xl pt-2">94% Compliant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> All DSN MUI Rules Met
            </div>
            <Progress value={94} className="h-1 mt-2 bg-emerald-100" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Strategic Plan Chart */}
        <Card className="shadow-md border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-slate-700" /> 
              Strategic Plan Execution Tracker
            </CardTitle>
            <CardDescription>Target VS Actual Performance across major initiatives</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={planProgressData}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{fill: '#f1f5f9'}}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="expected" name="Target (%)" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="actual" name="Actual (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Heatmap (Custom matrix) */}
        <Card className="shadow-md border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-slate-700" /> 
              Enterprise Risk Heatmap
            </CardTitle>
            <CardDescription>Distribution of active risks by severity and impact</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              {/* Fake 3x3 or 4x4 Grid representation using div boxes */}
              <div className="relative pt-[20px] pl-[20px] aspect-square max-w-[300px] mx-auto">
                <div className="absolute left-0 top-1/2 -rotate-90 -translate-x-full text-xs font-semibold text-slate-500 tracking-wider">
                  LIKELIHOOD ➔
                </div>
                <div className="absolute bottom-0 left-1/2 translate-y-full text-xs font-semibold text-slate-500 tracking-wider mt-4">
                  IMPACT ➔
                </div>
                
                <div className="grid grid-cols-4 grid-rows-4 gap-1 w-full h-full">
                  {/* Row 1 (High Likelihood) */}
                  <div className="bg-yellow-300 rounded shadow-inner flex items-center justify-center font-bold text-yellow-800">1</div>
                  <div className="bg-orange-400 rounded shadow-inner flex items-center justify-center font-bold text-orange-900">4</div>
                  <div className="bg-red-500 rounded shadow-inner flex items-center justify-center font-bold text-white text-lg">2</div>
                  <div className="bg-red-600 rounded shadow-inner flex items-center justify-center font-bold text-white text-xl ring-2 ring-red-400">1</div>
                  
                  {/* Row 2 */}
                  <div className="bg-green-400 rounded shadow-inner flex items-center justify-center font-bold text-green-900">2</div>
                  <div className="bg-yellow-300 rounded shadow-inner flex items-center justify-center font-bold text-yellow-800">5</div>
                  <div className="bg-orange-400 rounded shadow-inner flex items-center justify-center font-bold text-orange-900">3</div>
                  <div className="bg-red-500 rounded shadow-inner flex items-center justify-center font-bold text-white text-lg">2</div>

                  {/* Row 3 */}
                  <div className="bg-green-500 rounded shadow-inner flex items-center justify-center font-bold text-green-950">6</div>
                  <div className="bg-green-400 rounded shadow-inner flex items-center justify-center font-bold text-green-900">4</div>
                  <div className="bg-yellow-300 rounded shadow-inner flex items-center justify-center font-bold text-yellow-800">7</div>
                  <div className="bg-orange-400 rounded shadow-inner flex items-center justify-center font-bold text-orange-900">2</div>

                  {/* Row 4 (Low Likelihood) */}
                  <div className="bg-emerald-500 rounded shadow-inner flex items-center justify-center font-bold text-emerald-950">5</div>
                  <div className="bg-green-500 rounded shadow-inner flex items-center justify-center font-bold text-green-950">2</div>
                  <div className="bg-green-400 rounded shadow-inner flex items-center justify-center font-bold text-green-900">5</div>
                  <div className="bg-yellow-300 rounded shadow-inner flex items-center justify-center font-bold text-yellow-800">3</div>
                </div>
              </div>
            </div>

            <div className="w-full md:w-1/3 space-y-3 pt-4 border-t md:border-t-0 md:border-l md:pl-6 border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-widest mb-4">Risk Profile</h4>
              {riskMatrixData.map((tier) => (
                <div key={tier.level} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${tier.color}`} />
                    <span className="font-medium text-slate-600">{tier.level}</span>
                  </div>
                  <Badge variant="outline" className="font-bold">{tier.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cross-Module Integration Demo Log */}
      <Card className="border-indigo-100 shadow-md bg-indigo-50/30">
        <CardHeader className="pb-3 border-b border-indigo-100">
          <CardTitle className="text-indigo-800 text-base">Latest GRC Events Integration</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="mt-0.5"><div className="w-2 h-2 rounded-full bg-amber-500 ring-4 ring-amber-100" /></div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Audit Finding #FND-044 Linked to Risk R-012</p>
                <p className="text-xs text-slate-500 mt-1">Audit "SPI Q1 Keuangan" discovered a control failure directly affecting "Operational Budget Overrun" risk. Sent to Mitigation plan.</p>
                <div className="text-xs text-slate-400 mt-2">2 hours ago</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-0.5"><div className="w-2 h-2 rounded-full bg-rose-500 ring-4 ring-rose-100" /></div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Risk Profile Elevated: IT System Outage</p>
                <p className="text-xs text-slate-500 mt-1">Risk score increased to EXTREME for Strategic Plan "Transformasi Digital 2025". Notification sent to the Board of Directors.</p>
                <div className="text-xs text-slate-400 mt-2">5 hours ago</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-0.5"><div className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" /></div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Sharia Board Cleared Product Review</p>
                <p className="text-xs text-slate-500 mt-1">Fatwa DPS confirmed compliance for the new Tabungan Program. Strategic Plan target updated to "READY for Launch".</p>
                <div className="text-xs text-slate-400 mt-2">1 day ago</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
