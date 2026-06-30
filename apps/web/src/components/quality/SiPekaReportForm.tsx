"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateComplaint } from "@/hooks/use-complaints";
import { useBuildings } from "@/hooks/use-facilities";
import { useInventoryItems } from "@/hooks/use-inventory";
import { Camera, Wrench } from "lucide-react";

const sipekaSchema = z.object({
  subject: z.string().min(5, "Subjek terlalu pendek"),
  category: z.string().min(1),
  description: z.string().min(20, "Berikan deskripsi yang lebih jelas (min 20 karakter)"),
  location: z.string().optional(),
  buildingId: z.string().optional(),
  roomId: z.string().optional(),
  assetId: z.string().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
});

export function SiPekaReportForm() {
  const createComplaint = useCreateComplaint();
  const { data: buildings } = useBuildings();
  const { data: itemsResponse } = useInventoryItems({ limit: 100 });
  const items = itemsResponse?.data || [];

  const form = useForm<z.infer<typeof sipekaSchema>>({
    resolver: zodResolver(sipekaSchema),
    defaultValues: {
      subject: "",
      category: "FACILITY",
      description: "",
      priority: "NORMAL",
    },
  });

  const onSubmit = async (values: z.infer<typeof sipekaSchema>) => {
    try {
      await createComplaint.mutateAsync(values);
      form.reset();
    } catch (error) {
      // toast already handled in hook
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul Laporan</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: AC Kelas 7A Bocor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tingkat Urgensi</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih urgensi" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="LOW">Rendah (Bisa Menunggu)</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="HIGH">Tinggi (Segera)</SelectItem>
                      <SelectItem value="URGENT">Darurat (Berbahaya/Sangat Mengganggu)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="buildingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gedung</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Gedung" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {buildings?.map((b) => (
                          <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                        ))}
                        {!buildings?.length && (
                          <SelectItem value="none" disabled>Tidak ada data gedung</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="roomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ruangan</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Kamar 102" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="assetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aset Spesifik (Opsional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Aset" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>{item.code} - {item.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Jika kerusakan pada barang inventaris tertentu</FormDescription>
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detail Kerusakan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Jelaskan detail kerusakan, posisi, dan sejak kapan terjadi..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-muted-foreground bg-muted/30">
              <Camera className="w-12 h-12 mb-2 opacity-20" />
              <p className="text-sm">Klik untuk unggah foto bukti kerusakan</p>
              <Input type="file" className="hidden" id="photo-upload" accept="image/*" />
              <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => document.getElementById('photo-upload')?.click()}>
                Pilih File
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button type="submit" size="lg" className="px-12" disabled={createComplaint.isPending}>
            {createComplaint.isPending ? "Mengirim..." : "Kirim Laporan Si-Peka"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
