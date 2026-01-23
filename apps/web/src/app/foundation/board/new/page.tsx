"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useCreateFoundationBoardMember } from "@/hooks";

const formSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  position: z.string().min(1, "Jabatan wajib diisi"),
  phone: z.string().optional(),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  address: z.string().optional(),
  startDate: z.string().min(1, "Tanggal mulai jabatan wajib diisi"),
  endDate: z.string().optional(),
  isActive: z.boolean(),
  bio: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function NewBoardMemberPage() {
  const router = useRouter();
  const createMember = useCreateFoundationBoardMember();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      position: "",
      phone: "",
      email: "",
      address: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      isActive: true,
      bio: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createMember.mutateAsync({
        ...data,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        endDate: data.endDate || undefined,
        bio: data.bio || undefined,
      });
      toast.success("Pengurus berhasil ditambahkan");
      router.push("/foundation?tab=board");
    } catch {
      toast.error("Gagal menambahkan pengurus");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/foundation?tab=board">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tambah Pengurus</h1>
          <p className="text-muted-foreground">
            Tambah anggota pengurus yayasan baru
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Personal Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Pribadi</CardTitle>
                <CardDescription>Data pribadi pengurus</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap</FormLabel>
                      <FormControl>
                        <Input placeholder="Dr. H. Ahmad, M.A." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jabatan</FormLabel>
                      <FormControl>
                        <Input placeholder="Ketua Yayasan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomor Telepon</FormLabel>
                      <FormControl>
                        <Input placeholder="08123456789" {...field} />
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
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Alamat lengkap..."
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Position Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Jabatan</CardTitle>
                <CardDescription>Masa jabatan dan status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                        <FormLabel>Tanggal Berakhir</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          Kosongkan jika masih aktif
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="mt-0!">Status Aktif</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biografi Singkat</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Riwayat singkat pengurus..."
                          rows={5}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link href="/foundation?tab=board">Batal</Link>
            </Button>
            <Button type="submit" disabled={createMember.isPending}>
              {createMember.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Simpan
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
