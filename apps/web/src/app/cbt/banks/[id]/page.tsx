'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  useQuestionBank,
  useAddQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
  Question,
  QuestionType,
} from '@/hooks/use-cbt';
import { QuestionForm } from '@/components/cbt/question-form';
import { ArrowLeft, Plus, Pencil, Trash2, GripVertical, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function BankDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: bank, isLoading } = useQuestionBank(params.id);
  const addQuestion = useAddQuestion();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();

  const [isAdding, setIsAdding] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <p>Memuat...</p>
        </div>
      </MainLayout>
    );
  }

  if (!bank) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <AlertTriangle className="h-12 w-12 text-yellow-500" />
          <h2 className="text-xl font-semibold">Bank Soal Tidak Ditemukan</h2>
          <Button onClick={() => router.push('/cbt/banks')}>Kembali</Button>
        </div>
      </MainLayout>
    );
  }

  const handleAdd = async (data: any) => {
    try {
      await addQuestion.mutateAsync({
        bankId: bank.id,
        data: { ...data, order: (bank.questions?.length || 0) + 1 },
      });
      setIsAdding(false);
      toast.success('Soal berhasil ditambahkan');
    } catch (error) {
      toast.error('Gagal menambahkan soal');
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingQuestion) return;
    try {
      await updateQuestion.mutateAsync({
        bankId: bank.id,
        questionId: editingQuestion.id,
        data,
      });
      setEditingQuestion(null);
      toast.success('Soal berhasil diperbarui');
    } catch (error) {
      toast.error('Gagal memperbarui soal');
    }
  };

  const handleDelete = async (questionId: string) => {
    try {
      await deleteQuestion.mutateAsync({
        bankId: bank.id,
        questionId,
      });
      toast.success('Soal berhasil dihapus');
    } catch (error) {
      toast.error('Gagal menghapus soal');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/cbt/banks')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{bank.title}</h1>
              {bank.subject && <Badge variant="outline">{bank.subject.name}</Badge>}
            </div>
            <p className="text-muted-foreground">{bank.description || 'Tidak ada deskripsi'}</p>
          </div>
          {!isAdding && !editingQuestion && (
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Soal
            </Button>
          )}
        </div>

        {/* Editor Mode */}
        {(isAdding || editingQuestion) && (
          <Card className="border-primary/50 shadow-md">
            <CardHeader>
              <CardTitle>
                {isAdding ? 'Tambah Soal Baru' : 'Edit Soal'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <QuestionForm
                initialData={editingQuestion || undefined}
                onSubmit={isAdding ? handleAdd : handleUpdate}
                onCancel={() => {
                  setIsAdding(false);
                  setEditingQuestion(null);
                }}
                isLoading={addQuestion.isPending || updateQuestion.isPending}
              />
            </CardContent>
          </Card>
        )}

        {/* Questions List */}
        {!isAdding && !editingQuestion && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Total: {bank.questions?.length || 0} Soal</span>
            </div>

            {bank.questions && bank.questions.length > 0 ? (
              <Accordion type="multiple" className="space-y-4">
                {bank.questions.map((question: Question, index: number) => (
                  <Card key={question.id} className="relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-muted-foreground/20" />
                    <AccordionItem value={question.id} className="border-0">
                      <div className="flex items-start p-4 gap-4">
                        <div className="flex flex-col items-center gap-2 pt-1">
                          <Badge variant="secondary" className="w-8 h-8 flex items-center justify-center rounded-full">
                            {index + 1}
                          </Badge>
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              <Badge variant={question.type === QuestionType.MULTIPLE_CHOICE ? 'default' : 'secondary'}>
                                {question.type === QuestionType.MULTIPLE_CHOICE ? 'PG' :
                                 question.type === QuestionType.ESSAY ? 'Esai' : 'B/S'}
                              </Badge>
                              <span className="text-sm text-muted-foreground font-medium">
                                {question.points} Poin
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingQuestion(question)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Hapus Soal?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Soal ini akan dihapus permanen dari bank soal.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(question.id)}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      Hapus
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>

                          <div className="prose prose-sm max-w-none">
                            <p className="whitespace-pre-wrap">{question.content}</p>
                          </div>

                          <AccordionTrigger className="py-2 hover:no-underline text-xs text-muted-foreground">
                            Lihat Detail & Jawaban
                          </AccordionTrigger>
                        </div>
                      </div>

                      <AccordionContent className="px-4 pb-4 pl-16">
                        <div className="space-y-4 pt-2 border-t">
                          {/* Options / Answer */}
                          {question.type === QuestionType.MULTIPLE_CHOICE && question.options && (
                            <div className="space-y-2">
                              <p className="text-sm font-semibold">Pilihan Jawaban:</p>
                              <div className="grid gap-2">
                                {question.options.map((opt: any) => (
                                  <div
                                    key={opt.id}
                                    className={`p-3 rounded-md border text-sm flex items-center gap-2 ${
                                      question.answerKey === opt.id
                                        ? 'bg-green-50 border-green-200 text-green-700'
                                        : 'bg-muted/20'
                                    }`}
                                  >
                                    <span className="font-mono text-xs">{opt.id.split('-').pop()}</span>
                                    <span>{opt.text}</span>
                                    {question.answerKey === opt.id && (
                                      <Badge className="ml-auto bg-green-500 hover:bg-green-600">Kunci</Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {question.type === QuestionType.TRUE_FALSE && (
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-semibold">Kunci Jawaban:</span>
                              <Badge variant={question.answerKey === 'true' ? 'success' : 'destructive'}>
                                {question.answerKey === 'true' ? 'BENAR' : 'SALAH'}
                              </Badge>
                            </div>
                          )}

                          {question.explanation && (
                            <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
                              <span className="font-semibold block mb-1">Pembahasan:</span>
                              {question.explanation}
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Card>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground mb-4">Belum ada soal di bank ini</p>
                <Button onClick={() => setIsAdding(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Mulai Tambah Soal
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
