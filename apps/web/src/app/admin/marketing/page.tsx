"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { api } from "@/lib/api";
import { Loader2, TrendingUp, Users, Target, Calendar } from "lucide-react";
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
} from "recharts";
import { MainLayout } from "@/components/layout/main-layout";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export default function MarketingDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["marketing-stats"],
    queryFn: async () => {
      const res = await api.get("/marketing/stats");
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  // Calculate totals
  const totalRegistrants =
    stats?.sources.reduce((acc: number, curr: any) => acc + curr.count, 0) || 0;
  const topSource =
    stats?.sources.sort((a: any, b: any) => b.count - a.count)[0]?.source ||
    "-";
  const topCampaign = stats?.topCampaigns[0]?.name || "-";

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Marketing Dashboard
          </h1>
          <p className="text-muted-foreground">
            Overview of marketing performance, leads, and campaigns.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Registrants (Tracked)
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRegistrants}</div>
              <p className="text-xs text-muted-foreground">
                Leads with tracked source
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Source</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{topSource}</div>
              <p className="text-xs text-muted-foreground">
                Most effective channel
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Top Campaign
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{topCampaign}</div>
              <p className="text-xs text-muted-foreground">
                Highest converting campaign
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Source Distribution</CardTitle>
              <CardDescription>
                Where are your registrants coming from?
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={stats?.sources || []}>
                  <XAxis
                    dataKey="source"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#adfa1d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Top Campaigns</CardTitle>
              <CardDescription>Performance by registrant count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.topCampaigns.map((campaign: any, index: number) => (
                  <div key={index} className="flex items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {campaign.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {campaign.code}
                      </p>
                    </div>
                    <div className="ml-auto font-medium">
                      {campaign.registrants} Leads
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
