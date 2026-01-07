'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout';
import { PageHeader } from '@/components/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Award, 
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  Upload,
  Download,
  ExternalLink,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Accreditation standards
const ACCREDITATION_STANDARDS = [
  { id: 'kurikulum', name: 'Standar Kurikulum', weight: 15 },
  { id: 'proses', name: 'Standar Proses', weight: 15 },
  { id: 'penilaian', name: 'Standar Penilaian', weight: 10 },
  { id: 'ptk', name: 'Standar PTK', weight: 15 },
  { id: 'sarana', name: 'Standar Sarana Prasarana', weight: 15 },
  { id: 'pengelolaan', name: 'Standar Pengelolaan', weight: 10 },
  { id: 'pembiayaan', name: 'Standar Pembiayaan', weight: 10 },
  { id: 'lulusan', name: 'Standar Kompetensi Lulusan', weight: 10 },
];

// Mock accreditation data per unit
const mockAccreditationData = [
  {
    unitId: 'pesantren',
    unitName: 'Pesantren Al-Hikmah',
    currentGrade: 'A',
    score: 92,
    validUntil: '2027-03-15',
    status: 'VALID',
    standards: [
      { id: 'kurikulum', score: 95, status: 'complete' },
      { id: 'proses', score: 90, status: 'complete' },
      { id: 'penilaian', score: 88, status: 'complete' },
      { id: 'ptk', score: 94, status: 'complete' },
      { id: 'sarana', score: 91, status: 'complete' },
      { id: 'pengelolaan', score: 93, status: 'complete' },
      { id: 'pembiayaan', score: 89, status: 'complete' },
      { id: 'lulusan', score: 96, status: 'complete' },
    ],
  },
  {
    unitId: 'sma',
    unitName: 'SMA Al-Quran',
    currentGrade: 'A',
    score: 88,
    validUntil: '2026-08-20',
    status: 'VALID',
    standards: [
      { id: 'kurikulum', score: 90, status: 'complete' },
      { id: 'proses', score: 85, status: 'complete' },
      { id: 'penilaian', score: 88, status: 'needs_update' },
      { id: 'ptk', score: 92, status: 'complete' },
      { id: 'sarana', score: 86, status: 'needs_update' },
      { id: 'pengelolaan', score: 89, status: 'complete' },
      { id: 'pembiayaan', score: 87, status: 'complete' },
      { id: 'lulusan', score: 90, status: 'complete' },
    ],
  },
  {
    unitId: 'smp',
    unitName: 'SMP IT Al-Hikmah',
    currentGrade: 'B',
    score: 78,
    validUntil: '2025-12-10',
    status: 'EXPIRING_SOON',
    standards: [
      { id: 'kurikulum', score: 80, status: 'needs_update' },
      { id: 'proses', score: 75, status: 'needs_update' },
      { id: 'penilaian', score: 78, status: 'needs_update' },
      { id: 'ptk', score: 82, status: 'complete' },
      { id: 'sarana', score: 72, status: 'needs_update' },
      { id: 'pengelolaan', score: 80, status: 'complete' },
      { id: 'pembiayaan', score: 78, status: 'complete' },
      { id: 'lulusan', score: 79, status: 'needs_update' },
    ],
  },
];

const getGradeBadge = (grade: string) => {
  const colors: Record<string, string> = {
    'A': 'bg-green-500',
    'B': 'bg-blue-500',
    'C': 'bg-yellow-500',
    'D': 'bg-red-500',
  };
  return <Badge className={colors[grade] || 'bg-gray-500'}>{grade}</Badge>;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'VALID':
      return <Badge className="bg-green-500">Valid</Badge>;
    case 'EXPIRING_SOON':
      return <Badge className="bg-amber-500">Segera Berakhir</Badge>;
    case 'EXPIRED':
      return <Badge variant="destructive">Kadaluarsa</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default function AccreditationReadinessPage() {
  const [selectedUnit, setSelectedUnit] = useState<string>('all');

  const filteredData = selectedUnit === 'all' 
    ? mockAccreditationData 
    : mockAccreditationData.filter(u => u.unitId === selectedUnit);

  const overallScore = Math.round(
    mockAccreditationData.reduce((sum, u) => sum + u.score, 0) / mockAccreditationData.length
  );

  return (
    <MainLayout allowedRoles={['SUPER_ADMIN', 'FOUNDATION_ADMIN', 'UNIT_ADMIN']}>
      <div className="space-y-6">
        <PageHeader
          title="Kesiapan Akreditasi"
          description="Status dan kelengkapan dokumen akreditasi seluruh unit"
          actions={
            <div className="flex gap-2">
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Semua Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Unit</SelectItem>
                  {mockAccreditationData.map((u) => (
                    <SelectItem key={u.unitId} value={u.unitId}>{u.unitName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Laporan
              </Button>
            </div>
          }
        />

        {/* Overall Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="md:col-span-2 bg-gradient-to-r from-primary/10 to-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Skor Rata-rata Yayasan</p>
                  <p className="text-4xl font-bold text-primary">{overallScore}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Dari {mockAccreditationData.length} unit pendidikan
                  </p>
                </div>
                <div className="p-4 bg-primary/20 rounded-full">
                  <Shield className="h-12 w-12 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Akreditasi A</p>
                  <p className="text-2xl font-bold">
                    {mockAccreditationData.filter(u => u.currentGrade === 'A').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Perlu Diperbaharui</p>
                  <p className="text-2xl font-bold">
                    {mockAccreditationData.filter(u => u.status === 'EXPIRING_SOON').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Unit Cards */}
        <div className="grid gap-6">
          {filteredData.map((unit) => (
            <Card key={unit.unitId}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {unit.unitName}
                        {getGradeBadge(unit.currentGrade)}
                      </CardTitle>
                      <CardDescription>
                        Valid sampai: {new Date(unit.validUntil).toLocaleDateString('id-ID')}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(unit.status)}
                    <div className="text-right">
                      <p className="text-3xl font-bold">{unit.score}</p>
                      <p className="text-xs text-muted-foreground">Skor Total</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  {unit.standards.map((std) => {
                    const stdInfo = ACCREDITATION_STANDARDS.find(s => s.id === std.id);
                    return (
                      <div
                        key={std.id}
                        className={cn(
                          'p-3 border rounded-lg',
                          std.status === 'complete' ? 'border-green-200 bg-green-50/50' : 'border-amber-200 bg-amber-50/50'
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{stdInfo?.name}</span>
                          {std.status === 'complete' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={std.score} className="h-2 flex-1" />
                          <span className="text-sm font-bold">{std.score}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Lihat Dokumen
                  </Button>
                  <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Dokumen
                  </Button>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Link SISPENA
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
