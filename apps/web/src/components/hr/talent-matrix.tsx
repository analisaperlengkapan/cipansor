"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TalentProfile {
  id: string;
  name: string;
  currentRole: string;
  performanceScore: number;
  potentialScore: number;
  category: string;
}

interface TalentMatrixProps {
  profiles: TalentProfile[];
}

const GRID_CELLS = [
  { id: 'HIGH_POTENTIAL', label: 'High Potential', performance: 'High', potential: 'High', color: 'bg-emerald-100 border-emerald-500' },
  { id: 'KEY_TALENT', label: 'Key Talent', performance: 'Moderate', potential: 'High', color: 'bg-blue-100 border-blue-500' },
  { id: 'EMERGING', label: 'Emerging', performance: 'Moderate', potential: 'Moderate', color: 'bg-slate-100 border-slate-400' },
  { id: 'SOLID_PERFORMER', label: 'Solid Performer', performance: 'High', potential: 'Low', color: 'bg-emerald-50 border-emerald-300' },
  { id: 'NEEDS_DEVELOPMENT', label: 'Needs Development', performance: 'Low', potential: 'Low', color: 'bg-red-100 border-red-500' },
];

export function TalentMatrix({ profiles }: TalentMatrixProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Talent categories mapped from backend's 5-value TalentCategory enum */}
        {GRID_CELLS.map((cell) => {
          const cellProfiles = profiles
            .filter(p => p.category === cell.id)
            .sort((a, b) => (b.performanceScore + b.potentialScore) - (a.performanceScore + a.potentialScore));

          return (
            <Card key={cell.id} className={`p-4 border-2 min-h-[150px] ${cell.color}`}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">{cell.label}</span>
                <Badge variant="outline">{cellProfiles.length}</Badge>
              </div>
              <div className="flex flex-wrap gap-1">
                <TooltipProvider>
                  {cellProfiles.map((profile) => (
                    <Tooltip key={profile.id}>
                      <TooltipTrigger asChild>
                        <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center text-[10px] font-bold cursor-help shadow-sm">
                          {(profile.name || '?').split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <p className="font-bold">{profile.name}</p>
                          <p>{profile.currentRole}</p>
                          <p className="mt-1 border-t pt-1">Perf: {profile.performanceScore} | Pot: {profile.potentialScore}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="text-center text-xs font-medium text-muted-foreground px-2">
        <span>Ordered by performance + potential score (highest → lowest)</span>
      </div>
    </div>
  );
}
