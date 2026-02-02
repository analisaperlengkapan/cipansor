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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLogInteraction } from "@/hooks/use-marketing";
import { toast } from "sonner";

const schema = z.object({
  type: z.string().min(1, "Tipe interaksi wajib diisi"),
  date: z.string().min(1, "Tanggal wajib diisi"),
  notes: z.string().optional(),
  nextActionDate: z.string().optional(),
});

interface LogInteractionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId?: string;
  registrantId?: string;
}

const INTERACTION_TYPES = [
  "CALL",
  "WA",
  "VISIT",
  "EMAIL",
  "MEETING",
  "OTHER",
];

export function LogInteractionDialog({
  open,
  onOpenChange,
  leadId,
  registrantId,
}: LogInteractionDialogProps) {
  const mutation = useLogInteraction();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "WA",
      date: new Date().toISOString().split("T")[0],
      notes: "",
      nextActionDate: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      await mutation.mutateAsync({
        leadId,
        registrantId,
        type: values.type,
        date: new Date(values.date).toISOString(),
        notes: values.notes,
        nextActionDate: values.nextActionDate
          ? new Date(values.nextActionDate).toISOString()
          : null,
      });
      toast.success("Interaksi berhasil dicatat");
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error("Gagal mencatat interaksi");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Catat Interaksi</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipe</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tipe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INTERACTION_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
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
                  <FormLabel>Tanggal Tindak Lanjut (Opsional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                Simpan
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
