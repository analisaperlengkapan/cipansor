"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";

interface Question {
  id: string;
  type: string;
  content: string;
  points: number;
}

interface Answer {
  id: string;
  questionId: string;
  answer: string;
  score: number;
}

export default function GradeExamPage() {
  const { attemptId } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState<{ answerId: string; score: number }[]>([]);

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        const res = await api.get(`/cbt/teacher/attempts/${attemptId}`);
        setAttempt(res.data.data);

        // Initialize grades with existing scores if any
        if (res.data.data?.answers) {
          const initialGrades = res.data.data.answers.map((a: Answer) => ({ answerId: a.id, score: a.score || 0 }));
          setGrades(initialGrades);
        }
      } catch (err: any) {
        toast({ title: "Error", description: "Failed to load attempt", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    if (attemptId) fetchAttempt();
  }, [attemptId, toast]);

  const handleGradeChange = (answerId: string, score: number) => {
    setGrades(prev => {
      const existing = prev.find(g => g.answerId === answerId);
      if (existing) {
        return prev.map(g => g.answerId === answerId ? { ...g, score } : g);
      }
      return [...prev, { answerId, score }];
    });
  };

  const submitGrades = async () => {
    try {
      await api.post(`/cbt/attempts/${attemptId}/grade`, { grades });
      toast({ title: "Success", description: "Grades submitted successfully" });
      router.push("/cbt/exams");
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to submit grades", variant: "destructive" });
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!attempt) return <div className="p-8">Attempt not found</div>;

  const essayQuestions = attempt.exam.questionBank.questions.filter((q: Question) => q.type === "ESSAY");

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Grade Exam</h1>
        <Button variant="outline" onClick={() => router.back()}>Back</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{attempt.exam.title}</CardTitle>
          <p className="text-sm text-muted-foreground">Student ID: {attempt.studentId}</p>
        </CardHeader>
        <CardContent className="space-y-8">
          {essayQuestions.length === 0 ? (
            <p>No essay questions to grade.</p>
          ) : (
            essayQuestions.map((q: Question) => {
              const answer = attempt.answers.find((a: Answer) => a.questionId === q.id);
              const currentGrade = grades.find(g => g.answerId === answer?.id)?.score ?? 0;

              return (
                <div key={q.id} className="p-4 border rounded-md space-y-4">
                  <div>
                    <span className="font-medium">Question ({q.points} pts):</span>
                    <p className="mt-1">{q.content}</p>
                  </div>
                  <div className="bg-muted p-4 rounded-md">
                    <span className="font-medium text-sm text-muted-foreground">Student's Answer:</span>
                    <p className="mt-1 whitespace-pre-wrap">{answer?.answer || <span className="italic">No answer provided</span>}</p>
                  </div>
                  {answer && (
                    <div className="flex items-center space-x-4">
                      <Label htmlFor={`score-${answer.id}`}>Score:</Label>
                      <Input
                        id={`score-${answer.id}`}
                        type="number"
                        min={0}
                        max={q.points}
                        className="w-24"
                        value={currentGrade}
                        onChange={(e) => handleGradeChange(answer.id, Number(e.target.value))}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={submitGrades} disabled={essayQuestions.length === 0}>
            Submit Grades
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
