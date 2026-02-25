"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

const activitySchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.coerce.number().optional(),
  accountCodeId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
});

interface ActivityFormProps {
  objectiveId: string;
  planId: string;
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ActivityForm({ objectiveId, planId, initialData, onSuccess, onCancel }: ActivityFormProps) {
  const queryClient = useQueryClient();
  const isEdit = !!initialData;

  const { data: accounts } = useQuery({
    queryKey: ["account-codes"],
    queryFn: async () => {
      const res = await api.get("/finance-enhancement/account-codes", {
        params: { type: "EXPENSE", isActive: true, limit: 100 },
      });
      return res.data.data;
    },
  });

  const form = useForm<z.infer<typeof activitySchema>>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split("T")[0] : "",
      endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().split("T")[0] : "",
      budget: initialData?.budget || 0,
      accountCodeId: initialData?.accountCodeId || "",
      priority: initialData?.priority || "MEDIUM",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof activitySchema>) => {
      const payload = {
        ...values,
        startDate: values.startDate ? new Date(values.startDate).toISOString() : undefined,
        endDate: values.endDate ? new Date(values.endDate).toISOString() : undefined,
        accountCodeId: values.accountCodeId && values.accountCodeId !== "no-account" ? values.accountCodeId : null,
      };

      if (isEdit) {
        return api.put(`/api/perencanaan/activities/${initialData.id}`, payload);
      } else {
        return api.post("/api/perencanaan/activities", { ...payload, objectiveId });
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "Kegiatan diperbarui" : "Kegiatan dibuat");
      queryClient.invalidateQueries({ queryKey: ["perencanaan", planId] });
      queryClient.invalidateQueries({ queryKey: ["plan-realization", planId] });
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menyimpan kegiatan");
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Kegiatan</FormLabel>
              <FormControl>
                <Input placeholder="cth: Pembangunan Lab Komputer" {...field} />
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
              <FormLabel>Deskripsi</FormLabel>
              <FormControl>
                <Textarea placeholder="Detail kegiatan..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tgl Mulai</FormLabel>
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
                <FormLabel>Tgl Selesai</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prioritas</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Prioritas" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="LOW">Rendah</SelectItem>
                    <SelectItem value="MEDIUM">Sedang</SelectItem>
                    <SelectItem value="HIGH">Tinggi</SelectItem>
                    <SelectItem value="CRITICAL">Kritikal</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Anggaran (Rp)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="accountCodeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Akun Anggaran (Finance)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || "no-account"}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Akun (Optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="no-account">-- Tidak Ada --</SelectItem>
                  {accounts?.map((acc: any) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
