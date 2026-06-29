"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, User as UserIcon, Star, Target } from "lucide-react";

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
  // Top Row (Potential: High)
  { id: 'HIGH_POTENTIAL_STAR', label: 'Star', performance: 'High', potential: 'High', color: 'bg-purple-100 border-purple-500', category: 'HIGH_POTENTIAL' },
  { id: 'HIGH_POTENTIAL_HIPO', label: 'High Potential', performance: 'Moderate', potential: 'High', color: 'bg-purple-50 border-purple-400', category: 'HIGH_POTENTIAL' },
  { id: 'EMERGING_ENIGMA', label: 'Enigma', performance: 'Low', potential: 'High', color: 'bg-blue-50 border-blue-300', category: 'EMERGING' },

  // Middle Row (Potential: Moderate)
  { id: 'KEY_TALENT_HIPRO', label: 'High Professional', performance: 'High', potential: 'Moderate', color: 'bg-green-100 border-green-500', category: 'KEY_TALENT' },
  { id: 'SOLID_PERFORMER_CORE', label: 'Core Employee', performance: 'Moderate', potential: 'Moderate', color: 'bg-slate-100 border-slate-400', category: 'SOLID_PERFORMER' },
  { id: 'EMERGING_DILEMMA', label: 'Dilemma', performance: 'Low', potential: 'Moderate', color: 'bg-orange-50 border-orange-300', category: 'EMERGING' },

  // Bottom Row (Potential: Low)
  { id: 'SOLID_PERFORMER_MASTER', label: 'Master', performance: 'High', potential: 'Low', color: 'bg-emerald-50 border-emerald-300', category: 'SOLID_PERFORMER' },
  { id: 'SOLID_PERFORMER_EFFECTIVE', label: 'Effective', performance: 'Moderate', potential: 'Low', color: 'bg-slate-50 border-slate-300', category: 'SOLID_PERFORMER' },
  { id: 'NEEDS_DEVELOPMENT_UNDER', label: 'Under Performer', performance: 'Low', potential: 'Low', color: 'bg-red-100 border-red-500', category: 'NEEDS_DEVELOPMENT' },
];

export function TalentMatrix({ profiles }: TalentMatrixProps) {
  const [selectedCategory, setSelectedCategory] = useState<typeof GRID_CELLS[0] | null>(null);

  const handleCellClick = (cellId: string) => {
    const cell = GRID_CELLS.find(c => c.id === cellId);
    if (cell) setSelectedCategory(cell);
  };

  const getFilteredProfiles = (cell: typeof GRID_CELLS[0]) => {
    return profiles
      .filter(p => {
        // Map 0-100 scores back to Low (1), Moderate (2), High (3) levels
        const getLevel = (score: number) => score >= 80 ? 'High' : score >= 50 ? 'Moderate' : 'Low';
        return p.category === cell.category &&
               getLevel(p.performanceScore) === cell.performance &&
               getLevel(p.potentialScore) === cell.potential;
      })
      .sort((a, b) => (b.performanceScore + b.potentialScore) - (a.performanceScore + a.potentialScore));
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-x-auto">
        <div className="min-w-[800px] grid grid-cols-4 grid-rows-4 gap-4 p-2">
          {/* Y-Axis Label */}
          <div className="row-span-3 flex flex-col justify-around items-center py-8">
            <span className="text-xs font-bold uppercase tracking-widest -rotate-90 whitespace-nowrap text-slate-400">Potential</span>
            <div className="flex flex-col gap-28 text-[10px] font-bold text-slate-400">
              <span>High</span>
              <span>Mod</span>
              <span>Low</span>
            </div>
          </div>

          {/* Grid Cells */}
          <div className="col-span-3 grid grid-cols-3 grid-rows-3 gap-4">
            {GRID_CELLS.map((cell) => {
              const cellProfiles = getFilteredProfiles(cell);

              return (
                <Card
                  key={cell.id}
                  className={`p-3 border-2 min-h-[120px] cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] flex flex-col ${cell.color}`}
                  onClick={() => handleCellClick(cell.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider leading-tight">{cell.label}</span>
                    <Badge variant="outline" className="bg-white/50 text-[10px] h-4 px-1">{cellProfiles.length}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-auto">
                    <TooltipProvider>
                      {cellProfiles.slice(0, 6).map((profile) => (
                        <Tooltip key={profile.id}>
                          <TooltipTrigger asChild>
                            <div className="w-6 h-6 rounded-full bg-white border flex items-center justify-center text-[8px] font-bold shadow-sm">
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
                      {cellProfiles.length > 6 && (
                        <div className="w-6 h-6 rounded-full bg-white/50 border flex items-center justify-center text-[8px] font-medium italic">
                          +{cellProfiles.length - 6}
                        </div>
                      )}
                    </TooltipProvider>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* X-Axis Label */}
          <div className="col-start-2 col-span-3 flex justify-around items-center pt-2">
            <div className="flex gap-40 text-[10px] font-bold text-slate-400">
              <span>Low</span>
              <span>Mod</span>
              <span>High</span>
            </div>
            <span className="absolute bottom-0 text-xs font-bold uppercase tracking-widest text-slate-400">Performance</span>
          </div>
        </div>
      </div>

      {/* Drill-down Dialog */}
      <Dialog open={!!selectedCategory} onOpenChange={(open) => !open && setSelectedCategory(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-primary" />
              <DialogTitle>{selectedCategory?.label} Pool</DialogTitle>
            </div>
            <DialogDescription>
              Performance: <span className="font-semibold">{selectedCategory?.performance}</span> |
              Potential: <span className="font-semibold text-primary">{selectedCategory?.potential}</span>
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] mt-4">
            <div className="grid gap-3 pr-4">
              {selectedCategory && getFilteredProfiles(selectedCategory).map((profile) => (
                <Card key={profile.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border flex items-center justify-center text-sm font-bold text-primary">
                      {(profile.name || '?').split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold leading-none">{profile.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{profile.currentRole}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-medium">Perf: {profile.performanceScore}</span>
                      </div>
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        <Target className="w-3 h-3 text-blue-500" />
                        <span className="text-xs font-medium">Pot: {profile.potentialScore}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] h-5">
                      Score: {profile.performanceScore + profile.potentialScore}
                    </Badge>
                  </div>
                </Card>
              ))}
              {selectedCategory && getFilteredProfiles(selectedCategory.id).length === 0 && (
                <div className="text-center py-8 text-muted-foreground italic text-sm">
                  No employees currently in this category.
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <div className="text-center text-xs font-medium text-muted-foreground px-2">
        <span>Ordered by performance + potential score (highest → lowest)</span>
      </div>
    </div>
  );
}
