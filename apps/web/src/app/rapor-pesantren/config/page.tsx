'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, AlertCircle, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/shared';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

interface RaporConfig {
  unitId: string;
  componentWeights: {
    tahfidz: number;
    ibadah: number;
    muhadhoroh: number;
    muhadatsah: number;
    kitabProgress: number;
    akhlak: number;
  };
  gradeThresholds: {
    mumtaz: number;
    jayyidJiddan: number;
    jayyid: number;
    maqbul: number;
  };
  includeAttendance: boolean;
  includeViolations: boolean;
  includeRewards: boolean;
}

export default function RaporConfigPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const unitId = user?.unitId;

  const [formData, setFormData] = useState<RaporConfig | null>(null);

  const { isLoading } = useQuery({
    queryKey: ['rapor-pesantren', 'config', unitId],
    queryFn: async () => {
      if (!unitId) return null;
      const res = await api.get(`/rapor-pesantren/config/${unitId}`);
      return res.data.data as RaporConfig;
    },
    enabled: !!unitId,
    onSuccess: (data) => {
      if (data) setFormData(data);
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: RaporConfig) => {
      const res = await api.put('/rapor-pesantren/config', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rapor-pesantren', 'config'] });
      toast.success('Konfigurasi rapor berhasil disimpan');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Terjadi kesalahan saat menyimpan konfigurasi');
    },
  });

  if (!unitId) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-muted-foreground">Unit ID tidak ditemukan pada profil user.</p>
      </div>
    );
  }

  if (isLoading || !formData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleWeightChange = (key: keyof RaporConfig['componentWeights'], value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => prev ? ({
      ...prev,
      componentWeights: {
        ...prev.componentWeights,
        [key]: numValue,
      }
    }) : null);
  };

  const handleThresholdChange = (key: keyof RaporConfig['gradeThresholds'], value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => prev ? ({
      ...prev,
      gradeThresholds: {
        ...prev.gradeThresholds,
        [key]: numValue,
      }
    }) : null);
  };

  const totalWeight = Object.values(formData.componentWeights).reduce((a, b) => a + b, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Konfigurasi Rapor Pesantren
          </h1>
          <p className="text-muted-foreground">
            Pengaturan bobot nilai dan standar kelulusan
          </p>
        </div>
        <Button
          onClick={() => mutation.mutate(formData)}
          disabled={mutation.isPending || totalWeight !== 100}
        >
          {mutation.isPending ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Simpan Perubahan
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Bobot Penilaian */}
        <Card>
          <CardHeader>
            <CardTitle>Bobot Penilaian (%)</CardTitle>
            <CardDescription>
              Total bobot harus 100%. Saat ini: <span className={totalWeight === 100 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{totalWeight}%</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tahfidz (Hafalan & Murajaah)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={formData.componentWeights.tahfidz}
                  onChange={(e) => handleWeightChange('tahfidz', e.target.value)}
                />
                <span className="text-muted-foreground w-8">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ibadah Harian</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={formData.componentWeights.ibadah}
                  onChange={(e) => handleWeightChange('ibadah', e.target.value)}
                />
                <span className="text-muted-foreground w-8">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Muhadhoroh (Pidato)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={formData.componentWeights.muhadhoroh}
                  onChange={(e) => handleWeightChange('muhadhoroh', e.target.value)}
                />
                <span className="text-muted-foreground w-8">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Muhadatsah (Bahasa)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={formData.componentWeights.muhadatsah}
                  onChange={(e) => handleWeightChange('muhadatsah', e.target.value)}
                />
                <span className="text-muted-foreground w-8">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Kitab Kuning</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={formData.componentWeights.kitabProgress}
                  onChange={(e) => handleWeightChange('kitabProgress', e.target.value)}
                />
                <span className="text-muted-foreground w-8">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Akhlak & Kedisiplinan</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={formData.componentWeights.akhlak}
                  onChange={(e) => handleWeightChange('akhlak', e.target.value)}
                />
                <span className="text-muted-foreground w-8">%</span>
              </div>
            </div>

            {totalWeight !== 100 && (
              <div className="flex items-center gap-2 text-red-600 text-sm mt-4 p-2 bg-red-50 rounded">
                <AlertCircle className="w-4 h-4" />
                Total bobot harus 100%
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Batas Nilai / Predikat */}
          <Card>
            <CardHeader>
              <CardTitle>Standar Penilaian</CardTitle>
              <CardDescription>Batas bawah nilai untuk setiap predikat</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-green-600">Mumtaz (Istimewa)</Label>
                  <Input
                    type="number"
                    value={formData.gradeThresholds.mumtaz}
                    onChange={(e) => handleThresholdChange('mumtaz', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Minimal nilai untuk Mumtaz</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-blue-600">Jayyid Jiddan (Sangat Baik)</Label>
                  <Input
                    type="number"
                    value={formData.gradeThresholds.jayyidJiddan}
                    onChange={(e) => handleThresholdChange('jayyidJiddan', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-yellow-600">Jayyid (Baik)</Label>
                  <Input
                    type="number"
                    value={formData.gradeThresholds.jayyid}
                    onChange={(e) => handleThresholdChange('jayyid', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-orange-600">Maqbul (Cukup)</Label>
                  <Input
                    type="number"
                    value={formData.gradeThresholds.maqbul}
                    onChange={(e) => handleThresholdChange('maqbul', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Di bawah ini dianggap Rasib (Kurang)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Opsi Tambahan */}
          <Card>
            <CardHeader>
              <CardTitle>Opsi Laporan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tampilkan Kehadiran</Label>
                  <p className="text-sm text-muted-foreground">Sertakan rekap kehadiran di rapor</p>
                </div>
                <Switch
                  checked={formData.includeAttendance}
                  onCheckedChange={(c) => setFormData(prev => prev ? ({ ...prev, includeAttendance: c }) : null)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Hitung Pelanggaran</Label>
                  <p className="text-sm text-muted-foreground">Poin pelanggaran mengurangi nilai Akhlak</p>
                </div>
                <Switch
                  checked={formData.includeViolations}
                  onCheckedChange={(c) => setFormData(prev => prev ? ({ ...prev, includeViolations: c }) : null)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Hitung Penghargaan</Label>
                  <p className="text-sm text-muted-foreground">Poin penghargaan menambah nilai Akhlak</p>
                </div>
                <Switch
                  checked={formData.includeRewards}
                  onCheckedChange={(c) => setFormData(prev => prev ? ({ ...prev, includeRewards: c }) : null)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
