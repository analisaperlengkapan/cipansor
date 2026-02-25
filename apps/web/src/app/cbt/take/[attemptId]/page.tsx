"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useExamAttempt, useSubmitAnswer, useFinishExam } from "@/hooks/use-cbt";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function TakeExamPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;

  const { data: attempt, isLoading, error } = useExamAttempt(attemptId);
  const submitAnswerMutation = useSubmitAnswer();
  const finishExamMutation = useFinishExam();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // Local state for immediate UI feedback
  const [answers, setAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    if (attempt?.answers) {
      const initialAnswers: Record<string, any> = {};
      attempt.answers.forEach((ans) => {
        initialAnswers[ans.questionId] = ans.answer;
      });
      setAnswers(initialAnswers);
    }
  }, [attempt]);

  // Handle completed exam redirect
  useEffect(() => {
      if (attempt && attempt.status === 'COMPLETED') {
          router.replace(`/cbt/result/${attempt.id}`);
      }
  }, [attempt, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load exam. It might not exist or you don't have permission.
          </AlertDescription>
          <Button className="mt-4" onClick={() => router.push("/cbt/exams")}>
            Back to Exams
          </Button>
        </Alert>
      </div>
    );
  }

  const questions = attempt.exam.questionBank.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleAnswerSelect = async (value: string) => {
    // Optimistic update
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));

    try {
      await submitAnswerMutation.mutateAsync({
        attemptId,
        questionId: currentQuestion.id,
        answer: value,
      });
    } catch (error) {
      toast.error("Failed to save answer. Please check your connection.");
    }
  };

  const handleFinish = async () => {
    try {
      await finishExamMutation.mutateAsync(attemptId);
      toast.success("Exam submitted successfully!");
      router.push(`/cbt/result/${attemptId}`);
    } catch (error) {
      toast.error("Failed to submit exam.");
    }
  };

  // Timer Logic (Simplified)
  const durationMs = attempt.exam.duration * 60 * 1000;
  const startTime = new Date(attempt.startedAt).getTime();
  const endTime = startTime + durationMs;

  // You would typically use a useInterval or similar hook for the countdown
  // For brevity, skipping live countdown rendering but logic implies it.

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold">{attempt.exam.title}</h1>
          <p className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>
        <div>
            {/* Timer placeholder */}
            <span className="font-mono font-medium">Time Remaining</span>
        </div>
      </header>

      <div className="flex flex-1 container mx-auto py-6 gap-6">
        {/* Main Content: Question */}
        <main className="flex-1">
          <Card className="min-h-[400px] flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl">Question {currentQuestionIndex + 1}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="prose max-w-none mb-6">
                {currentQuestion.content}
              </div>

              {currentQuestion.type === "MULTIPLE_CHOICE" && currentQuestion.options && (
                <RadioGroup
                  value={answers[currentQuestion.id] || ""}
                  onValueChange={handleAnswerSelect}
                  className="space-y-3"
                >
                  {(currentQuestion.options as any[]).map((option: any) => (
                    <div
                      key={option.id || option.value} // Handling different option structures
                      className={cn(
                        "flex items-center space-x-2 border rounded-lg p-4 cursor-pointer transition-colors",
                        answers[currentQuestion.id] === (option.id || option.value)
                          ? "border-primary bg-primary/5"
                          : "hover:bg-gray-50"
                      )}
                    >
                      <RadioGroupItem value={option.id || option.value} id={option.id || option.value} />
                      <Label
                        htmlFor={option.id || option.value}
                        className="flex-1 cursor-pointer"
                      >
                        {option.text || option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {currentQuestion.type === "TRUE_FALSE" && (
                  <RadioGroup
                  value={answers[currentQuestion.id] || ""}
                  onValueChange={handleAnswerSelect}
                  className="space-y-3"
                >
                    <div className="flex items-center space-x-2 border rounded-lg p-4">
                        <RadioGroupItem value="true" id="opt-true" />
                        <Label htmlFor="opt-true">True</Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-4">
                        <RadioGroupItem value="false" id="opt-false" />
                        <Label htmlFor="opt-false">False</Label>
                    </div>
                </RadioGroup>
              )}

              {currentQuestion.type === "ESSAY" && (
                  <div className="text-muted-foreground italic">
                      Essay questions not fully supported in this demo.
                  </div>
              )}

            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>

              {isLastQuestion ? (
                <Button
                    onClick={handleFinish}
                    disabled={finishExamMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                >
                  {finishExamMutation.isPending ? "Submitting..." : "Finish Exam"}
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                >
                  Next
                </Button>
              )}
            </CardFooter>
          </Card>
        </main>

        {/* Sidebar: Navigation Grid */}
        <aside className="w-64 hidden lg:block">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Question Navigator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {questions.map((q, idx) => {
                  const isAnswered = !!answers[q.id];
                  const isCurrent = currentQuestionIndex === idx;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={cn(
                        "h-10 w-10 rounded-md text-sm font-medium transition-colors",
                        isCurrent
                          ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                          : isAnswered
                          ? "bg-blue-100 text-blue-700 border border-blue-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
