"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProcurement } from "@/hooks/use-procurement";
import { useUnits } from "@/hooks/use-units";
import { useInventoryCategories } from "@/hooks/use-inventory"; // Assuming this exists or creates similar
import { Plus, Trash2, Save } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { CreatePurchaseRequestItemInput } from "@cipansor/shared";

export default function CreateProcurementPage() {
  const router = useRouter();
  const { createRequest, isCreating } = useProcurement();
  const { data: units } = useUnits();
  // We'll assume inventory categories hook exists or fetch it differently
  // For now, let's mock or use a generic fetch if hook missing
  const { data: categories } = useInventoryCategories();

  const [formData, setFormData] = useState({
    unitId: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  const [items, setItems] = useState<CreatePurchaseRequestItemInput[]>([
    {
      itemName: "",
      quantity: 1,
      unit: "pcs",
      estimatedPrice: 0,
      assetCategoryId: undefined,
    },
  ]);

  const handleAddItem = () => {
    setItems([
      ...items,
      { itemName: "", quantity: 1, unit: "pcs", estimatedPrice: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof CreatePurchaseRequestItemInput,
    value: any,
  ) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce(
      (sum, item) => sum + item.quantity * item.estimatedPrice,
      0,
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.unitId) return alert("Pilih unit terlebih dahulu");

      await createRequest({
        unitId: formData.unitId,
        date: new Date(formData.date),
        description: formData.description,
        items: items,
      });

      router.push("/procurement");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Buat Pengajuan Baru
            </h1>
            <p className="text-muted-foreground">
              Isi formulir pengajuan pengadaan barang.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Informasi Umum</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Unit Pemohon</Label>
                  <Select
                    value={formData.unitId}
                    onValueChange={(val) =>
                      setFormData({ ...formData, unitId: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units?.map((unit: any) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Pengajuan</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Deskripsi / Keperluan</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Contoh: Pengadaan alat tulis kantor untuk semester genap"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Daftar Barang</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
              >
                <Plus className="mr-2 h-4 w-4" /> Tambah Barang
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-4 items-end border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="col-span-4 space-y-2">
                    <Label className={index > 0 ? "sr-only" : ""}>
                      Nama Barang
                    </Label>
                    <Input
                      value={item.itemName}
                      onChange={(e) =>
                        handleItemChange(index, "itemName", e.target.value)
                      }
                      placeholder="Nama Barang"
                      required
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label className={index > 0 ? "sr-only" : ""}>
                      Kategori Aset
                    </Label>
                    <Select
                      value={item.assetCategoryId || "none"}
                      onValueChange={(val) =>
                        handleItemChange(
                          index,
                          "assetCategoryId",
                          val === "none" ? undefined : val,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kategori (Opsional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Tidak Masuk Aset</SelectItem>
                        {categories?.map((cat: any) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1 space-y-2">
                    <Label className={index > 0 ? "sr-only" : ""}>Jml</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "quantity",
                          parseInt(e.target.value),
                        )
                      }
                      required
                    />
                  </div>
                  <div className="col-span-1 space-y-2">
                    <Label className={index > 0 ? "sr-only" : ""}>Satuan</Label>
                    <Input
                      value={item.unit}
                      onChange={(e) =>
                        handleItemChange(index, "unit", e.target.value)
                      }
                      placeholder="Pcs"
                      required
                    />
                  </div>
                  <div className="col-span-3 space-y-2">
                    <Label className={index > 0 ? "sr-only" : ""}>
                      Est. Harga Satuan
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={item.estimatedPrice}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "estimatedPrice",
                          parseFloat(e.target.value),
                        )
                      }
                      required
                    />
                  </div>
                  <div className="col-span-1">
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-4 border-t">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    Total Estimasi:
                  </p>
                  <p className="text-xl font-bold">
                    {formatCurrency(calculateTotal())}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                "Menyimpan..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Simpan Pengajuan
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
