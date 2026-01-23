"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useLogInteraction } from "@/hooks/use-marketing";
import { toast } from "sonner";

const schema = z.object({
  type: z.string().min(1),
  date: z.string().min(1),
  notes: z.string().optional(),
  nextActionDate: z.string().optional(),
});

export function LogInteractionDialog({
  open,
  onOpenChange,
  registrantId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  registrantId: string;
}) {
  const mutation = useLogInteraction();
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "CALL",
      date: new Date().toISOString().split("T")[0],
      notes: "",
      nextActionDate: "",
    },
  });

  const onSubmit = async (values: any) => {
    try {
      await mutation.mutateAsync({
        registrantId,
        type: values.type,
        date: new Date(values.date).toISOString(),
        notes: values.notes,
        nextActionDate: values.nextActionDate
          ? new Date(values.nextActionDate).toISOString()
          : undefined,
      });
      toast.success("Interaksi dicatat");
      form.reset();
      onOpenChange(false);
    } catch (e) {
      toast.error("Gagal mencatat interaksi");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Catat Interaksi Baru</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CALL">Telepon</SelectItem>
                        <SelectItem value="WA">WhatsApp</SelectItem>
                        <SelectItem value="VISIT">Kunjungan</SelectItem>
                        <SelectItem value="EMAIL">Email</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal</FormLabel>
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
                  <FormLabel>Catatan</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nextActionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jadwal Tindak Lanjut (Opsional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
            >
              Simpan
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
