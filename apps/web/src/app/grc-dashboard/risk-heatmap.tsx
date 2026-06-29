import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RiskHeatmapProps {
  risks: any[];
}

export const RiskHeatmap = ({ risks }: RiskHeatmapProps) => {
  // Matrix 5x5: Impact (1-5) x Likelihood (1-5)
  const matrix = Array(5).fill(0).map(() => Array(5).fill(0).map(() => [] as any[]));

  risks.forEach(risk => {
    const l = risk.likelihoodWeight - 1;
    const i = risk.impactWeight - 1;
    if (l >= 0 && l < 5 && i >= 0 && i < 5) {
      matrix[4 - i][l].push(risk); // Row 0 is Impact 5, Col 0 is Likelihood 1
    }
  });

  const getCellColor = (row: number, col: number) => {
    const impact = 5 - row;
    const likelihood = col + 1;
    const score = impact * likelihood;

    if (score >= 20) return 'bg-red-500';
    if (score >= 10) return 'bg-orange-400';
    if (score >= 5) return 'bg-yellow-300';
    return 'bg-green-300';
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">Risk Heatmap (5x5)</CardTitle>
        <CardDescription>Visualisasi sebaran risiko berdasarkan Dampak & Kemungkinan</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-6 gap-1">
          {/* Y-Axis Label */}
          <div className="col-span-1 flex flex-col justify-between py-2 text-[10px] font-bold text-slate-500">
            <span>Sangat Berat</span>
            <span>Besar</span>
            <span>Sedang</span>
            <span>Kecil</span>
            <span>Rendah</span>
          </div>

          {/* Matrix */}
          <div className="col-span-5 grid grid-cols-5 gap-1">
            {matrix.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <TooltipProvider key={`${rowIndex}-${colIndex}`}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`h-12 border border-white/20 flex items-center justify-center transition-all hover:opacity-80 cursor-default ${getCellColor(rowIndex, colIndex)}`}
                      >
                        {cell.length > 0 && (
                          <Badge variant="secondary" className="bg-white/50 text-black border-none h-6 w-6 flex items-center justify-center p-0 rounded-full font-bold">
                            {cell.length}
                          </Badge>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <p className="font-bold">Score: {(5 - rowIndex) * (colIndex + 1)}</p>
                        <p className="text-xs">{cell.length} Risiko Terdeteksi</p>
                        {cell.slice(0, 3).map((r, i) => (
                          <p key={i} className="text-[10px]">• {r.code}: {r.description}</p>
                        ))}
                        {cell.length > 3 && <p className="text-[10px]">...dan {cell.length - 3} lainnya</p>}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))
            )}
          </div>

          {/* Spacer */}
          <div className="col-span-1"></div>

          {/* X-Axis Label */}
          <div className="col-span-5 grid grid-cols-5 text-[10px] font-bold text-slate-500 text-center mt-1">
            <span>Sangat Jarang</span>
            <span>Jarang</span>
            <span>Mungkin</span>
            <span>Sering</span>
            <span>Pasti</span>
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-4 text-xs">
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-300 rounded" /> Low</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-300 rounded" /> Medium</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-400 rounded" /> High</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded" /> Extreme</div>
        </div>
      </CardContent>
    </Card>
  );
};
