"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { useConvertLead, Lead } from "@/hooks/use-leads";
import { useRegistrationPeriods } from "@/hooks/use-psb";
import { useEffect } from "react";
import { toast } from "sonner";

const schema = z.object({
  admissionPeriodId: z.string().min(1, "Periode penerimaan wajib dipilih"),
  fullName: z.string().min(2, "Nama lengkap wajib diisi"),
  gender: z.enum(["MALE", "FEMALE"], { required_error: "Jenis kelamin wajib dipilih" }),
  birthPlace: z.string().min(2, "Tempat lahir wajib diisi"),
  birthDate: z.string().min(1, "Tanggal lahir wajib diisi"),
  address: z.string().min(5, "Alamat wajib diisi"),
  fatherName: z.string().min(2, "Nama ayah wajib diisi"),
  motherName: z.string().min(2, "Nama ibu wajib diisi"),
  phone: z.string().optional(),
});

interface ConvertToRegistrantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
}

export function ConvertToRegistrantDialog({
  open,
  onOpenChange,
  lead,
}: ConvertToRegistrantDialogProps) {
  const mutation = useConvertLead();
  const { data: periods } = useRegistrationPeriods({ isActive: true });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      admissionPeriodId: "",
      fullName: lead.name,
      gender: undefined,
      birthPlace: "",
      birthDate: "",
      address: "",
      fatherName: "",
      motherName: "",
      phone: lead.phone,
    },
  });

  // Reset form when lead changes
  useEffect(() => {
    if (lead) {
      form.setValue("fullName", lead.name);
      form.setValue("phone", lead.phone);
    }
  }, [lead, form]);

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      await mutation.mutateAsync({
        id: lead.id,
        data: {
          ...values,
          birthDate: new Date(values.birthDate).toISOString(),
        },
      });
      toast.success("Lead berhasil dikonversi menjadi pendaftar");
      onOpenChange(false);
    } catch (error) {
      toast.error("Gagal mengkonversi lead");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Konversi ke Pendaftar</DialogTitle>
          <DialogDescription>
            Lengkapi data berikut untuk mendaftarkan calon santri ke sistem PSB.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="admissionPeriodId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Periode Penerimaan</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih periode" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {periods?.map((period) => (
                        <SelectItem key={period.id} value={period.id}>
                          {period.name} ({period.unit?.name || "-"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Kelamin</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis kelamin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MALE">Laki-laki</SelectItem>
                        <SelectItem value="FEMALE">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="birthPlace"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tempat Lahir</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Lahir</FormLabel>
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
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat Lengkap</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fatherName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Ayah</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="motherName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Ibu</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                Konversi
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
