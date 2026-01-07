'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout';
import { PageHeader } from '@/components/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Settings, 
  Save,
  RotateCcw,
  BookOpen,
  Star,
  MessageSquare,
  Users,
  Award,
  Heart,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Rapor Pesantren component weights configuration
interface WeightConfig {
  id: string;
  name: string;
  nameAr: string;
  icon: React.ReactNode;
  weight: number;
  minWeight: number;
  maxWeight: number;
  description: string;
  subComponents?: { id: string; name: string; weight: number }[];
}

const DEFAULT_WEIGHTS: WeightConfig[] = [
  {
    id: 'tahfidz',
    name: 'Tahfidz Al-Quran',
    nameAr: 'تحفيظ القرآن',
    icon: <BookOpen className="h-5 w-5 text-green-600" />,
    weight: 25,
    minWeight: 10,
    maxWeight: 40,
    description: 'Hafalan Al-Quran meliputi simaan, murojaah, dan setoran harian',
    subComponents: [
      { id: 'simaan', name: 'Simaan', weight: 40 },
      { id: 'murojaah', name: 'Murojaah', weight: 30 },
      { id: 'setoran', name: 'Setoran Harian', weight: 30 },
    ],
  },
  {
    id: 'ibadah',
    name: 'Ibadah',
    nameAr: 'العبادة',
    icon: <Star className="h-5 w-5 text-amber-600" />,
    weight: 20,
    minWeight: 10,
    maxWeight: 30,
    description: 'Sholat 5 waktu, sholat sunnah, tilawah, dan dzikir',
    subComponents: [
      { id: 'sholatWajib', name: 'Sholat Wajib', weight: 50 },
      { id: 'sholatSunnah', name: 'Sholat Sunnah', weight: 25 },
      { id: 'tilawahDzikir', name: 'Tilawah & Dzikir', weight: 25 },
    ],
  },
  {
    id: 'muhadhoroh',
    name: 'Muhadhoroh',
    nameAr: 'المحاضرة',
    icon: <MessageSquare className="h-5 w-5 text-blue-600" />,
    weight: 15,
    minWeight: 5,
    maxWeight: 25,
    description: 'Kemampuan public speaking dan ceramah',
  },
  {
    id: 'muhadatsah',
    name: 'Muhadatsah',
    nameAr: 'المحادثة',
    icon: <Users className="h-5 w-5 text-purple-600" />,
    weight: 15,
    minWeight: 5,
    maxWeight: 25,
    description: 'Kemampuan percakapan bahasa Arab',
  },
  {
    id: 'kitabProgress',
    name: 'Kajian Kitab Kuning',
    nameAr: 'دراسة الكتب',
    icon: <Award className="h-5 w-5 text-indigo-600" />,
    weight: 15,
    minWeight: 5,
    maxWeight: 25,
    description: 'Kemajuan pembelajaran kitab klasik',
  },
  {
    id: 'akhlak',
    name: 'Akhlak & Perilaku',
    nameAr: 'الأخلاق',
    icon: <Heart className="h-5 w-5 text-rose-600" />,
    weight: 10,
    minWeight: 5,
    maxWeight: 20,
    description: 'Adab, pelanggaran, dan penghargaan',
  },
];

const GRADE_THRESHOLDS = [
  { grade: 'Mumtaz (A)', min: 90, color: 'bg-green-500' },
  { grade: 'Jayyid Jiddan (B)', min: 80, color: 'bg-blue-500' },
  { grade: 'Jayyid (C)', min: 70, color: 'bg-yellow-500' },
  { grade: 'Maqbul (D)', min: 60, color: 'bg-orange-500' },
  { grade: 'Rasib (E)', min: 0, color: 'bg-red-500' },
];

