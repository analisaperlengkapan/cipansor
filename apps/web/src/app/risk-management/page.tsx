"use client";

import { RiskHeatmap } from "@/components/risk/risk-heatmap";
import { RiskList } from "./risk-list";
import { PageHeader } from "@/components/shared/page-header";
import { useRisks } from "@/hooks/use-risk";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RiskManagementPage() {
  const { data: risks } = useRisks();

  return (
    <div className="container mx-auto py-6 space-y-8">
      <PageHeader
        title="Risk Management"
        description="Monitor and manage risks across the organization."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex justify-center">
          <RiskHeatmap risks={risks || []} />
        </div>

        {/* Summary Stats & Comparison Chart */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-2 bg-slate-50 rounded border">
                  <div className="text-2xl font-bold">{risks?.length || 0}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Risks</div>
                </div>
                <div className="text-center p-2 bg-red-50 rounded border border-red-100">
                  <div className="text-2xl font-bold text-red-600">
                    {risks?.filter(
                      (r: any) =>
                        r.riskLevel === "EXTREME" || r.riskLevel === "HIGH",
                    ).length || 0}
                  </div>
                  <div className="text-xs text-red-500 uppercase tracking-wider">
                    High/Extreme
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold italic">Inherent vs Residual Risk</CardTitle>
            </CardHeader>
            <CardContent className="h-[240px] pt-4">
              {risks && risks.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={risks.slice(0, 8).map((r: any) => ({
                    code: r.code,
                    inherent: r.riskScore,
                    residual: r.residualScore || 0,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="code" fontSize={10} />
                    <YAxis domain={[0, 25]} fontSize={10} />
                    <Tooltip contentStyle={{ fontSize: '12px' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                    <Bar name="Inherent Score" dataKey="inherent" fill="#ef4444" radius={[2, 2, 0, 0]} />
                    <Bar name="Residual Score" dataKey="residual" fill="#10b981" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <RiskList />
    </div>
  );
}
