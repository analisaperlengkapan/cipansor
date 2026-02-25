"use client";

import { MainLayout } from "@/components/layout";
import { PageHeader } from "@/components/shared";
import { useStudentExams, useStartExam } from "@/hooks/use-cbt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ClockIcon } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function StudentExamsPage() {
  const { data: exams, isLoading } = useStudentExams();
  const startExamMutation = useStartExam();
  const router = useRouter();

  const handleStartExam = async (examId: string) => {
    try {
      const attempt = await startExamMutation.mutateAsync(examId);
      router.push(`/cbt/take/${attempt.id}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to start exam");
    }
  };

  const handleContinue = (examId: string, attemptStatus: string) => {
      // For now we assume if status is present, we might need to fetch the active attempt ID.
      // But getStudentExams listing typically doesn't return attemptId directly in my current service implementation (it returns status).
      // If I want to "Continue", I actually need the attempt ID.
      // My service returns `attemptStatus` but not `attemptId` in `getStudentExams`.
      // The `startExam` endpoint in backend checks for existing attempt and returns it.
      // So calling `handleStartExam` acts as "Continue" effectively.
      handleStartExam(examId);
  };

  return (
    <MainLayout allowedRoles={["STUDENT"]}>
      <div className="space-y-6">
        <PageHeader
          title="My Exams"
          description="List of scheduled and active exams."
        />

        {isLoading ? (
          <div>Loading exams...</div>
        ) : exams && exams.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => (
              <Card key={exam.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{exam.title}</CardTitle>
                    {exam.attemptStatus && (
                        <Badge variant={exam.attemptStatus === 'COMPLETED' ? 'default' : 'secondary'}>
                            {exam.attemptStatus}
                        </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{exam.subject?.name}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(new Date(exam.scheduledAt), "PPP p")}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <ClockIcon className="mr-2 h-4 w-4" />
                    {exam.duration} minutes
                  </div>
                  {exam.score !== null && (
                      <div className="font-semibold text-lg">
                          Score: {exam.score}
                      </div>
                  )}
                </CardContent>
                <CardFooter>
                  {!exam.attemptStatus && (
                    <Button className="w-full" onClick={() => handleStartExam(exam.id)}>Start Exam</Button>
                  )}
                  {exam.attemptStatus === 'IN_PROGRESS' && (
                    <Button className="w-full" variant="secondary" onClick={() => handleContinue(exam.id, exam.attemptStatus!)}>
                        Continue
                    </Button>
                  )}
                  {exam.attemptStatus === 'COMPLETED' && (
                      <Button className="w-full" variant="outline" disabled>Completed</Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-10">
            No exams scheduled for you at the moment.
          </div>
        )}
      </div>
    </MainLayout>
  );
}
