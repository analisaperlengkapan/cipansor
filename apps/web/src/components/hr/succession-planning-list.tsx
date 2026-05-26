"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Award, ShieldCheck, Zap } from "lucide-react";

interface SuccessionCandidate {
  talentProfileId: string;
  name: string;
  currentRole: string;
  category: string;
  readiness: string;
  matchScore: number;
  shariaMatch: boolean;
  competencyMatch: number | null;
}

interface SuccessionPlanningListProps {
  candidates: SuccessionCandidate[];
  positionTitle: string;
}

export function SuccessionPlanningList({ candidates, positionTitle }: SuccessionPlanningListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Kandidat Suksesi: {positionTitle}</h3>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          AI Suggestion Engine
        </Badge>
      </div>

      <div className="grid gap-4">
        {candidates.map((candidate) => (
          <Card key={candidate.talentProfileId} className="overflow-hidden hover:border-primary/50 transition-colors">
            <CardContent className="p-0">
              <div className="flex items-stretch">
                <div className="bg-slate-50 p-4 flex flex-col items-center justify-center border-r w-32">
                  <Avatar className="h-12 w-12 mb-2">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {candidate.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{candidate.matchScore}%</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold">Match Score</div>
                  </div>
                </div>

                <div className="flex-1 p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-base">{candidate.name}</h4>
                      <p className="text-sm text-muted-foreground">{candidate.currentRole}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={candidate.category === 'HIGH_POTENTIAL' ? 'default' : 'secondary'}>
                        {candidate.category.replace(/_/g, ' ')}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {candidate.readiness.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Competency Match</span>
                        <span className="font-medium">{candidate.competencyMatch ?? 0}%</span>
                      </div>
                      <Progress value={candidate.competencyMatch ?? 0} className="h-1.5" />
                    </div>

                    <div className="flex items-center gap-4">
                      {candidate.shariaMatch && (
                        <div className="flex items-center gap-1 text-emerald-600" title="Sertifikasi Syariah Terdeteksi">
                          <ShieldCheck className="h-4 w-4" />
                          <span className="text-[10px] font-bold">SYARIAH OK</span>
                        </div>
                      )}
                      {candidate.matchScore >= 85 && (
                        <div className="flex items-center gap-1 text-amber-600" title="Kandidat Prioritas Utama">
                          <Zap className="h-4 w-4 fill-amber-600" />
                          <span className="text-[10px] font-bold">TOP PICK</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {candidates.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Tidak ada kandidat potensial yang ditemukan untuk posisi ini.</p>
          </div>
        )}
      </div>
    </div>
  );
}
