"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { RiskHeatmap } from "@/components/risk/risk-heatmap";
import { RiskList } from "./risk-list";
import { PageHeader } from "@/components/shared/page-header";

export default function RiskManagementPage() {
  const { data: risks } = useQuery({
    queryKey: ["risks"],
    queryFn: async () => {
      const res = await api.get("/risk");
      return res.data.data;
    },
  });

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

        {/* Summary Stats can go here */}
        <div className="space-y-4">
          <div className="p-4 border rounded-lg bg-white shadow-sm">
            <h3 className="font-semibold text-lg">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-2 bg-slate-50 rounded">
                <div className="text-2xl font-bold">{risks?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Total Risks</div>
              </div>
              <div className="text-center p-2 bg-slate-50 rounded">
                <div className="text-2xl font-bold text-red-500">
                  {risks?.filter(
                    (r: any) =>
                      r.riskLevel === "EXTREME" || r.riskLevel === "HIGH",
                  ).length || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  High/Extreme Risks
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RiskList />
    </div>
  );
}
