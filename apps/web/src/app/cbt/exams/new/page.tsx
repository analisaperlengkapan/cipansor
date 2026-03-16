"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreateExam, useQuestionBanks } from "@/hooks/use-cbt";

const examSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  description: z.string().optional(),
  unitId: z.string().min(1, "Unit harus diisi"),
  academicYearId: z.string().min(1, "Tahun Ajaran harus diisi"),
  subjectId: z.string().min(1, "Mata Pelajaran harus diisi"),
  classId: z.string().min(1, "Kelas harus diisi"),
  questionBankId: z.string().min(1, "Bank Soal harus dipilih"),
  scheduledAt: z.string().min(1, "Waktu Pelaksanaan harus diisi"),
  duration: z.coerce.number().min(10, "Durasi minimal 10 menit"),
  maxScore: z.coerce.number().min(1, "Nilai maksimal harus lebih dari 0"),
  passingScore: z.coerce.number().min(1, "KKM harus lebih dari 0"),
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED"]).default("DRAFT"),
});

export default function NewExamPage() {
  const router = useRouter();
  const createExam = useCreateExam();
  const { data: banksRes } = useQuestionBanks();

  const banks = banksRes?.data || [];

  const form = useForm<z.infer<typeof examSchema>>({
    resolver: zodResolver(examSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      unitId: "cb021d7f-2b36-42d4-9d58-941ea5d8a9e8", // placeholder for local dev
      academicYearId: "c20ad411-b0e5-4d7a-85b3-855728a0edce",
      subjectId: "f47b2c01-8b3d-4c3d-bc8e-170f806e0c7a",
      classId: "ab9d1e8c-84d4-4a8b-98a4-0ef66e85d4d3",
      questionBankId: "",
      scheduledAt: "",
      duration: 60,
      maxScore: 100,
      passingScore: 70,
      status: "DRAFT",
    },
  });

  async function onSubmit(values: z.infer<typeof examSchema>) {
    try {
      await createExam.mutateAsync({
        ...values,
        scheduledAt: new Date(values.scheduledAt).toISOString(),
      });
      toast.success("Jadwal ujian berhasil dibuat");
      router.push("/cbt/exams");
    } catch (error: any) {
      toast.error(error.message || "Gagal membuat jadwal ujian");
    }
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Buat Ujian Baru</h1>
          <p className="text-muted-foreground">
            Konfigurasi jadwal, kelas, dan bank soal untuk ujian.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Form Konfigurasi Ujian</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Judul Ujian</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: UTS Matematika Ganjil" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="questionBankId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Soal</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Bank Soal" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {banks.map((b: any) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.title} ({b._count?.questions || 0} Soal)
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
                    name="scheduledAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Waktu Pelaksanaan</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Durasi (Menit)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="passingScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>KKM (Passing Score)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status Ujian</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="DRAFT">Draft</SelectItem>
                            <SelectItem value="ACTIVE">Aktif (Bisa dikerjakan)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={createExam.isPending}>
                    {createExam.isPending ? "Menyimpan..." : "Simpan Ujian"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
