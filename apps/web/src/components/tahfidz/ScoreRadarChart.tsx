"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface ScoreData {
  subject: string;
  score: number;
  fullMark: number;
}

interface ScoreRadarChartProps {
  data: ScoreData[];
  title?: string;
  className?: string;
  showLegend?: boolean;
  color?: string;
  size?: "sm" | "md" | "lg";
}

const sizeConfig = {
  sm: { height: 200, fontSize: 10 },
  md: { height: 300, fontSize: 12 },
  lg: { height: 400, fontSize: 14 },
};

export function ScoreRadarChart({
  data,
  title,
  className = "",
  showLegend = true,
  color = "#10b981",
  size = "md",
}: ScoreRadarChartProps) {
  const config = sizeConfig[size];

  if (!data || data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center h-[${config.height}px] text-muted-foreground ${className}`}
      >
        Tidak ada data untuk ditampilkan
      </div>
    );
  }

  return (
    <div className={className}>
      {title && (
        <h3 className="text-sm font-medium text-center mb-2">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={config.height}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#666", fontSize: config.fontSize }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: "#999", fontSize: config.fontSize - 2 }}
          />
          <Radar
            name="Skor"
            dataKey="score"
            stroke={color}
            fill={color}
            fillOpacity={0.5}
            strokeWidth={2}
          />
          {showLegend && <Legend />}
          <Tooltip
            formatter={(value: any) => [`${value}%`, "Skor"]}
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Simaan-specific radar chart with predefined categories
interface SimaanScoreRadarChartProps {
  tajwid: number;
  makhroj: number;
  fashohah: number;
  tartil: number;
  kelancaran: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function SimaanScoreRadarChart({
  tajwid,
  makhroj,
  fashohah,
  tartil,
  kelancaran,
  className = "",
  size = "md",
}: SimaanScoreRadarChartProps) {
  const data: ScoreData[] = [
    { subject: "Tajwid", score: tajwid, fullMark: 100 },
    { subject: "Makhroj", score: makhroj, fullMark: 100 },
    { subject: "Fashohah", score: fashohah, fullMark: 100 },
    { subject: "Tartil", score: tartil, fullMark: 100 },
    { subject: "Kelancaran", score: kelancaran, fullMark: 100 },
  ];

  return (
    <ScoreRadarChart
      data={data}
      title="Distribusi Nilai Simaan"
      className={className}
      color="#059669"
      size={size}
    />
  );
}

// Multi-student comparison radar chart
interface ComparisonRadarChartProps {
  datasets: {
    name: string;
    data: ScoreData[];
    color: string;
  }[];
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ComparisonRadarChart({
  datasets,
  className = "",
  size = "md",
}: ComparisonRadarChartProps) {
  const config = sizeConfig[size];

  if (!datasets || datasets.length === 0) {
    return (
      <div
        className={`flex items-center justify-center h-[${config.height}px] text-muted-foreground ${className}`}
      >
        Tidak ada data untuk ditampilkan
      </div>
    );
  }

  // Merge all data into single array with multiple score keys
  const subjects = datasets[0]?.data.map((d) => d.subject) || [];
  const mergedData = subjects.map((subject) => {
    const entry: Record<string, string | number> = { subject };
    datasets.forEach((dataset) => {
      const found = dataset.data.find((d) => d.subject === subject);
      entry[dataset.name] = found?.score || 0;
    });
    return entry;
  });

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={config.height}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={mergedData}>
          <PolarGrid strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#666", fontSize: config.fontSize }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: "#999", fontSize: config.fontSize - 2 }}
          />
          {datasets.map((dataset) => (
            <Radar
              key={dataset.name}
              name={dataset.name}
              dataKey={dataset.name}
              stroke={dataset.color}
              fill={dataset.color}
              fillOpacity={0.3}
              strokeWidth={2}
            />
          ))}
          <Legend />
          <Tooltip
            formatter={(value: any, name: any) => [`${value}%`, name]}
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ScoreRadarChart;
