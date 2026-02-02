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
import { useCreateLead, useUpdateLead, Lead } from "@/hooks/use-leads";
import { useCampaigns } from "@/hooks/use-marketing";
import { useEffect } from "react";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(2, "Nama wajib diisi"),
  phone: z.string().min(8, "Nomor HP wajib diisi"),
  email: z.string().email().optional().or(z.literal('')),
  source: z.string().optional(),
  interest: z.string().optional(),
  campaignId: z.string().optional(),
  notes: z.string().optional(),
});

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
}

const SOURCES = [
  "WEBSITE",
  "WA",
  "FACEBOOK",
  "INSTAGRAM",
  "REFERRAL",
  "EVENT",
  "WALK_IN",
  "OTHER",
];

const INTERESTS = [
  "TK_QURAN",
  "SD_IT",
  "SMP_IT",
  "SMA_QURAN",
  "PESANTREN",
];

export function LeadFormDialog({
  open,
  onOpenChange,
  lead,
}: LeadFormDialogProps) {
  const createMutation = useCreateLead();
  const updateMutation = useUpdateLead();
  const { data: campaigns } = useCampaigns();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      source: "",
      interest: "",
      campaignId: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (lead) {
      form.reset({
        name: lead.name,
        phone: lead.phone,
        email: lead.email || "",
        source: lead.source || "",
        interest: lead.interest || "",
        campaignId: lead.campaignId || "",
        notes: lead.notes || "",
      });
    } else {
      form.reset({
        name: "",
        phone: "",
        email: "",
        source: "",
        interest: "",
        campaignId: "",
        notes: "",
      });
    }
  }, [lead, form]);

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      const payload = {
        ...values,
        campaignId: values.campaignId || undefined,
      };

      if (lead) {
        await updateMutation.mutateAsync({ id: lead.id, data: payload });
        toast.success("Lead berhasil diperbarui");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Lead berhasil dibuat");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error("Gagal menyimpan lead");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {lead ? "Edit Lead" : "Tambah Lead Baru"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Contoh: Ahmad Fulan" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor HP (WhatsApp)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="08..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Opsional)</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sumber</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih sumber" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SOURCES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
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
                name="interest"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minat Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INTERESTS.map((i) => (
                          <SelectItem key={i} value={i}>
                            {i}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="campaignId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kampanye</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kampanye (Opsional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {campaigns?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
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
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Simpan
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
