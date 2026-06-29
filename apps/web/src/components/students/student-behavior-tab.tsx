import { Star } from "lucide-react";
import { safeFormat } from "@/lib/date";
import { useStudentBehaviorStats } from "@/hooks/use-students";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StudentBehaviorTabProps {
  studentId: string;
}

export function StudentBehaviorTab({ studentId }: StudentBehaviorTabProps) {
  const { data: behaviorStats, isLoading } = useStudentBehaviorStats(studentId);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Behavior Summary</CardTitle>
          <CardDescription>
            Overview of student discipline and achievements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Current Points
                  </p>
                  <h3
                    className={`text-2xl font-bold ${behaviorStats?.currentPoints && behaviorStats.currentPoints > 50 ? "text-destructive" : "text-primary"}`}
                  >
                    {behaviorStats?.currentPoints || 0}
                  </h3>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Violations
                  </p>
                  <h3 className="text-2xl font-bold">
                    {behaviorStats?.totalViolations || 0}
                  </h3>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Rewards
                  </p>
                  <h3 className="text-2xl font-bold">
                    {behaviorStats?.totalRewards || 0}
                  </h3>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold">
                  Recent Violations
                </h4>
                {behaviorStats?.recentViolations?.length ? (
                  <div className="space-y-2">
                    {behaviorStats.recentViolations.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between rounded-lg border p-2"
                      >
                        <div>
                          <p className="text-sm font-medium">{v.type}</p>
                          <p className="text-xs text-muted-foreground">
                            {safeFormat(new Date(v.date), "dd MMM yyyy")}
                          </p>
                        </div>
                        <Badge variant="destructive">{v.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No recent violations.
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>Recent awards and positive behavior</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-4">
              {behaviorStats?.recentRewards?.length ? (
                <div className="space-y-2">
                  {behaviorStats.recentRewards.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-lg border p-2 bg-green-50 dark:bg-green-900/10"
                    >
                      <div>
                        <p className="text-sm font-medium">{r.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {safeFormat(new Date(r.date), "dd MMM yyyy")}
                        </p>
                      </div>
                      <Star className="h-4 w-4 text-yellow-500" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p>No recent achievements.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
