"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useCreateMaintenanceRequest, useInventoryItems } from "@/hooks/use-inventory";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

const MAINTENANCE_TYPES = [
  "Perbaikan",
  "Pembersihan",
  "Pemeriksaan",
  "Penggantian",
  "Lainnya",
];

export function MaintenanceRequestDialog() {
  const [open, setOpen] = useState(false);
  const [assetSearch, setAssetSearch] = useState("");
  const debouncedSearch = useDebounce(assetSearch, 500);

  const [form, setForm] = useState({
    assetId: "",
    type: "Perbaikan",
    description: "",
    notes: "",
  });

  const { data: assetsData, isLoading: loadingAssets } = useInventoryItems({
    search: debouncedSearch,
    limit: 20,
    status: "ACTIVE",
  });

  const { mutateAsync: createRequest, isPending } = useCreateMaintenanceRequest();

  const handleSubmit = async () => {
    if (!form.assetId) {
      toast.error("Pilih aset yang bermasalah");
      return;
    }
    if (!form.description) {
      toast.error("Deskripsi masalah wajib diisi");
      return;
    }

    try {
      await createRequest({
        assetId: form.assetId,
        type: form.type,
        description: form.description,
        notes: form.notes,
      });
      toast.success("Permintaan maintenance berhasil dibuat");
      setOpen(false);
      setForm({
        assetId: "",
        type: "Perbaikan",
        description: "",
        notes: "",
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal membuat permintaan");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Lapor Kerusakan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Lapor Kerusakan / Maintenance</DialogTitle>
          <DialogDescription>
            Buat permintaan perbaikan untuk aset atau fasilitas.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Cari Aset</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama aset..."
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select
              value={form.assetId}
              onValueChange={(val) => setForm({ ...form, assetId: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingAssets ? "Loading..." : "Pilih Aset"} />
              </SelectTrigger>
              <SelectContent>
                {assetsData?.data?.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.name} ({asset.code})
                  </SelectItem>
                ))}
                {!loadingAssets && assetsData?.data?.length === 0 && (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    Aset tidak ditemukan
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Jenis Masalah</Label>
            <Select
              value={form.type}
              onValueChange={(val) => setForm({ ...form, type: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MAINTENANCE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Deskripsi Masalah</Label>
            <Textarea
              placeholder="Jelaskan kerusakan atau masalah yang terjadi..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label>Catatan Tambahan (Opsional)</Label>
            <Input
              placeholder="Lokasi spesifik, urgensi, dll."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Menyimpan..." : "Kirim Laporan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
