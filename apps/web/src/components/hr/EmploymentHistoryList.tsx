"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Briefcase, ArrowRight } from "lucide-react";

interface EmploymentHistory {
  id: string;
  action: string;
  previousPosition: string | null;
  newPosition: string;
  previousDepartment: string | null;
  newDepartment: string | null;
  effectiveDate: string;
  notes: string | null;
}

interface EmploymentHistoryListProps {
  history: EmploymentHistory[];
}

export function EmploymentHistoryList({ history }: EmploymentHistoryListProps) {
  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Karir</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Belum ada riwayat karir.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat Karir</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="relative border-l border-muted ml-3 space-y-8">
          {history.map((item) => (
            <div key={item.id} className="relative pl-8">
              <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    {format(new Date(item.effectiveDate), "d MMMM yyyy")}
                  </span>
                  <Badge variant="outline">{item.action}</Badge>
                </div>
                <div className="font-semibold text-lg">{item.newPosition}</div>
                {item.newDepartment && (
                  <div className="text-sm text-muted-foreground">
                    {item.newDepartment}
                  </div>
                )}
                {item.previousPosition && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span>{item.previousPosition}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>{item.newPosition}</span>
                  </div>
                )}
                {item.notes && (
                  <p className="text-sm mt-2 bg-muted/50 p-2 rounded-md">
                    {item.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
