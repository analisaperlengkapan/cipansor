'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout';
import { PageHeader } from '@/components/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Lightbulb, 
  Plus,
  FileText,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Target,
  Presentation,
  Upload,
  Edit,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// P5 (Profil Pelajar Pancasila) dimensions + Islamic values
const CHARACTER_DIMENSIONS = [
  { id: 'beriman', name: 'Beriman, Bertakwa kepada Tuhan YME', icon: '🕌', weight: 20 },
  { id: 'berkebhinekaan', name: 'Berkebinekaan Global', icon: '🌍', weight: 15 },
  { id: 'gotong-royong', name: 'Bergotong Royong', icon: '🤝', weight: 15 },
  { id: 'mandiri', name: 'Mandiri', icon: '🎯', weight: 15 },
  { id: 'bernalar-kritis', name: 'Bernalar Kritis', icon: '🧠', weight: 20 },
  { id: 'kreatif', name: 'Kreatif', icon: '💡', weight: 15 },
];

// Mock projects data
const mockProjects = [
  {
    id: 'project-1',
    title: 'Kampanye Hemat Air',
    tema: 'Gaya Hidup Berkelanjutan',
    status: 'IN_PROGRESS',
    startDate: '2026-01-06',
    endDate: '2026-02-15',
    progress: 45,
    members: ['Muhammad Hasan', 'Fatimah Azzahra', 'Ahmad Fadlan'],
    dimensions: ['beriman', 'gotong-royong', 'kreatif'],
    description: 'Membuat poster dan video kampanye hemat air di lingkungan sekolah',
  },
  {
    id: 'project-2',
    title: 'Kewirausahaan Islami',
    tema: 'Kewirausahaan',
    status: 'COMPLETED',
    startDate: '2025-10-01',
    endDate: '2025-12-15',
    progress: 100,
    members: ['Muhammad Hasan', 'Umar Faruq'],
    dimensions: ['mandiri', 'bernalar-kritis', 'kreatif'],
    description: 'Membuat produk makanan ringan halal dan menjualnya di kantin sekolah',
    score: 88,
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'NOT_STARTED':
      return <Badge variant="outline">Belum Dimulai</Badge>;
    case 'IN_PROGRESS':
      return <Badge className="bg-blue-500">Sedang Berjalan</Badge>;
    case 'COMPLETED':
      return <Badge className="bg-green-500">Selesai</Badge>;
    case 'PRESENTED':
      return <Badge className="bg-purple-500">Sudah Presentasi</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default function ProjectBasedLearningPage() {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <MainLayout allowedRoles={['STUDENT', 'TEACHER', 'SUPER_ADMIN', 'UNIT_ADMIN', 'PARENT']}>
      <div className="space-y-6">
        <PageHeader
          title="Proyek P5 & Kurikulum Merdeka"
          description="Pembelajaran berbasis proyek dengan Profil Pelajar Pancasila"
          actions={
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Proyek Baru
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Buat Proyek Baru</DialogTitle>
                  <DialogDescription>
                    Tambahkan proyek pembelajaran berbasis P5
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Judul Proyek</label>
                      <Input placeholder="Contoh: Kampanye Hemat Energi" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tema</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tema" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gaya-hidup">Gaya Hidup Berkelanjutan</SelectItem>
                          <SelectItem value="kearifan-lokal">Kearifan Lokal</SelectItem>
                          <SelectItem value="bhinneka">Bhinneka Tunggal Ika</SelectItem>
                          <SelectItem value="bangunlah-jiwa">Bangunlah Jiwa dan Raganya</SelectItem>
                          <SelectItem value="suara-demokrasi">Suara Demokrasi</SelectItem>
                          <SelectItem value="kewirausahaan">Kewirausahaan</SelectItem>
                          <SelectItem value="rekayasa-teknologi">Rekayasa dan Teknologi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Deskripsi</label>
                    <Textarea placeholder="Jelaskan tujuan dan langkah-langkah proyek..." />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tanggal Mulai</label>
                      <Input type="date" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tanggal Selesai</label>
                      <Input type="date" />
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => { setIsCreateOpen(false); toast.success('Proyek berhasil dibuat'); }}>
                    Buat Proyek
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          }
        />

        {/* P5 Dimensions Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Dimensi Profil Pelajar Pancasila
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {CHARACTER_DIMENSIONS.map((dim) => (
                <div
                  key={dim.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span className="text-2xl">{dim.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{dim.name}</p>
                    <p className="text-xs text-muted-foreground">Bobot: {dim.weight}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Projects */}
        <div className="grid gap-6">
          {mockProjects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-amber-500" />
                      {project.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Tema: {project.tema}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(project.status)}
                    {project.score && (
                      <Badge variant="outline" className="font-bold">
                        Nilai: {project.score}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{project.description}</p>
                
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{project.startDate} - {project.endDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{project.members.length} anggota</span>
                  </div>
                </div>

                {project.status !== 'COMPLETED' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} />
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {project.dimensions.map((dimId) => {
                    const dim = CHARACTER_DIMENSIONS.find((d) => d.id === dimId);
                    return dim ? (
                      <Badge key={dimId} variant="secondary">
                        {dim.icon} {dim.name.split(' ')[0]}
                      </Badge>
                    ) : null;
                  })}
                </div>

                <div className="flex gap-2 pt-2">
                  {project.status !== 'COMPLETED' && (
                    <>
                      <Button variant="outline" size="sm">
                        <Edit className="mr-1 h-4 w-4" />
                        Update Progress
                      </Button>
                      <Button variant="outline" size="sm">
                        <Upload className="mr-1 h-4 w-4" />
                        Upload Bukti
                      </Button>
                    </>
                  )}
                  <Button variant="outline" size="sm">
                    <FileText className="mr-1 h-4 w-4" />
                    Lihat Detail
                  </Button>
                  {project.status === 'COMPLETED' && (
                    <Button variant="outline" size="sm">
                      <Presentation className="mr-1 h-4 w-4" />
                      Lihat Presentasi
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
