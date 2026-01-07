'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout';
import { PageHeader } from '@/components/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  Users, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Download,
  Settings,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useClasses } from '@/hooks/use-classes';
import { useAcademicYears } from '@/hooks/use-academic-years';
import { useAuthStore } from '@/stores/auth';

// Weight configuration for rapor components
const DEFAULT_WEIGHTS = {
  tahfidz: 25,
  ibadah: 20,
  muhadhoroh: 15,
  muhadatsah: 15,
  kitabProgress: 15,
  akhlak: 10,
};

interface GenerationProgress {
  total: number;
  completed: number;
  current: string;
  errors: string[];
}

export default function RaporPesantrenGeneratePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [semester, setSemester] = useState<string>('1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);

  const { data: classes } = useClasses({ unitId: user?.unitId });
  const { data: academicYears } = useAcademicYears();

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const isWeightValid = totalWeight === 100;

  const handleWeightChange = (key: keyof typeof weights, value: number) => {
    setWeights((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    if (!selectedClass || !selectedPeriod) {
      toast.error('Pilih kelas dan tahun ajaran');
      return;
    }

    if (!isWeightValid) {
      toast.error('Total bobot harus 100%');
      return;
    }

    setIsGenerating(true);
    setProgress({ total: 0, completed: 0, current: 'Mempersiapkan...', errors: [] });

    try {
      // Simulate generation process
      const response = await fetch('/api/rapor-pesantren/generate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClass,
          academicYearId: selectedPeriod,
          semester: parseInt(semester),
          weights,
        }),
      });

      if (!response.ok) throw new Error('Gagal generate rapor');

      const result = await response.json();
      
      setProgress({
        total: result.total,
        completed: result.successful,
        current: 'Selesai',
        errors: result.errors || [],
      });

      toast.success(`${result.successful} rapor berhasil di-generate`);
    } catch (error) {
      toast.error('Gagal generate rapor');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <MainLayout allowedRoles={['SUPER_ADMIN', 'UNIT_ADMIN', 'TEACHER']}>
      <div className="space-y-6">
        <PageHeader
          title="Generate Rapor Pesantren"
          description="Buat rapor pesantren untuk seluruh santri dalam satu kelas"
          actions={
            <Button variant="outline" onClick={() => router.push('/rapor-pesantren')}>
              Lihat Daftar Rapor
            </Button>
          }
        />

        <Tabs defaultValue="generate" className="space-y-4">
          <TabsList>
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Konfigurasi Bobot
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Selection Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Pilih Kelas
                  </CardTitle>
                  <CardDescription>
                    Pilih kelas dan periode untuk generate rapor
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Kelas</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kelas" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes?.data?.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tahun Ajaran</Label>
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tahun ajaran" />
                      </SelectTrigger>
                      <SelectContent>
                        {academicYears?.data?.map((year) => (
                          <SelectItem key={year.id} value={year.id}>
                            {year.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Select value={semester} onValueChange={setSemester}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Semester 1 (Ganjil)</SelectItem>
                        <SelectItem value="2">Semester 2 (Genap)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    className="w-full mt-4"
                    onClick={handleGenerate}
                    disabled={isGenerating || !selectedClass || !selectedPeriod}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Rapor
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Progress Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Progress
                  </CardTitle>
                  <CardDescription>Status generate rapor</CardDescription>
                </CardHeader>
                <CardContent>
                  {progress ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{progress.current}</span>
                          <span>
                            {progress.completed}/{progress.total}
                          </span>
                        </div>
                        <Progress
                          value={
                            progress.total > 0
                              ? (progress.completed / progress.total) * 100
                              : 0
                          }
                        />
                      </div>

                      {progress.completed > 0 && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="h-5 w-5" />
                          <span>{progress.completed} rapor berhasil</span>
                        </div>
                      )}

                      {progress.errors.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            <span>{progress.errors.length} error</span>
                          </div>
                          <div className="text-sm text-muted-foreground max-h-32 overflow-auto">
                            {progress.errors.map((err, i) => (
                              <p key={i}>{err}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {!isGenerating && progress.completed > 0 && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => router.push('/rapor-pesantren')}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Lihat Hasil
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Pilih kelas dan klik Generate untuk memulai</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle>Konfigurasi Bobot Nilai</CardTitle>
                <CardDescription>
                  Atur bobot untuk setiap komponen rapor. Total harus 100%.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    { key: 'tahfidz', label: 'Tahfidz', icon: '📖' },
                    { key: 'ibadah', label: 'Ibadah', icon: '🕌' },
                    { key: 'muhadhoroh', label: 'Muhadhoroh', icon: '🎤' },
                    { key: 'muhadatsah', label: 'Muhadatsah', icon: '💬' },
                    { key: 'kitabProgress', label: 'Kitab Kuning', icon: '📚' },
                    { key: 'akhlak', label: 'Akhlak', icon: '⭐' },
                  ].map((item) => (
                    <div key={item.key} className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <span>{item.icon}</span>
                        {item.label}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={weights[item.key as keyof typeof weights]}
                          onChange={(e) =>
                            handleWeightChange(
                              item.key as keyof typeof weights,
                              parseInt(e.target.value) || 0
                            )
                          }
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between p-4 border rounded-lg">
                  <span className="font-medium">Total Bobot:</span>
                  <Badge variant={isWeightValid ? 'default' : 'destructive'}>
                    {totalWeight}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
