'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Layers,
  Target,
  Leaf,
  Plus,
  Search,
  Trash2,
  Eye,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';

import { MainLayout } from '@/components/layout/main-layout';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import { useUnits } from '@/hooks/use-units';
import { useAcademicYears } from '@/hooks/use-academic-years';
import {
  useLearningPhases,
  useLearningOutcomes,
  useP5Projects,
  useCreateLearningPhase,
  useCreateLearningOutcome,
  useCreateP5Project,
  useDeleteLearningPhase,
  useDeleteLearningOutcome,
  useDeleteP5Project,
  LearningPhase,
  LearningOutcome,
  P5Project,
  P5_THEMES,
  P5Theme,
} from '@/hooks/use-kurikulum-merdeka';

export default function KurikulumMerdekaPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('phases');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter states
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Form states
  const [phaseForm, setPhaseForm] = useState({
    code: '',
    name: '',
    description: '',
    startGrade: 1,
    endGrade: 2,
  });
  
  const [outcomeForm, setOutcomeForm] = useState({
    phaseId: '',
    code: '',
    subject: '',
    domain: '',
    description: '',
  });
  
  const [projectForm, setProjectForm] = useState({
    academicYearId: '',
    unitId: '',
    theme: '' as P5Theme | '',
    title: '',
    description: '',
    duration: 4,
    startDate: '',
    endDate: '',
  });
  
  // Data hooks
  const { data: units } = useUnits();
  const { data: academicYears } = useAcademicYears();
  const { data: phases, isLoading: loadingPhases } = useLearningPhases();
  const { data: outcomes, isLoading: loadingOutcomes } = useLearningOutcomes({
    phaseId: selectedPhase || undefined,
    search: searchQuery,
  });
  const { data: projects, isLoading: loadingProjects } = useP5Projects({
    unitId: selectedUnit || undefined,
    theme: selectedTheme as P5Theme || undefined,
  });
  
  // Mutations
  const createPhase = useCreateLearningPhase();
  const createOutcome = useCreateLearningOutcome();
  const createProject = useCreateP5Project();
  const deletePhase = useDeleteLearningPhase();
  const deleteOutcome = useDeleteLearningOutcome();
  const deleteProject = useDeleteP5Project();
  
  // Phase columns
  const phaseColumns: ColumnDef<LearningPhase>[] = [
    {
      accessorKey: 'code',
      header: 'Kode',
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue('code')}</Badge>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Nama Fase',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      id: 'grades',
      header: 'Jenjang Kelas',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          Kelas {row.original.startGrade} - {row.original.endGrade}
        </span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Deskripsi',
      cell: ({ row }) => (
        <span className="text-muted-foreground line-clamp-1">
          {row.getValue('description') || '-'}
        </span>
      ),
    },
    {
      id: 'outcomes',
      header: 'Capaian Pembelajaran',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original._count?.learningOutcomes || 0} CP
        </span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.getValue('isActive') ? 'default' : 'secondary'}>
          {row.getValue('isActive') ? 'Aktif' : 'Nonaktif'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedPhase(row.original.id);
              setActiveTab('outcomes');
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteId(row.original.id)}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
  
  // Outcome columns
  const outcomeColumns: ColumnDef<LearningOutcome>[] = [
    {
      accessorKey: 'code',
      header: 'Kode',
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue('code')}</Badge>
      ),
    },
    {
      accessorKey: 'subject',
      header: 'Mata Pelajaran',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('subject')}</div>
      ),
    },
    {
      accessorKey: 'domain',
      header: 'Domain',
      cell: ({ row }) => (
        <Badge variant="secondary">{row.getValue('domain')}</Badge>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Deskripsi CP',
      cell: ({ row }) => (
        <span className="text-muted-foreground line-clamp-2">
          {row.getValue('description')}
        </span>
      ),
    },
    {
      id: 'phase',
      header: 'Fase',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.phase?.name || '-'}</Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDeleteId(row.original.id)}
          className="text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];
  
  // Project columns
  const projectColumns: ColumnDef<P5Project>[] = [
    {
      accessorKey: 'title',
      header: 'Judul Proyek',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('title')}</div>
      ),
    },
    {
      accessorKey: 'theme',
      header: 'Tema',
      cell: ({ row }) => {
        const theme = row.getValue('theme') as P5Theme;
        const themeLabel = P5_THEMES.find(t => t.value === theme)?.label || theme;
        return <Badge variant="secondary">{themeLabel}</Badge>;
      },
    },
    {
      id: 'unit',
      header: 'Unit',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.unit?.name || '-'}
        </span>
      ),
    },
    {
      id: 'period',
      header: 'Periode',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.duration ? `${row.original.duration} minggu` : '-'}
        </span>
      ),
    },
    {
      id: 'assessments',
      header: 'Penilaian',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original._count?.assessments || 0} siswa
        </span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.getValue('isActive') ? 'default' : 'secondary'}>
          {row.getValue('isActive') ? 'Aktif' : 'Selesai'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/curriculum/merdeka/p5/${row.original.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteId(row.original.id)}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
  
  const handleAdd = async () => {
    try {
      if (activeTab === 'phases') {
        await createPhase.mutateAsync({
          code: phaseForm.code,
          name: phaseForm.name,
          description: phaseForm.description || undefined,
          startGrade: phaseForm.startGrade,
          endGrade: phaseForm.endGrade,
        });
        toast.success('Fase berhasil ditambahkan');
        setPhaseForm({ code: '', name: '', description: '', startGrade: 1, endGrade: 2 });
      } else if (activeTab === 'outcomes') {
        if (!outcomeForm.phaseId) {
          toast.error('Pilih fase terlebih dahulu');
          return;
        }
        await createOutcome.mutateAsync({
          phaseId: outcomeForm.phaseId,
          code: outcomeForm.code,
          subject: outcomeForm.subject,
          domain: outcomeForm.domain,
          description: outcomeForm.description,
        });
        toast.success('Capaian Pembelajaran berhasil ditambahkan');
        setOutcomeForm({ phaseId: '', code: '', subject: '', domain: '', description: '' });
      } else if (activeTab === 'p5') {
        if (!projectForm.academicYearId || !projectForm.unitId || !projectForm.theme) {
          toast.error('Lengkapi semua field yang diperlukan');
          return;
        }
        await createProject.mutateAsync({
          academicYearId: projectForm.academicYearId,
          unitId: projectForm.unitId,
          theme: projectForm.theme as P5Theme,
          title: projectForm.title,
          description: projectForm.description || undefined,
          duration: projectForm.duration || undefined,
          startDate: projectForm.startDate || undefined,
          endDate: projectForm.endDate || undefined,
        });
        toast.success('Proyek P5 berhasil ditambahkan');
        setProjectForm({ academicYearId: '', unitId: '', theme: '', title: '', description: '', duration: 4, startDate: '', endDate: '' });
      }
      setIsAddDialogOpen(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menambahkan data';
      toast.error(errorMessage);
    }
  };
  
  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      if (activeTab === 'phases') {
        await deletePhase.mutateAsync(deleteId);
        toast.success('Fase berhasil dihapus');
      } else if (activeTab === 'outcomes') {
        await deleteOutcome.mutateAsync(deleteId);
        toast.success('Capaian Pembelajaran berhasil dihapus');
      } else if (activeTab === 'p5') {
        await deleteProject.mutateAsync(deleteId);
        toast.success('Proyek P5 berhasil dihapus');
      }
      setDeleteId(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus data';
      toast.error(errorMessage);
    }
  };
  
  const getTabLabel = () => {
    switch (activeTab) {
      case 'phases': return 'Fase';
      case 'outcomes': return 'Capaian Pembelajaran';
      case 'p5': return 'Proyek P5';
      default: return '';
    }
  };
  
  const stats = [
    {
      title: 'Fase Pembelajaran',
      value: phases?.length || 0,
      icon: Layers,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Capaian Pembelajaran',
      value: outcomes?.length || 0,
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Proyek P5',
      value: projects?.length || 0,
      icon: Leaf,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Proyek Aktif',
      value: projects?.filter(p => p.isActive).length || 0,
      icon: BookOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="Kurikulum Merdeka"
        description="Kelola Capaian Pembelajaran (CP) dan Projek Penguatan Profil Pelajar Pancasila (P5)"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Kurikulum', href: '/curriculum' },
          { label: 'Kurikulum Merdeka' },
        ]}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Data Kurikulum Merdeka</CardTitle>
              <CardDescription>
                Kelola fase, capaian pembelajaran, dan proyek P5
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari..."
                  className="pl-10 w-[150px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah {getTabLabel()}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Tambah {getTabLabel()}</DialogTitle>
                    <DialogDescription>
                      Masukkan data {getTabLabel().toLowerCase()} baru
                    </DialogDescription>
                  </DialogHeader>
                  
                  {activeTab === 'phases' && (
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="phase-code">Kode Fase *</Label>
                        <Input
                          id="phase-code"
                          placeholder="FASE_A"
                          value={phaseForm.code}
                          onChange={(e) => setPhaseForm({ ...phaseForm, code: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="phase-name">Nama Fase *</Label>
                        <Input
                          id="phase-name"
                          placeholder="Fase A (PAUD - Kelas 2 SD)"
                          value={phaseForm.name}
                          onChange={(e) => setPhaseForm({ ...phaseForm, name: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="phase-start">Kelas Awal</Label>
                          <Input
                            id="phase-start"
                            type="number"
                            min="1"
                            max="12"
                            value={phaseForm.startGrade}
                            onChange={(e) => setPhaseForm({ ...phaseForm, startGrade: Number(e.target.value) })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="phase-end">Kelas Akhir</Label>
                          <Input
                            id="phase-end"
                            type="number"
                            min="1"
                            max="12"
                            value={phaseForm.endGrade}
                            onChange={(e) => setPhaseForm({ ...phaseForm, endGrade: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="phase-desc">Deskripsi</Label>
                        <Textarea
                          id="phase-desc"
                          placeholder="Deskripsi fase pembelajaran"
                          value={phaseForm.description}
                          onChange={(e) => setPhaseForm({ ...phaseForm, description: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'outcomes' && (
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>Fase *</Label>
                        <Select value={outcomeForm.phaseId} onValueChange={(val) => setOutcomeForm({ ...outcomeForm, phaseId: val })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih fase" />
                          </SelectTrigger>
                          <SelectContent>
                            {phases?.map((phase) => (
                              <SelectItem key={phase.id} value={phase.id}>
                                {phase.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="outcome-code">Kode CP *</Label>
                        <Input
                          id="outcome-code"
                          placeholder="IND.A.1"
                          value={outcomeForm.code}
                          onChange={(e) => setOutcomeForm({ ...outcomeForm, code: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="outcome-subject">Mata Pelajaran *</Label>
                        <Input
                          id="outcome-subject"
                          placeholder="Bahasa Indonesia"
                          value={outcomeForm.subject}
                          onChange={(e) => setOutcomeForm({ ...outcomeForm, subject: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="outcome-domain">Domain/Elemen *</Label>
                        <Input
                          id="outcome-domain"
                          placeholder="Menyimak"
                          value={outcomeForm.domain}
                          onChange={(e) => setOutcomeForm({ ...outcomeForm, domain: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="outcome-desc">Deskripsi CP *</Label>
                        <Textarea
                          id="outcome-desc"
                          placeholder="Deskripsi capaian pembelajaran"
                          value={outcomeForm.description}
                          onChange={(e) => setOutcomeForm({ ...outcomeForm, description: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'p5' && (
                    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                      <div className="grid gap-2">
                        <Label>Tahun Ajaran *</Label>
                        <Select value={projectForm.academicYearId} onValueChange={(val) => setProjectForm({ ...projectForm, academicYearId: val })}>
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
                      <div className="grid gap-2">
                        <Label>Unit *</Label>
                        <Select value={projectForm.unitId} onValueChange={(val) => setProjectForm({ ...projectForm, unitId: val })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {units?.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Tema P5 *</Label>
                        <Select value={projectForm.theme} onValueChange={(val: P5Theme) => setProjectForm({ ...projectForm, theme: val })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tema" />
                          </SelectTrigger>
                          <SelectContent>
                            {P5_THEMES.map((theme) => (
                              <SelectItem key={theme.value} value={theme.value}>
                                {theme.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="project-title">Judul Proyek *</Label>
                        <Input
                          id="project-title"
                          placeholder="Judul proyek P5"
                          value={projectForm.title}
                          onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="project-desc">Deskripsi</Label>
                        <Textarea
                          id="project-desc"
                          placeholder="Deskripsi proyek"
                          value={projectForm.description}
                          onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="project-duration">Durasi (minggu)</Label>
                        <Input
                          id="project-duration"
                          type="number"
                          min="1"
                          value={projectForm.duration}
                          onChange={(e) => setProjectForm({ ...projectForm, duration: Number(e.target.value) })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="project-start">Tanggal Mulai</Label>
                          <Input
                            id="project-start"
                            type="date"
                            value={projectForm.startDate}
                            onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="project-end">Tanggal Selesai</Label>
                          <Input
                            id="project-end"
                            type="date"
                            value={projectForm.endDate}
                            onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button 
                      onClick={handleAdd}
                      disabled={createPhase.isPending || createOutcome.isPending || createProject.isPending}
                    >
                      {(createPhase.isPending || createOutcome.isPending || createProject.isPending) ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="phases" className="gap-2">
                <Layers className="h-4 w-4" />
                Fase Pembelajaran
              </TabsTrigger>
              <TabsTrigger value="outcomes" className="gap-2">
                <Target className="h-4 w-4" />
                Capaian Pembelajaran
              </TabsTrigger>
              <TabsTrigger value="p5" className="gap-2">
                <Leaf className="h-4 w-4" />
                Proyek P5
              </TabsTrigger>
            </TabsList>
            
            {/* Filter Bar */}
            {activeTab === 'outcomes' && (
              <div className="mb-4 flex gap-2">
                <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by Fase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Fase</SelectItem>
                    {phases?.map((phase) => (
                      <SelectItem key={phase.id} value={phase.id}>
                        {phase.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPhase && (
                  <Button variant="outline" onClick={() => setSelectedPhase('')}>
                    Reset Filter
                  </Button>
                )}
              </div>
            )}
            
            {activeTab === 'p5' && (
              <div className="mb-4 flex gap-2">
                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Unit</SelectItem>
                    {units?.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter Tema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Tema</SelectItem>
                    {P5_THEMES.map((theme) => (
                      <SelectItem key={theme.value} value={theme.value}>
                        {theme.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(selectedUnit || selectedTheme) && (
                  <Button variant="outline" onClick={() => {
                    setSelectedUnit('');
                    setSelectedTheme('');
                  }}>
                    Reset Filter
                  </Button>
                )}
              </div>
            )}
            
            <TabsContent value="phases">
              <DataTable
                columns={phaseColumns}
                data={phases || []}
                isLoading={loadingPhases}
              />
            </TabsContent>
            
            <TabsContent value="outcomes">
              <DataTable
                columns={outcomeColumns}
                data={outcomes || []}
                isLoading={loadingOutcomes}
              />
            </TabsContent>
            
            <TabsContent value="p5">
              <DataTable
                columns={projectColumns}
                data={projects || []}
                isLoading={loadingProjects}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={`Hapus ${getTabLabel()}`}
        description={`Apakah Anda yakin ingin menghapus ${getTabLabel().toLowerCase()} ini?`}
        onConfirm={handleDelete}
        isLoading={deletePhase.isPending || deleteOutcome.isPending || deleteProject.isPending}
      />
    </MainLayout>
  );
}
