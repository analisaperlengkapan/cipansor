"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HeatmapCell {
  x: string;
  y: string;
  value: number;
}

interface HeatmapChartProps {
  data: HeatmapCell[];
  xLabels: string[];
  yLabels: string[];
  title?: string;
  description?: string;
  colorScale?: "green" | "blue" | "red" | "purple";
  minValue?: number;
  maxValue?: number;
  valueFormatter?: (value: number) => string;
}

const COLOR_SCALES = {
  green: ["#dcfce7", "#86efac", "#4ade80", "#22c55e", "#16a34a", "#15803d"],
  blue: ["#dbeafe", "#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8"],
  red: ["#fee2e2", "#fca5a5", "#f87171", "#ef4444", "#dc2626", "#b91c1c"],
  purple: ["#f3e8ff", "#d8b4fe", "#c084fc", "#a855f7", "#9333ea", "#7e22ce"],
};

export function HeatmapChart({
  data,
  xLabels,
  yLabels,
  title,
  description,
  colorScale = "green",
  minValue,
  maxValue,
  valueFormatter = (v) => String(v),
}: HeatmapChartProps) {
  const { min, max, colors } = useMemo(() => {
    const values = data.map((d) => d.value);
    return {
      min: minValue ?? Math.min(...values),
      max: maxValue ?? Math.max(...values),
      colors: COLOR_SCALES[colorScale],
    };
  }, [data, minValue, maxValue, colorScale]);

  const getColor = (value: number) => {
    if (max === min) return colors[3];
    const normalized = (value - min) / (max - min);
    const index = Math.min(
      Math.floor(normalized * (colors.length - 1)),
      colors.length - 1,
    );
    return colors[index];
  };

  const getCellValue = (x: string, y: string) => {
    const cell = data.find((d) => d.x === x && d.y === y);
    return cell?.value ?? 0;
  };

  return (
    <Card>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <TooltipProvider>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* X-axis labels */}
              <div className="flex">
                <div className="w-24 shrink-0" />
                {xLabels.map((label) => (
                  <div
                    key={label}
                    className="flex-1 min-w-[60px] text-center text-xs font-medium text-muted-foreground truncate px-1"
                    title={label}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Grid */}
              {yLabels.map((yLabel) => (
                <div key={yLabel} className="flex items-center">
                  {/* Y-axis label */}
                  <div className="w-24 shrink-0 text-right pr-2 text-xs font-medium text-muted-foreground truncate">
                    {yLabel}
                  </div>
                  {/* Cells */}
                  {xLabels.map((xLabel) => {
                    const value = getCellValue(xLabel, yLabel);
                    return (
                      <Tooltip key={`${xLabel}-${yLabel}`}>
                        <TooltipTrigger asChild>
                          <div
                            className="flex-1 min-w-[60px] h-10 m-0.5 rounded-sm flex items-center justify-center text-xs font-medium cursor-pointer transition-transform hover:scale-105"
                            style={{
                              backgroundColor: getColor(value),
                              color:
                                value > (max - min) / 2 + min ? "#fff" : "#000",
                            }}
                          >
                            {valueFormatter(value)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">
                            {xLabel} × {yLabel}
                          </p>
                          <p className="text-sm">{valueFormatter(value)}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}

              {/* Legend */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="text-xs text-muted-foreground">Rendah</span>
                <div className="flex">
                  {colors.map((color, i) => (
                    <div
                      key={i}
                      className="w-6 h-4"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">Tinggi</span>
              </div>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}

// Demo data generator
export function generateDemoHeatmapData(
  xLabels: string[],
  yLabels: string[],
): HeatmapCell[] {
  const data: HeatmapCell[] = [];
  xLabels.forEach((x) => {
    yLabels.forEach((y) => {
      data.push({
        x,
        y,
        value: Math.floor(Math.random() * 100),
      });
    });
  });
  return data;
}
