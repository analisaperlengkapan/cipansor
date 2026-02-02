'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

import {
  usePsychologyTests,
  useCreatePsychologyTest,
  useUpdatePsychologyTest,
  useDeletePsychologyTest,
  type PsychologyTest,
} from '@/hooks/use-psychology';

const testSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  type: z.string().min(1, 'Jenis wajib dipilih'),
  description: z.string().optional(),
});

type TestFormValues = z.infer<typeof testSchema>;

const TEST_TYPES = [
  { value: 'IQ', label: 'Intelegensi (IQ)' },
  { value: 'PERSONALITY', label: 'Kepribadian' },
  { value: 'APTITUDE', label: 'Minat & Bakat' },
  { value: 'EQ', label: 'Kecerdasan Emosional' },
  { value: 'OTHER', label: 'Lainnya' },
];

export default function PsychologyTestsPage() {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<PsychologyTest | null>(null);

  const { data: tests, isLoading } = usePsychologyTests();
  const createMutation = useCreatePsychologyTest();
  const updateMutation = useUpdatePsychologyTest();
  const deleteMutation = useDeletePsychologyTest();

  const form = useForm<TestFormValues>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      name: '',
      type: '',
      description: '',
    },
  });

  const filteredTests = tests?.filter((test) =>
    test.name.toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = async (data: TestFormValues) => {
    try {
      if (editingTest) {
        await updateMutation.mutateAsync({ id: editingTest.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (test: PsychologyTest) => {
    setEditingTest(test);
    form.reset({
      name: test.name,
      type: test.type,
      description: test.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus alat tes ini?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const resetForm = () => {
    setEditingTest(null);
    form.reset({
      name: '',
      type: '',
      description: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari alat tes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if(!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Alat Tes
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTest ? 'Edit Alat Tes' : 'Tambah Alat Tes Baru'}
              </DialogTitle>
              <DialogDescription>
                Kelola master data jenis tes psikologi yang tersedia.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Tes</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: IST, WISC, MBTI" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jenis</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih jenis tes" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TEST_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Penjelasan singkat tentang tes ini..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingTest ? 'Simpan Perubahan' : 'Buat Alat Tes'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Alat Tes Psikologi</CardTitle>
          <CardDescription>
            Kelola jenis-jenis tes yang dapat digunakan untuk asesmen siswa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredTests?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada data alat tes.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Tes</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="w-[100px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTests?.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">{test.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{test.type}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {test.description || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(test)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(test.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
