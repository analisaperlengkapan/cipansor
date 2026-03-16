"use client";

import { use, useState } from "react";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAttemptGrading, useGradeAnswer } from "@/hooks/use-cbt";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

export default function AttemptGradingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: attempt, isLoading, refetch } = useAttemptGrading(id);
  const gradeAnswer = useGradeAnswer();

  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!attempt) {
    return (
      <MainLayout>
        <p>Data percobaan ujian tidak ditemukan</p>
      </MainLayout>
    );
  }

  const handleGrade = async (
    questionId: string,
    score: number,
    isCorrect: boolean
  ) => {
    try {
      setLoadingIds((prev) => ({ ...prev, [questionId]: true }));
      await gradeAnswer.mutateAsync({
        attemptId: attempt.id,
        questionId,
        score,
        isCorrect,
      });
      toast.success("Nilai berhasil disimpan");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan nilai");
    } finally {
      setLoadingIds((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const questions = attempt.exam.questionBank?.questions || [];
  const answers = attempt.answers || [];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Penilaian Manual (Essay)
            </h1>
            <p className="text-muted-foreground">
              Siswa: {attempt.student?.user?.name || "Unknown"} | Total Skor
              Saat Ini: {attempt.score ? parseFloat(attempt.score).toFixed(2) : 0}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/cbt/exams/${attempt.examId}/monitoring`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
            </Link>
          </Button>
        </div>

        <div className="space-y-4">
          {questions.map((question: any, idx: number) => {
            const answerData = answers.find(
              (a: any) => a.questionId === question.id
            );

            // Filter out non-essay if desired, but we can allow override for all.
            const isEssay = question.type === "ESSAY";

            return (
              <Card key={question.id}>
                <CardHeader className="bg-muted/50 py-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-semibold">
                      Pertanyaan {idx + 1}
                    </CardTitle>
                    <div className="flex gap-2 items-center">
                      <Badge variant="outline">{question.type}</Badge>
                      <Badge>Maks: {question.points} Poin</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div
                    className="prose prose-sm max-w-none mb-4"
                    dangerouslySetInnerHTML={{ __html: question.content }}
                  />

                  <div className="bg-muted/30 p-4 rounded-md border">
                    <p className="text-sm font-semibold mb-2">Jawaban Siswa:</p>
                    <p className="text-sm">
                      {answerData?.answer
                        ? String(answerData.answer)
                        : "Tidak dijawab"}
                    </p>
                  </div>

                  {isEssay && (
                    <div className="bg-primary/5 p-4 rounded-md border border-primary/20">
                      <h4 className="font-semibold text-sm mb-4">
                        Area Penilaian Guru
                      </h4>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const score = Number(formData.get("score"));
                          const isCorrect = formData.get("isCorrect") === "on";
                          handleGrade(question.id, score, isCorrect);
                        }}
                        className="flex flex-col md:flex-row items-end gap-4"
                      >
                        <div className="space-y-2 flex-1">
                          <label className="text-sm font-medium">Nilai / Poin</label>
                          <Input
                            type="number"
                            name="score"
                            defaultValue={
                              answerData?.score
                                ? parseFloat(answerData.score)
                                : 0
                            }
                            max={question.points}
                            min={0}
                            step={0.1}
                            required
                          />
                        </div>
                        <div className="flex items-center space-x-2 flex-1 pb-3">
                          <Checkbox
                            id={`correct-${question.id}`}
                            name="isCorrect"
                            defaultChecked={answerData?.isCorrect === true}
                          />
                          <label
                            htmlFor={`correct-${question.id}`}
                            className="text-sm font-medium leading-none"
                          >
                            Tandai Benar
                          </label>
                        </div>
                        <Button
                          type="submit"
                          disabled={loadingIds[question.id]}
                        >
                          {loadingIds[question.id] && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Simpan Nilai
                        </Button>
                      </form>
                    </div>
                  )}

                  {!isEssay && (
                    <p className="text-sm text-muted-foreground italic">
                      Jawaban {question.type} dinilai otomatis oleh sistem.{" "}
                      Skor saat ini:{" "}
                      {answerData?.score ? parseFloat(answerData.score) : 0}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
