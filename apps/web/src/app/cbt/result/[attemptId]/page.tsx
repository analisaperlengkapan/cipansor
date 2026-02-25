"use client";

import { useParams, useRouter } from "next/navigation";
import { useExamAttempt } from "@/hooks/use-cbt";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ExamResultPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;

  const { data: attempt, isLoading, error } = useExamAttempt(attemptId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <MainLayout allowedRoles={["STUDENT"]}>
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Could not load exam result.</AlertDescription>
        </Alert>
      </MainLayout>
    );
  }

  if (attempt.status !== "COMPLETED") {
    // If not completed, redirect back to exam
    router.replace(`/cbt/take/${attemptId}`);
    return null;
  }

  const score = attempt.score || 0;
  const maxScore = attempt.exam.maxScore || 100; // Fallback
  const percentage = (score / maxScore) * 100;

  let grade = "F";
  if (percentage >= 90) grade = "A";
  else if (percentage >= 80) grade = "B";
  else if (percentage >= 70) grade = "C";
  else if (percentage >= 60) grade = "D";

  return (
    <MainLayout allowedRoles={["STUDENT"]}>
      <div className="container mx-auto py-10 max-w-2xl">
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-3xl">Exam Completed!</CardTitle>
            <p className="text-muted-foreground mt-2">
              You have successfully submitted <strong>{attempt.exam.title}</strong>.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-2xl font-bold">{score} <span className="text-sm font-normal text-muted-foreground">/ {maxScore}</span></p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Grade</p>
                <p className={`text-2xl font-bold ${grade === 'A' ? 'text-green-600' : grade === 'F' ? 'text-red-600' : ''}`}>
                  {grade}
                </p>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
                <p>Submitted at: {new Date(attempt.finishedAt!).toLocaleString()}</p>
            </div>
          </CardContent>
          <CardFooter className="justify-center">
            <Button onClick={() => router.push("/cbt/exams")}>
              Back to Exams List
            </Button>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
}
