"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateAudit } from "@/hooks/use-quality";
import { Textarea } from "@/components/ui/textarea";

const createAuditSchema = z.object({
  code: z.string().min(1, "Kode wajib diisi"),
  name: z.string().min(3, "Nama audit minimal 3 karakter"),
  startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
  endDate: z.string().min(1, "Tanggal selesai wajib diisi"),
  notes: z.string().optional(),
});

interface CreateAuditDialogProps {
  unitId: string;
  academicYearId: string;
}

export function CreateAuditDialog({
  unitId,
  academicYearId,
}: CreateAuditDialogProps) {
  const [open, setOpen] = useState(false);
  const createAudit = useCreateAudit();

  const form = useForm<z.infer<typeof createAuditSchema>>({
    resolver: zodResolver(createAuditSchema),
    defaultValues: {
      code: "",
      name: "",
      startDate: "",
      endDate: "",
      notes: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof createAuditSchema>) => {
    await createAudit.mutateAsync({
      unitId,
      academicYearId,
      ...values,
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate).toISOString(),
    });
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Buat Audit Baru</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Buat Jadwal Audit Mutu Internal</DialogTitle>
          <DialogDescription>
            Audit baru akan dibuat dan indikator penilaian akan otomatis
            disalin.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kode Audit</FormLabel>
                    <FormControl>
                      <Input placeholder="AMI-2024-01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Kegiatan</FormLabel>
                    <FormControl>
                      <Input placeholder="Audit Semester Ganjil" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Mulai</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Selesai</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Catatan tambahan untuk auditor..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => setOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={createAudit.isPending}>
                {createAudit.isPending ? "Menyimpan..." : "Simpan Jadwal"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
