import Link from "next/link";
import { Heart, TrendingUp, TrendingDown } from "lucide-react";
import { useStudentIbadahStats, getCategoryInfo } from "@/hooks/use-ibadah";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface StudentIbadahTabProps {
  studentId: string;
}

export function StudentIbadahTab({ studentId }: StudentIbadahTabProps) {
  // Calculating start/end of current month for display context
  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString();
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).toISOString();

  const { data: ibadahStats, isLoading } = useStudentIbadahStats({
    studentId: studentId,
    startDate: startOfMonth,
    endDate: endOfMonth,
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Ibadah Summary</CardTitle>
          <CardDescription>
            Daily worship monitoring for this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Completion Rate
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-bold">
                      {ibadahStats?.summary?.completionRate || 0}%
                    </span>
                    {Number(ibadahStats?.summary?.completionRate || 0) >= 80 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Current Streak
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-bold">
                      {ibadahStats?.summary?.currentStreak || 0}
                    </span>
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Category Breakdown</h4>
                {ibadahStats?.byCategory?.map((cat) => {
                  const catInfo = getCategoryInfo(cat.category as any);
                  return (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span>{catInfo?.icon}</span>
                          {catInfo?.label}
                        </span>
                        <span className="text-muted-foreground">
                          {cat.completionRate}%
                        </span>
                      </div>
                      <Progress value={cat.completionRate} className="h-2" />
                    </div>
                  );
                })}
                {!ibadahStats?.byCategory?.length && (
                  <p className="text-sm text-muted-foreground">
                    No ibadah data recorded yet.
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest tracked activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
            <Heart className="h-10 w-10 mb-3 opacity-20" />
            <p>Detailed daily log view is available in the Mutabaah Module.</p>
            <Button variant="link" asChild className="mt-2">
              <Link href="/ibadah">Go to Mutabaah Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
