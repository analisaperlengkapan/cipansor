"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface RiskHeatmapProps {
  risks: any[];
  onClickCell?: (likelihood: number, impact: number) => void;
}

const likelihoodLabels = [
  { value: 5, label: "Almost Certain" },
  { value: 4, label: "Likely" },
  { value: 3, label: "Possible" },
  { value: 2, label: "Unlikely" },
  { value: 1, label: "Rare" },
];

const impactLabels = [
  { value: 1, label: "Insignificant" },
  { value: 2, label: "Minor" },
  { value: 3, label: "Moderate" },
  { value: 4, label: "Major" },
  { value: 5, label: "Catastrophic" },
];

const likelihoodMap: Record<string, number> = {
  RARE: 1,
  UNLIKELY: 2,
  POSSIBLE: 3,
  LIKELY: 4,
  ALMOST_CERTAIN: 5,
};

const impactMap: Record<string, number> = {
  INSIGNIFICANT: 1,
  MINOR: 2,
  MODERATE: 3,
  MAJOR: 4,
  CATASTROPHIC: 5,
};

function getCellColor(score: number) {
  if (score >= 20) return "bg-red-500 hover:bg-red-600 text-white";
  if (score >= 10) return "bg-orange-500 hover:bg-orange-600 text-white";
  if (score >= 5) return "bg-yellow-400 hover:bg-yellow-500 text-black";
  return "bg-green-500 hover:bg-green-600 text-white";
}

export function RiskHeatmap({ risks, onClickCell }: RiskHeatmapProps) {
  // Count risks per cell
  const counts: Record<string, number> = {};

  risks.forEach((risk) => {
    const l = likelihoodMap[risk.likelihood] || 0;
    const i = impactMap[risk.impact] || 0;
    if (l > 0 && i > 0) {
      const key = `${l}-${i}`;
      counts[key] = (counts[key] || 0) + 1;
    }
  });

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-lg border shadow-sm w-full max-w-3xl">
      <h3 className="text-lg font-semibold mb-4">Risk Heatmap</h3>

      <div className="flex w-full">
        {/* Y-Axis Labels (Likelihood) */}
        <div className="flex flex-col justify-between pr-4 py-8 h-[300px] text-sm font-medium text-muted-foreground w-24 text-right">
          {likelihoodLabels.map((l) => (
            <span key={l.value} className="flex-1 flex items-center justify-end">
              {l.label}
            </span>
          ))}
        </div>

        {/* Matrix */}
        <div className="grid grid-cols-5 gap-1 flex-1 h-[300px]">
          {likelihoodLabels.map((row) => (
            <React.Fragment key={row.value}>
              {impactLabels.map((col) => {
                const score = row.value * col.value;
                const count = counts[`${row.value}-${col.value}`] || 0;

                return (
                  <div
                    key={`${row.value}-${col.value}`}
                    className={cn(
                      "rounded flex items-center justify-center cursor-pointer transition-colors relative border",
                      getCellColor(score)
                    )}
                    onClick={() => onClickCell?.(row.value, col.value)}
                    title={`Likelihood: ${row.label}, Impact: ${col.label}, Score: ${score}`}
                  >
                    {count > 0 && (
                      <span className="font-bold text-lg">{count}</span>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* X-Axis Labels (Impact) */}
      <div className="flex w-full pl-24 pt-2">
        <div className="grid grid-cols-5 flex-1 text-center text-xs sm:text-sm font-medium text-muted-foreground">
          {impactLabels.map((l) => (
            <span key={l.value}>{l.label}</span>
          ))}
        </div>
      </div>

      <div className="mt-6 flex gap-4 text-xs">
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded"></div> Low (1-4)</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-400 rounded"></div> Medium (5-9)</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-500 rounded"></div> High (10-19)</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded"></div> Extreme (20-25)</div>
      </div>
    </div>
  );
}
