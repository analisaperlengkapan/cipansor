"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  useInventoryCategories,
  useCreateInventoryCategory,
  useUpdateInventoryCategory,
  useDeleteInventoryCategory,
  AssetCategory,
} from "@/hooks/use-inventory";
import { Edit, Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
  defaultUsefulLife: z.coerce.number().min(0).optional(),
  defaultResidualValue: z.coerce.number().min(0).optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export function CategoriesDialog() {
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AssetCategory | null>(
    null,
  );
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: categories, isLoading } = useInventoryCategories();
  const deleteMutation = useDeleteInventoryCategory();

  const handleEdit = (category: AssetCategory) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Category deleted");
    } catch {
      toast.error("Failed to delete category");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Kategori</Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manajemen Kategori Aset</DialogTitle>
            <DialogDescription>
              Kelola kategori aset, kode, dan nilai default untuk depresiasi.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end my-4">
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" /> Tambah Kategori
            </Button>
          </div>

          <div className="max-h-[400px] overflow-y-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Masa Manfaat (Bulan)</TableHead>
                  <TableHead>Nilai Sisa Default</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : categories?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      Belum ada kategori
                    </TableCell>
                  </TableRow>
                ) : (
                  categories?.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-mono">{cat.code}</TableCell>
                      <TableCell>{cat.name}</TableCell>
                      <TableCell>
                        {cat.defaultUsefulLife
                          ? `${cat.defaultUsefulLife} Bulan`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {cat.defaultResidualValue
                          ? new Intl.NumberFormat("id-ID", {
                              style: "currency",
                              currency: "IDR",
                            }).format(Number(cat.defaultResidualValue))
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(cat)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <ConfirmDialog
                            title="Hapus Kategori"
                            description="Hapus kategori ini? Aset yang menggunakan kategori ini tidak akan terhapus namun relasinya akan hilang."
                            onConfirm={() => handleDelete(cat.id)}
                          >
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </ConfirmDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <CategoryFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        category={editingCategory}
      />
    </>
  );
}

function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: AssetCategory | null;
}) {
  const createMutation = useCreateInventoryCategory();
  const updateMutation = useUpdateInventoryCategory();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || "",
      code: category?.code || "",
      description: category?.description || "",
      defaultUsefulLife: category?.defaultUsefulLife || 0,
      defaultResidualValue: Number(category?.defaultResidualValue) || 0,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: category?.name || "",
        code: category?.code || "",
        description: category?.description || "",
        defaultUsefulLife: category?.defaultUsefulLife || 0,
        defaultResidualValue: Number(category?.defaultResidualValue) || 0,
      });
    }
  }, [category, open, form]);

  async function onSubmit(values: CategoryFormValues) {
    try {
      if (category) {
        await updateMutation.mutateAsync({ id: category.id, data: values });
        toast.success("Kategori diperbarui");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("Kategori dibuat");
      }
      onOpenChange(false);
    } catch {
      toast.error("Gagal menyimpan kategori");
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {category ? "Edit Kategori" : "Tambah Kategori"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Kategori</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Contoh: Elektronik" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kode Kategori</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Contoh: ELK" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="defaultUsefulLife"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Masa Manfaat (Bulan)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defaultResidualValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nilai Sisa Default (IDR)</FormLabel>
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
