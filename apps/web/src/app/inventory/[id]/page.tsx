'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import {
  useInventoryItem,
  useDeleteInventoryItem,
  ITEM_CATEGORIES,
  ITEM_CONDITIONS,
  ITEM_STATUSES,
  ItemCategory,
  ItemCondition,
  ItemStatus,
} from '@/hooks/use-inventory';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Loader2,
  Package,
  MapPin,
  Calendar,
  DollarSign,
  Building,
  FileText,
  ShieldCheck,
  QrCode,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function InventoryDetailPage({ params }: PageProps) {
  const { id: itemId } = use(params);
  const router = useRouter();

  const { data: item, isLoading } = useInventoryItem(itemId);
  const deleteItem = useDeleteInventoryItem();

  const getConditionBadge = (condition: ItemCondition) => {
    const condInfo = ITEM_CONDITIONS.find((c) => c.value === condition);
    return (
      <Badge variant="outline" className={`${condInfo?.color} text-sm px-3 py-1`}>
        {condInfo?.label || condition}
      </Badge>
    );
  };

  const getStatusBadge = (status: ItemStatus) => {
    const statusInfo = ITEM_STATUSES.find((s) => s.value === status);
    return (
      <Badge variant="outline" className={`${statusInfo?.color} text-sm px-3 py-1`}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  const getCategoryLabel = (category: ItemCategory) => {
    return ITEM_CATEGORIES.find((c) => c.value === category)?.label || category;
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleDelete = async () => {
    try {
      await deleteItem.mutateAsync(itemId);
      toast.success('Inventaris berhasil dihapus');
      router.push('/inventory');
    } catch (error) {
      toast.error('Gagal menghapus inventaris');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-medium">Inventaris tidak ditemukan</h2>
        <Button className="mt-4" onClick={() => router.back()}>
          Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{item.name}</h1>
            <p className="text-muted-foreground font-mono">{item.code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/inventory/${itemId}/edit`}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <ConfirmDialog
            title="Hapus Inventaris"
            description="Apakah Anda yakin ingin menghapus inventaris ini? Tindakan ini tidak dapat dibatalkan."
            onConfirm={handleDelete}
            loading={deleteItem.isPending}
          >
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus
            </Button>
          </ConfirmDialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Informasi Barang
                </CardTitle>
                <CardDescription>
                  Kategori: {getCategoryLabel(item.category)}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {getConditionBadge(item.condition)}
                {getStatusBadge(item.status)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {item.description && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Deskripsi</h4>
                <p className="text-sm">{item.description}</p>
              </div>
            )}

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Jumlah</p>
                <p className="text-2xl font-bold">{item.quantity}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Harga Satuan</p>
                <p className="text-2xl font-bold">{formatCurrency(item.purchasePrice)}</p>
              </div>
            </div>

            {item.purchasePrice && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Nilai Aset</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(item.purchasePrice * item.quantity)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location & Unit */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Lokasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Lokasi Penyimpanan</p>
              <p className="font-medium">{item.location || '-'}</p>
            </div>
            <Separator />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Unit Pengguna</p>
              <p className="font-medium">{item.unit?.name || '-'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Purchase Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Informasi Pembelian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tanggal Pembelian</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {item.purchaseDate
                      ? format(new Date(item.purchaseDate), 'dd MMMM yyyy', { locale: id })
                      : '-'}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Harga Pembelian</p>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>{formatCurrency(item.purchasePrice)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warranty Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Garansi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {item.warrantyExpiry ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Berlaku sampai:{' '}
                    <strong>
                      {format(new Date(item.warrantyExpiry), 'dd MMMM yyyy', { locale: id })}
                    </strong>
                  </span>
                </div>
                {new Date(item.warrantyExpiry) > new Date() ? (
                  <Badge className="bg-green-100 text-green-800">Masih Berlaku</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">Sudah Habis</Badge>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Tidak ada informasi garansi</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {item.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Catatan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{item.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Meta Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <div>
              <span>Dibuat: </span>
              <span className="text-foreground">
                {item.createdAt
                  ? format(new Date(item.createdAt), 'dd MMM yyyy HH:mm', { locale: id })
                  : '-'}
              </span>
            </div>
            <div>
              <span>Diperbarui: </span>
              <span className="text-foreground">
                {item.updatedAt
                  ? format(new Date(item.updatedAt), 'dd MMM yyyy HH:mm', { locale: id })
                  : '-'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
