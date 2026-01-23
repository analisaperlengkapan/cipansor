"use client";

import { useState } from "react";
import {
  useGuestBooks,
  useCreateGuestBook,
  useUpdateGuestBook,
  GuestBook,
} from "@/hooks/use-reception";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { toast } from "sonner";
import { CreateGuestBookInput } from "@cipansor/shared";
import { Loader2, Plus, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function GuestBookPage() {
  const [date, setDate] = useState<Date>(new Date());
  const { data: guests, isLoading } = useGuestBooks({
    date: date.toISOString(),
  });
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Buku Tamu</h1>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={format(date, "yyyy-MM-dd")}
            onChange={(e) => setDate(new Date(e.target.value))}
            className="w-auto"
          />
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Catat Tamu
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Catat Tamu Baru</DialogTitle>
              </DialogHeader>
              <GuestForm onSuccess={() => setIsOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>Nama Tamu</TableHead>
              <TableHead>Instansi</TableHead>
              <TableHead>Keperluan</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : guests?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center h-24 text-muted-foreground"
                >
                  Belum ada tamu hari ini
                </TableCell>
              </TableRow>
            ) : (
              guests?.map((guest) => <GuestRow key={guest.id} guest={guest} />)
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function GuestForm({ onSuccess }: { onSuccess: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateGuestBookInput>();
  const createGuest = useCreateGuestBook();

  const onSubmit = async (data: CreateGuestBookInput) => {
    try {
      await createGuest.mutateAsync({
        ...data,
        visitorCount: Number(data.visitorCount),
      });
      toast.success("Data tamu berhasil disimpan");
      onSuccess();
    } catch (_error) {
      // Error handled by query mutation or global handler
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nama Tamu</Label>
        <Input id="name" {...register("name", { required: true })} />
        {errors.name && (
          <span className="text-xs text-red-500">Wajib diisi</span>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="institution">Instansi (Opsional)</Label>
        <Input id="institution" {...register("institution")} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">No. HP (Opsional)</Label>
        <Input id="phone" {...register("phone")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="visitorCount">Jumlah Tamu</Label>
          <Input
            id="visitorCount"
            type="number"
            min={1}
            defaultValue={1}
            {...register("visitorCount", { required: true })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="vehicleNumber">Plat Nomor (Opsional)</Label>
          <Input id="vehicleNumber" {...register("vehicleNumber")} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="purpose">Keperluan</Label>
        <Textarea id="purpose" {...register("purpose", { required: true })} />
        {errors.purpose && (
          <span className="text-xs text-red-500">Wajib diisi</span>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={createGuest.isPending}>
        {createGuest.isPending && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Simpan
      </Button>
    </form>
  );
}

function GuestRow({ guest }: { guest: GuestBook }) {
  const updateGuest = useUpdateGuestBook();

  const handleCheckout = async () => {
    try {
      await updateGuest.mutateAsync({
        id: guest.id,
        data: { checkOut: new Date() },
      });
      toast.success("Tamu berhasil check-out");
    } catch (_error) {
      // Error handled by query mutation or global handler
    }
  };

  return (
    <TableRow>
      <TableCell>{format(new Date(guest.checkIn), "HH:mm")}</TableCell>
      <TableCell>
        <div className="font-medium">{guest.name}</div>
        {guest.phone && (
          <div className="text-xs text-muted-foreground">{guest.phone}</div>
        )}
      </TableCell>
      <TableCell>{guest.institution || "-"}</TableCell>
      <TableCell>{guest.purpose}</TableCell>
      <TableCell>{guest.visitorCount} orang</TableCell>
      <TableCell>
        {guest.checkOut ? (
          <Badge variant="outline">Selesai</Badge>
        ) : (
          <Badge variant="default" className="bg-green-600">
            Berkunjung
          </Badge>
        )}
      </TableCell>
      <TableCell>
        {!guest.checkOut && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCheckout}
            disabled={updateGuest.isPending}
            title="Check Out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
