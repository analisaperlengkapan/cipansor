"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Legend
} from "recharts";
import { GraduationCap, School, Globe2, Award } from "lucide-react";

interface UniversityPlacementStatsProps {
  data: any[];
}

export function UniversityPlacementStats({ data }: UniversityPlacementStatsProps) {
  // Process data for charts
  const universityCounts = data.reduce((acc: any, curr) => {
    acc[curr.institution] = (acc[curr.institution] || 0) + 1;
    return acc;
  }, {});

  const pathCounts = data.reduce((acc: any, curr) => {
    const path = curr.admissionPath || "Lainnya";
    acc[path] = (acc[path] || 0) + 1;
    return acc;
  }, {});

  const barData = Object.entries(universityCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 5);

  const pieData = Object.entries(pathCounts)
    .map(([name, value]) => ({ name, value }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const stats = [
    { label: "Total Lulusan Kuliah", value: data.length, icon: GraduationCap, color: "text-blue-600" },
    { label: "PTN / Kampus Favorit", value: Object.keys(universityCounts).length, icon: School, color: "text-green-600" },
    { label: "Luar Negeri", value: data.filter(d => d.isInternational).length, icon: Globe2, color: "text-purple-600" },
    { label: "Penerima Beasiswa", value: data.filter(d => d.scholarshipName).length, icon: Award, color: "text-yellow-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className={`p-3 rounded-full bg-muted ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sebaran Universitas</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={150} fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Jalur Masuk</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
