'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useQuestionBanks, useDeleteQuestionBank } from '@/hooks/use-cbt';
import { Plus, Search, Eye, Trash2, Loader2, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
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

export default function QuestionBanksPage() {
  const [search, setSearch] = useState('');
  const { data: response, isLoading } = useQuestionBanks({ search });
  const deleteBank = useDeleteQuestionBank();

  const banks = response?.data || [];

  const handleDelete = async (id: string) => {
    try {
      await deleteBank.mutateAsync(id);
      toast.success('Bank soal berhasil dihapus');
    } catch (error) {
      toast.error('Gagal menghapus bank soal');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bank Soal</h1>
            <p className="text-muted-foreground">
              Kelola kumpulan soal untuk ujian CBT (Computer Based Test)
            </p>
          </div>
          <Button asChild>
            <Link href="/cbt/banks/new">
              <Plus className="mr-2 h-4 w-4" />
              Buat Bank Soal
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Daftar Bank Soal</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari bank soal..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Mata Pelajaran</TableHead>
                  <TableHead>Guru</TableHead>
                  <TableHead>Jumlah Soal</TableHead>
                  <TableHead>Terakhir Update</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : banks.length > 0 ? (
                  banks.map((bank: any) => (
                    <TableRow key={bank.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{bank.title}</span>
                          {bank.description && (
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {bank.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {bank.subject ? (
                          <Badge variant="outline">{bank.subject.name}</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{bank.teacherRel?.user?.name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {bank._count?.questions || 0} Soal
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(bank.updatedAt), 'd MMM yyyy HH:mm', { locale: id })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/cbt/banks/${bank.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Bank Soal?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tindakan ini tidak dapat dibatalkan. Bank soal dan seluruh pertanyaan di dalamnya akan dihapus.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(bank.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <BookOpen className="h-8 w-8 text-muted-foreground/50" />
                        <p>Belum ada bank soal</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
