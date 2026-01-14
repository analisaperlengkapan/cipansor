import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useCreateEvidence } from '@/hooks/use-quality';
import { useState } from 'react';
import { Upload } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useActiveAcademicYear } from '@/hooks/use-academic-years';

const formSchema = z.object({
  name: z.string().min(3, 'Nama dokumen wajib diisi'),
  description: z.string().optional(),
  fileUrl: z.string().url('File wajib diunggah'),
});

interface EvidenceUploadDialogProps {
  unitId: string;
  indicatorId: string;
  trigger?: React.ReactNode;
}

export function EvidenceUploadDialog({ unitId, indicatorId, trigger }: EvidenceUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const createEvidence = useCreateEvidence();
  const { activeAcademicYear } = useActiveAcademicYear();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      fileUrl: '', // In a real app, integrate with a file uploader component
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!activeAcademicYear) {
      return; // Should show error toast
    }

    try {
      await createEvidence.mutateAsync({
        ...values,
        unitId,
        indicatorId,
        academicYearId: activeAcademicYear.id,
      });
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Unggah Bukti
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unggah Bukti Fisik</DialogTitle>
          <DialogDescription>
            Unggah dokumen sebagai bukti pemenuhan indikator.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Dokumen</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: RPP Semester 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keterangan (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Keterangan tambahan..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fileUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link File</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={createEvidence.isPending}>
                {createEvidence.isPending ? 'Mengunggah...' : 'Simpan'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
