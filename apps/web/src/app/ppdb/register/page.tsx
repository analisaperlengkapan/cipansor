"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MainLayout } from "@/components/layout/main-layout";

const formSchema = z.object({
  fullName: z.string().min(2, "Nama minimal 2 karakter"),
  gender: z.enum(["MALE", "FEMALE"]),
  birthPlace: z.string().min(2, "Tempat lahir wajib diisi"),
  birthDate: z.string().min(1, "Tanggal lahir wajib diisi"),
  address: z.string().min(5, "Alamat minimal 5 karakter"),
  parentName: z.string().min(2, "Nama orang tua wajib diisi"),
  parentPhone: z.string().min(8, "Nomor HP minimal 8 digit"),
  email: z.string().email("Email tidak valid"),
  previousSchool: z.string().min(2, "Asal sekolah wajib diisi"),
});

export default function RegistrationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      gender: "MALE",
      birthPlace: "",
      birthDate: "",
      address: "",
      parentName: "",
      parentPhone: "",
      email: "",
      previousSchool: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      // Fetch active admission period first (simplified for this context)
      // Ideally this should be server-side or fetched on load
      const periodResponse = await fetch('/api/psb/periods?isActive=true&limit=1');
      const periodData = await periodResponse.json();

      if (!periodData.success || !periodData.data || periodData.data.length === 0) {
        throw new Error("Tidak ada periode pendaftaran aktif");
      }

      const periodId = periodData.data[0].id;

      const response = await fetch('/api/psb/registrants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          admissionPeriodId: periodId,
          // Map to correct fields expected by backend schema
          parentName: values.parentName,
          parentPhone: values.parentPhone,
          parentEmail: values.email,
          // Keep extended fields if needed, but primary mapping is to parent* fields
          fatherName: values.parentName,
          fatherPhone: values.parentPhone,
          fatherEmail: values.email,
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mendaftar");
      }

      router.push(`/ppdb/registration/${result.data.id}/payment`);
    } catch (error: any) {
      console.error(error);
      alert(error.message); // Simple error feedback
    } finally {
      setLoading(false);
    }
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-10 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Formulir Pendaftaran Santri Baru</CardTitle>
            <CardDescription>
              Silakan isi data diri calon santri dengan lengkap dan benar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama sesuai akta kelahiran" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="birthPlace"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Tempat Lahir</FormLabel>
                        <FormControl>
                            <Input placeholder="Kota lahir" {...field} />
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

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat Lengkap</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Jalan, RT/RW, Kelurahan, Kecamatan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-medium">Data Orang Tua / Wali</h3>
                    <FormField
                    control={form.control}
                    name="parentName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nama Ayah/Ibu</FormLabel>
                        <FormControl>
                            <Input placeholder="Nama orang tua" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                        control={form.control}
                        name="parentPhone"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Nomor HP (WhatsApp)</FormLabel>
                            <FormControl>
                                <Input placeholder="08xxxxxxxxxx" {...field} />
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
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="email@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-medium">Data Pendidikan</h3>
                    <FormField
                    control={form.control}
                    name="previousSchool"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Asal Sekolah</FormLabel>
                        <FormControl>
                            <Input placeholder="Nama sekolah sebelumnya" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Memproses..." : "Daftar Sekarang"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
