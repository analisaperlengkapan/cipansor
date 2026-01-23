"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RadarDataPoint {
  subject: string;
  [key: string]: string | number;
}

interface RadarSeries {
  dataKey: string;
  name: string;
  color: string;
  fillOpacity?: number;
}

interface MultiRadarChartProps {
  data: RadarDataPoint[];
  series: RadarSeries[];
  title?: string;
  description?: string;
  maxValue?: number;
  height?: number;
}

const DEFAULT_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
];

export function MultiRadarChart({
  data,
  series,
  title,
  description,
  maxValue = 100,
  height = 400,
}: MultiRadarChartProps) {
  return (
    <Card>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <RadarChart data={data}>
            <PolarGrid gridType="polygon" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, maxValue]}
              tick={{ fill: "#64748b", fontSize: 10 }}
            />
            {series.map((s, idx) => (
              <Radar
                key={s.dataKey}
                name={s.name}
                dataKey={s.dataKey}
                stroke={s.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
                fill={s.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
                fillOpacity={s.fillOpacity ?? 0.3}
              />
            ))}
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
              }}
            />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Demo data generator for unit comparison
export function generateDemoRadarData(units: string[]): {
  data: RadarDataPoint[];
  series: RadarSeries[];
} {
  const subjects = [
    "Kehadiran",
    "Pembayaran",
    "Akademik",
    "Tahfidz",
    "Disiplin",
    "Kegiatan",
  ];

  const data = subjects.map((subject) => {
    const point: RadarDataPoint = { subject };
    units.forEach((unit) => {
      point[unit] = Math.floor(Math.random() * 40) + 60; // 60-100 range
    });
    return point;
  });

  const series = units.map((unit, idx) => ({
    dataKey: unit,
    name: unit,
    color: DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
  }));

  return { data, series };
}
