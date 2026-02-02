"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingUp, Users, DollarSign } from "lucide-react";
import { StudentRiskTable } from "./risk-table";
import { StudentRiskProfile } from "./types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function StudentRiskPage() {
  const [minScore, setMinScore] = useState("20");

  const { data, isLoading } = useQuery({
    queryKey: ["student-risks", minScore],
    queryFn: async () => {
      const res = await api.get("/risk/students", {
        params: { minScore }
      });
      return res.data.data as StudentRiskProfile[];
    },
  });

  const profiles = data || [];

  // Metrics
  const highRiskCount = profiles.filter(p => p.riskLevel === 'HIGH' || p.riskLevel === 'EXTREME').length;
  const avgRiskScore = profiles.length > 0
    ? (profiles.reduce((acc, curr) => acc + curr.riskScore, 0) / profiles.length).toFixed(1)
    : "0";

  // Highest contributor
  const riskFactors = { behavior: 0, academic: 0, financial: 0, attendance: 0 };
  profiles.forEach(p => {
    riskFactors.behavior += p.details.behavior.riskContribution;
    riskFactors.academic += p.details.academic.riskContribution;
    riskFactors.financial += p.details.financial.riskContribution;
    riskFactors.attendance += p.details.attendance.riskContribution;
  });

  const topFactor = Object.entries(riskFactors).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

  return (
    <div className="container mx-auto py-6 space-y-8">
      <PageHeader
        title="Student Risk Monitoring"
        description="Early warning system for student behavior, academic, and financial risks."
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profiles.length}</div>
            <p className="text-xs text-muted-foreground">Students with score &ge; {minScore}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical / High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highRiskCount}</div>
            <p className="text-xs text-muted-foreground">Need immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRiskScore}</div>
            <p className="text-xs text-muted-foreground">Across monitored students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Factor</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{topFactor}</div>
            <p className="text-xs text-muted-foreground">Highest aggregate contribution</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex justify-end">
        <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Min Risk Score:</span>
            <Select value={minScore} onValueChange={setMinScore}>
                <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Score" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="10">10+</SelectItem>
                    <SelectItem value="20">20+</SelectItem>
                    <SelectItem value="50">50+</SelectItem>
                    <SelectItem value="80">80+</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      <StudentRiskTable data={profiles} isLoading={isLoading} />
    </div>
  );
}
