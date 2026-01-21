"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ArrowLeft, UserPlus, CalendarIcon } from "lucide-react";
import { toast } from "sonner";

import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useWave, useCreateRegistrant } from "@/hooks/use-ppdb-wave";

interface Props {
  params: Promise<{ id: string }>;
}

const registrantSchema = z.object({
  studentName: z.string().min(3, "Nama minimal 3 karakter"),
  birthDate: z.date({ required_error: "Pilih tanggal lahir" }),
  gender: z.string().min(1, "Pilih jenis kelamin"),
  parentName: z.string().min(3, "Nama orang tua minimal 3 karakter"),
  parentPhone: z.string().min(10, "No. HP minimal 10 digit"),
  address: z.string().min(10, "Alamat minimal 10 karakter"),
  previousSchool: z.string().optional(),
  notes: z.string().optional(),
});

type RegistrantFormData = z.infer<typeof registrantSchema>;

export default function NewRegistrantPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { data: wave, isLoading: waveLoading } = useWave(id);
  const createRegistrant = useCreateRegistrant();

  const form = useForm<RegistrantFormData>({
    resolver: zodResolver(registrantSchema),
    defaultValues: {
      studentName: "",
      birthDate: undefined,
      gender: "",
      parentName: "",
      parentPhone: "",
      address: "",
      previousSchool: "",
      notes: "",
    },
  });

  const onSubmit = async (data: RegistrantFormData) => {
    try {
      await createRegistrant.mutateAsync({
        waveId: id,
        studentName: data.studentName,
        birthDate: data.birthDate.toISOString(),
        gender: data.gender,
        parentName: data.parentName,
        parentPhone: data.parentPhone,
        address: data.address,
        previousSchool: data.previousSchool || undefined,
        notes: data.notes || undefined,
        registrationDate: new Date().toISOString(),
        status: "REGISTERED",
        documents: [],
      });
      toast.success("Pendaftar berhasil ditambahkan");
      router.push(`/ppdb/waves/${id}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Gagal menambahkan pendaftar";
      toast.error(errorMessage);
    }
  };

  if (waveLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!wave) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Gelombang PPDB tidak ditemukan
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        title="Tambah Pendaftar"
        description={`${wave.name} - ${wave.unit?.name}`}
        backHref={`/ppdb/waves/${id}`}
        backLabel="Kembali"
      />

      <div className="max-w-2xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Student Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-blue-500" />
                  Data Calon Peserta Didik
                </CardTitle>
                <CardDescription>
                  Informasi data diri calon peserta didik baru
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name */}
                <FormField
                  control={form.control}
                  name="studentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nama lengkap sesuai akta"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Birth Date & Gender */}
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Tanggal Lahir *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pilih tanggal</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date > new Date()}
                              initialFocus
                              captionLayout="dropdown-months"
                              fromYear={2000}
                              toYear={2023}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jenis Kelamin *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="L">Laki-laki</SelectItem>
                            <SelectItem value="P">Perempuan</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Previous School */}
                <FormField
                  control={form.control}
                  name="previousSchool"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asal Sekolah</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nama sekolah sebelumnya"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        TK/SD/SMP asal (jika ada)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Parent Data */}
            <Card>
              <CardHeader>
                <CardTitle>Data Orang Tua / Wali</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="parentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Orang Tua / Wali *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nama lengkap orang tua/wali"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parentPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. HP Orang Tua / Wali *</FormLabel>
                      <FormControl>
                        <Input placeholder="08123456789" {...field} />
                      </FormControl>
                      <FormDescription>
                        Nomor yang bisa dihubungi untuk konfirmasi
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat Lengkap *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Alamat lengkap termasuk RT/RW, Kelurahan, Kecamatan, Kota"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Additional Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Catatan Tambahan</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Catatan tambahan (kebutuhan khusus, prestasi, dll)"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={createRegistrant.isPending}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Batal
              </Button>
              <Button type="submit" disabled={createRegistrant.isPending}>
                {createRegistrant.isPending
                  ? "Menyimpan..."
                  : "Simpan Pendaftar"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </MainLayout>
  );
}
