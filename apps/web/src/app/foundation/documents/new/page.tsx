"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Upload } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useCreateFoundationDocument,
  DOCUMENT_TYPE_LABELS,
  type DocumentType,
} from "@/hooks";
import { useState } from "react";

const documentTypes = Object.entries(DOCUMENT_TYPE_LABELS).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

const formSchema = z.object({
  name: z.string().min(1, "Nama dokumen wajib diisi"),
  type: z.string().min(1, "Jenis dokumen wajib dipilih"),
  description: z.string().optional(),
  documentNumber: z.string().optional(),
  issuedDate: z.string().optional(),
  expiryDate: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function NewDocumentPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const createDocument = useCreateFoundationDocument();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "",
      description: "",
      documentNumber: "",
      issuedDate: "",
      expiryDate: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!file) {
      toast.error("File dokumen wajib diupload");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("type", data.type);
      if (data.description) formData.append("description", data.description);
      if (data.documentNumber)
        formData.append("documentNumber", data.documentNumber);
      if (data.issuedDate) formData.append("issuedDate", data.issuedDate);
      if (data.expiryDate) formData.append("expiryDate", data.expiryDate);
      formData.append("file", file);

      await createDocument.mutateAsync(formData);
      toast.success("Dokumen berhasil ditambahkan");
      router.push("/foundation?tab=documents");
    } catch {
      toast.error("Gagal menambahkan dokumen");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/foundation?tab=documents">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tambah Dokumen</h1>
          <p className="text-muted-foreground">Upload dokumen yayasan baru</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Document Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Dokumen</CardTitle>
                <CardDescription>Detail dokumen yayasan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Dokumen</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Akta Pendirian Yayasan"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jenis Dokumen</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih jenis dokumen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {documentTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
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
                  name="documentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomor Dokumen</FormLabel>
                      <FormControl>
                        <Input placeholder="001/NOT/2024" {...field} />
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
                        <Textarea
                          placeholder="Deskripsi dokumen..."
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

            {/* Dates & File */}
            <Card>
              <CardHeader>
                <CardTitle>Tanggal & File</CardTitle>
                <CardDescription>Masa berlaku dan file dokumen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="issuedDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Terbit</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Kadaluarsa</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          Kosongkan jika permanen
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormLabel>File Dokumen</FormLabel>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    {file ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFile(null)}
                        >
                          Ganti File
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Klik untuk upload atau drag & drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF, JPG, PNG (Max 10MB)
                        </p>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const selectedFile = e.target.files?.[0];
                            if (selectedFile) {
                              if (selectedFile.size > 10 * 1024 * 1024) {
                                toast.error("Ukuran file maksimal 10MB");
                                return;
                              }
                              setFile(selectedFile);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link href="/foundation?tab=documents">Batal</Link>
            </Button>
            <Button type="submit" disabled={createDocument.isPending}>
              {createDocument.isPending && (
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