export default function RaporPesantrenConfigPage() {
  const [weights, setWeights] = useState<WeightConfig[]>(DEFAULT_WEIGHTS);
  const [showArabic, setShowArabic] = useState(true);
  const [usePassingGrade, setUsePassingGrade] = useState(true);
  const [passingGrade, setPassingGrade] = useState(60);
  const [hasChanges, setHasChanges] = useState(false);

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  const isValid = totalWeight === 100;

  const handleWeightChange = (id: string, newWeight: number) => {
    setWeights((prev) =>
      prev.map((w) => (w.id === id ? { ...w, weight: newWeight } : w))
    );
    setHasChanges(true);
  };

  const handleReset = () => {
    setWeights(DEFAULT_WEIGHTS);
    setHasChanges(false);
    toast.info('Bobot dikembalikan ke default');
  };

  const handleSave = () => {
    if (!isValid) {
      toast.error('Total bobot harus 100%');
      return;
    }
    // API call would go here
    toast.success('Konfigurasi berhasil disimpan');
    setHasChanges(false);
  };

  return (
    <MainLayout allowedRoles={['SUPER_ADMIN', 'UNIT_ADMIN']}>
      <div className="space-y-6">
        <PageHeader
          title="Konfigurasi Rapor Pesantren"
          description="Atur bobot penilaian untuk setiap komponen rapor"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button onClick={handleSave} disabled={!isValid || !hasChanges}>
                <Save className="mr-2 h-4 w-4" />
                Simpan
              </Button>
            </div>
          }
        />

        {/* Total Weight Indicator */}
        <Card className={cn(
          'transition-colors',
          isValid ? 'border-green-300 bg-green-50/50' : 'border-red-300 bg-red-50/50'
        )}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isValid ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-600" />
                )}
                <div>
                  <p className="font-medium">
                    Total Bobot: <span className={isValid ? 'text-green-600' : 'text-red-600'}>{totalWeight}%</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isValid ? 'Konfigurasi valid' : `Selisih ${Math.abs(100 - totalWeight)}% dari 100%`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label>Tampilkan Arab</Label>
                  <Switch checked={showArabic} onCheckedChange={setShowArabic} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weight Configuration */}
        <div className="grid gap-4">
          {weights.map((component) => (
            <Card key={component.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <div className="p-2 bg-muted rounded-lg">
                      {component.icon}
                    </div>
                    <div>
                      <p className="font-medium">{component.name}</p>
                      {showArabic && (
                        <p className="text-sm text-muted-foreground font-arabic">
                          {component.nameAr}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    <Slider
                      value={[component.weight]}
                      min={component.minWeight}
                      max={component.maxWeight}
                      step={1}
                      onValueChange={([value]) => handleWeightChange(component.id, value)}
                      className="flex-1"
                    />
                    <p className="text-xs text-muted-foreground">
                      {component.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-lg px-3 py-1 min-w-[60px] justify-center">
                      {component.weight}%
                    </Badge>
                  </div>
                </div>

                {/* Sub-components */}
                {component.subComponents && (
                  <div className="mt-4 ml-12 grid gap-2 md:grid-cols-3">
                    {component.subComponents.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">{sub.name}</span>
                        <Badge variant="secondary">{sub.weight}%</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Grade Thresholds */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Konfigurasi Predikat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <Switch
                checked={usePassingGrade}
                onCheckedChange={setUsePassingGrade}
              />
              <Label>Gunakan Passing Grade</Label>
              {usePassingGrade && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={passingGrade}
                    onChange={(e) => setPassingGrade(Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">Nilai minimum lulus</span>
                </div>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-5">
              {GRADE_THRESHOLDS.map((threshold) => (
                <div
                  key={threshold.grade}
                  className={cn(
                    'p-4 rounded-lg text-center',
                    threshold.color,
                    'text-white'
                  )}
                >
                  <p className="font-bold text-lg">{threshold.grade}</p>
                  <p className="text-sm opacity-90">
                    ≥ {threshold.min}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Catatan:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Perubahan konfigurasi akan berlaku untuk rapor yang baru dibuat</li>
                  <li>Rapor yang sudah terbit tidak akan terpengaruh</li>
                  <li>Sub-komponen memiliki bobot relatif terhadap komponen induk</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
