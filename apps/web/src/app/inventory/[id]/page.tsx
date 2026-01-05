'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { toast } from 'sonner';
import { useInventoryItem, useDeleteInventoryItem, AssetCondition, AssetStatus } from '@/hooks/use-inventory';
import { useUnits } from '@/hooks/use-units';

function getConditionBadge(condition: AssetCondition) {
  const colorMap: Record<AssetCondition, string> = {
    [AssetCondition.EXCELLENT]: 'bg-green-100 text-green-800',
    [AssetCondition.GOOD]: 'bg-blue-100 text-blue-800',
    [AssetCondition.FAIR]: 'bg-yellow-100 text-yellow-800',
    [AssetCondition.POOR]: 'bg-orange-100 text-orange-800',
    [AssetCondition.BROKEN]: 'bg-red-100 text-red-800',
  };

  return (
    <Badge variant="outline" className={colorMap[condition] || 'bg-gray-100'}>
      {condition}
    </Badge>
  );
}

function getStatusBadge(status: AssetStatus) {
  const colorMap: Record<AssetStatus, string> = {
    [AssetStatus.ACTIVE]: 'bg-green-100 text-green-800',
    [AssetStatus.MAINTENANCE]: 'bg-yellow-100 text-yellow-800',
    [AssetStatus.DAMAGED]: 'bg-red-100 text-red-800',
    [AssetStatus.DISPOSED]: 'bg-gray-100 text-gray-800',
  };

  return (
    <Badge variant="outline" className={colorMap[status] || 'bg-gray-100'}>
      {status}
    </Badge>
  );
}

export default function InventoryDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const itemId = params.id;
  const { data: item, isLoading } = useInventoryItem(itemId);
  const deleteMutation = useDeleteInventoryItem();
  const { data: units } = useUnits();

  const unitName = units?.find((u) => u.id === item?.unitId)?.name || '-';

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(itemId);
      toast.success('Inventaris berhasil dihapus');
      router.push('/inventory');
    } catch {
      toast.error('Gagal menghapus inventaris');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Data inventaris tidak ditemukan</p>
        <Button asChild className="mt-4">
          <Link href="/inventory">Kembali ke Daftar</Link>
        </Button>
      </div>
    );
  }

  const formatCurrency = (amount?: number | string | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/inventory">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{item.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-mono text-sm">{item.code}</span>
              <span>•</span>
              <span>{item.category?.name}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/inventory/${itemId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <ConfirmDialog
            title="Hapus Inventaris"
            description="Apakah Anda yakin ingin menghapus data inventaris ini? Data yang dihapus tidak dapat dikembalikan."
            onConfirm={handleDelete}
            loading={deleteMutation.isPending}
          >
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus
            </Button>
          </ConfirmDialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Dasar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge(item.status)}</div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kondisi</p>
                <div className="mt-1">{getConditionBadge(item.condition)}</div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Brand</p>
                <p className="font-medium">{item.brand || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Model</p>
                <p className="font-medium">{item.model || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Serial Number</p>
                <p className="font-mono">{item.serialNumber || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unit</p>
                <p className="font-medium">{unitName}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Deskripsi</p>
              <p className="mt-1 whitespace-pre-wrap">{item.notes || item.description || '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Location & Purchase Info */}
        <Card>
          <CardHeader>
            <CardTitle>Lokasi & Pembelian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Lokasi</p>
              <p className="font-medium">{item.location || '-'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tanggal Beli</p>
                <p className="font-medium">{formatDate(item.purchaseDate)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Harga Beli</p>
                <p className="font-medium">{formatCurrency(item.purchasePrice)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Supplier</p>
                <p className="font-medium">{item.supplier || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Garansi Sampai</p>
                <p className="font-medium">{formatDate(item.warrantyExpiry)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance History could go here */}
      </div>
    </div>
  );
}
