'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus,
  Search,
  Filter,
  Award,
  AlertTriangle,
  MessageCircle,
  CheckCircle,
  Clock,
  User,
  Edit,
  Trash2,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// Types
type NoteType = 'POSITIVE' | 'NEGATIVE' | 'ACHIEVEMENT' | 'VIOLATION' | 'COUNSELING_NEEDED' | 'PARENT_CONTACTED';

interface BehaviorNote {
  id: string;
  studentId: string;
  studentName: string;
  studentNis: string;
  type: NoteType;
  category: string;
  description: string;
  date: string;
  points?: number;
  followUp?: string;
  resolved: boolean;
  resolvedDate?: string;
  createdBy: string;
}

// Demo data
const DEMO_NOTES: BehaviorNote[] = [
  {
    id: 'bn1',
    studentId: 's3',
    studentName: 'Muhammad Rizki',
    studentNis: '2024003',
    type: 'ACHIEVEMENT',
    category: 'Akademik',
    description: 'Juara 1 Olimpiade Matematika Tingkat Kota',
    date: '2024-01-20',
    points: 50,
    resolved: true,
    createdBy: 'Ustadzah Fatimah',
  },
  {
    id: 'bn2',
    studentId: 's4',
    studentName: 'Zahra Amelia',
    studentNis: '2024004',
    type: 'ACHIEVEMENT',
    category: 'Tahfidz',
    description: 'Selesai hafalan Juz 30 dengan nilai Mumtaz',
    date: '2024-01-18',
    points: 100,
    resolved: true,
    createdBy: 'Ustadz Ahmad',
  },
  {
    id: 'bn3',
    studentId: 's5',
    studentName: 'Dimas Pratama',
    studentNis: '2024005',
    type: 'VIOLATION',
    category: 'Kedisiplinan',
    description: 'Terlambat masuk kelas 3 kali dalam 1 minggu',
    date: '2024-01-22',
    points: -10,
    followUp: 'Perlu pembinaan dan koordinasi dengan orang tua',
    resolved: false,
    createdBy: 'Ustadzah Fatimah',
  },
  {
    id: 'bn4',
    studentId: 's7',
    studentName: 'Farel Aditya',
    studentNis: '2024007',
    type: 'NEGATIVE',
    category: 'Akademik',
    description: 'Tidak mengerjakan PR Matematika',
    date: '2024-01-19',
    points: -5,
    resolved: true,
    resolvedDate: '2024-01-20',
    createdBy: 'Ustadz Budi',
  },
  {
    id: 'bn5',
    studentId: 's1',
    studentName: 'Ahmad Fauzan',
    studentNis: '2024001',
    type: 'POSITIVE',
    category: 'Perilaku',
    description: 'Membantu teman yang kesulitan belajar',
    date: '2024-01-15',
    points: 10,
    resolved: true,
    createdBy: 'Ustadzah Fatimah',
  },
  {
    id: 'bn6',
    studentId: 's2',
    studentName: 'Aisyah Putri',
    studentNis: '2024002',
    type: 'COUNSELING_NEEDED',
    category: 'Personal',
    description: 'Terlihat murung dan kurang bersemangat beberapa hari terakhir',
    date: '2024-01-21',
    followUp: 'Perlu konseling dengan BK',
    resolved: false,
    createdBy: 'Ustadzah Fatimah',
  },
];

const NOTE_TYPE_CONFIG: Record<NoteType, { label: string; color: string; icon: React.ReactNode }> = {
  POSITIVE: { label: 'Positif', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" /> },
  NEGATIVE: { label: 'Negatif', color: 'bg-orange-100 text-orange-800', icon: <AlertTriangle className="h-4 w-4" /> },
  ACHIEVEMENT: { label: 'Prestasi', color: 'bg-yellow-100 text-yellow-800', icon: <Award className="h-4 w-4" /> },
  VIOLATION: { label: 'Pelanggaran', color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="h-4 w-4" /> },
  COUNSELING_NEEDED: { label: 'Perlu BK', color: 'bg-purple-100 text-purple-800', icon: <MessageCircle className="h-4 w-4" /> },
  PARENT_CONTACTED: { label: 'Wali Dihubungi', color: 'bg-blue-100 text-blue-800', icon: <User className="h-4 w-4" /> },
};

const CATEGORIES = [
  'Akademik',
  'Tahfidz',
  'Kedisiplinan',
  'Perilaku',
  'Sosial',
  'Personal',
  'Ekstrakurikuler',
  'Lainnya',
];

const STUDENTS = [
  { id: 's1', nis: '2024001', name: 'Ahmad Fauzan' },
  { id: 's2', nis: '2024002', name: 'Aisyah Putri' },
  { id: 's3', nis: '2024003', name: 'Muhammad Rizki' },
  { id: 's4', nis: '2024004', name: 'Zahra Amelia' },
  { id: 's5', nis: '2024005', name: 'Dimas Pratama' },
  { id: 's6', nis: '2024006', name: 'Nur Hidayah' },
  { id: 's7', nis: '2024007', name: 'Farel Aditya' },
  { id: 's8', nis: '2024008', name: 'Siti Rahmawati' },
];

export default function BehaviorNotesPage() {
  const [notes, setNotes] = useState<BehaviorNote[]>(DEMO_NOTES);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterResolved, setFilterResolved] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // New note form state
  const [newNote, setNewNote] = useState({
    studentId: '',
    type: 'POSITIVE' as NoteType,
    category: '',
    description: '',
    points: '',
    followUp: '',
  });

  const filteredNotes = notes.filter(note => {
    const matchesSearch = 
      note.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || note.type === filterType;
    const matchesResolved = 
      filterResolved === 'all' || 
      (filterResolved === 'resolved' && note.resolved) ||
      (filterResolved === 'pending' && !note.resolved);

    const matchesTab = 
      activeTab === 'all' ||
      (activeTab === 'positive' && ['POSITIVE', 'ACHIEVEMENT'].includes(note.type)) ||
      (activeTab === 'negative' && ['NEGATIVE', 'VIOLATION'].includes(note.type)) ||
      (activeTab === 'followup' && ['COUNSELING_NEEDED', 'PARENT_CONTACTED'].includes(note.type));

    return matchesSearch && matchesType && matchesResolved && matchesTab;
  });

  const handleAddNote = () => {
    if (!newNote.studentId || !newNote.category || !newNote.description) {
      toast.error('Lengkapi data yang diperlukan');
      return;
    }

    const student = STUDENTS.find(s => s.id === newNote.studentId);
    if (!student) return;

    const note: BehaviorNote = {
      id: `bn${Date.now()}`,
      studentId: newNote.studentId,
      studentName: student.name,
      studentNis: student.nis,
      type: newNote.type,
      category: newNote.category,
      description: newNote.description,
      date: new Date().toISOString().split('T')[0],
      points: newNote.points ? parseInt(newNote.points) : undefined,
      followUp: newNote.followUp || undefined,
      resolved: ['POSITIVE', 'ACHIEVEMENT'].includes(newNote.type),
      createdBy: 'Ustadzah Fatimah',
    };

    setNotes(prev => [note, ...prev]);
    setIsAddDialogOpen(false);
    setNewNote({
      studentId: '',
      type: 'POSITIVE',
      category: '',
      description: '',
      points: '',
      followUp: '',
    });
    toast.success('Catatan berhasil ditambahkan');
  };

  const handleResolve = (noteId: string) => {
    setNotes(prev => prev.map(n => 
      n.id === noteId 
        ? { ...n, resolved: true, resolvedDate: new Date().toISOString().split('T')[0] }
        : n
    ));
    toast.success('Catatan ditandai selesai');
  };

  const handleDelete = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    toast.success('Catatan dihapus');
  };

  const getSummary = () => ({
    total: notes.length,
    positive: notes.filter(n => ['POSITIVE', 'ACHIEVEMENT'].includes(n.type)).length,
    negative: notes.filter(n => ['NEGATIVE', 'VIOLATION'].includes(n.type)).length,
    pending: notes.filter(n => !n.resolved).length,
  });

  const summary = getSummary();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/homeroom">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Catatan Perilaku Siswa</h1>
          <p className="text-muted-foreground">Kelas VII-A - SMP IT Al-Ikhlas</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Catatan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah Catatan Perilaku</DialogTitle>
              <DialogDescription>
                Catat prestasi, pelanggaran, atau catatan penting siswa
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Siswa</Label>
                <Select
                  value={newNote.studentId}
                  onValueChange={(value) => setNewNote({ ...newNote, studentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih siswa" />
                  </SelectTrigger>
                  <SelectContent>
                    {STUDENTS.map(student => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.nis} - {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Jenis Catatan</Label>
                <Select
                  value={newNote.type}
                  onValueChange={(value) => setNewNote({ ...newNote, type: value as NoteType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(NOTE_TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {config.icon}
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={newNote.category}
                  onValueChange={(value) => setNewNote({ ...newNote, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea
                  placeholder="Jelaskan detail catatan..."
                  value={newNote.description}
                  onChange={(e) => setNewNote({ ...newNote, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Poin (opsional)</Label>
                  <Input
                    type="number"
                    placeholder="Contoh: 10 atau -5"
                    value={newNote.points}
                    onChange={(e) => setNewNote({ ...newNote, points: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tindak Lanjut (opsional)</Label>
                <Textarea
                  placeholder="Rencana tindak lanjut..."
                  value={newNote.followUp}
                  onChange={(e) => setNewNote({ ...newNote, followUp: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleAddNote}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.total}</p>
                <p className="text-sm text-muted-foreground">Total Catatan</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
                <Award className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.positive}</p>
                <p className="text-sm text-muted-foreground">Positif/Prestasi</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.negative}</p>
                <p className="text-sm text-muted-foreground">Negatif/Pelanggaran</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.pending}</p>
                <p className="text-sm text-muted-foreground">Perlu Tindak Lanjut</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama siswa atau deskripsi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-[180px]">
              <Label className="text-xs">Status</Label>
              <Select value={filterResolved} onValueChange={setFilterResolved}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="pending">Belum Selesai</SelectItem>
                  <SelectItem value="resolved">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Semua ({notes.length})</TabsTrigger>
          <TabsTrigger value="positive">Positif ({notes.filter(n => ['POSITIVE', 'ACHIEVEMENT'].includes(n.type)).length})</TabsTrigger>
          <TabsTrigger value="negative">Negatif ({notes.filter(n => ['NEGATIVE', 'VIOLATION'].includes(n.type)).length})</TabsTrigger>
          <TabsTrigger value="followup">Tindak Lanjut ({notes.filter(n => ['COUNSELING_NEEDED', 'PARENT_CONTACTED'].includes(n.type)).length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredNotes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Tidak ada catatan ditemukan</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotes.map(note => (
                <Card key={note.id} className={note.resolved ? 'opacity-75' : ''}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{note.studentName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{note.studentName}</span>
                            <Badge variant="outline" className="text-xs">{note.studentNis}</Badge>
                            <Badge className={`text-xs ${NOTE_TYPE_CONFIG[note.type].color}`}>
                              <span className="flex items-center gap-1">
                                {NOTE_TYPE_CONFIG[note.type].icon}
                                {NOTE_TYPE_CONFIG[note.type].label}
                              </span>
                            </Badge>
                          </div>
                          <p className="text-sm">{note.description}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>{note.category}</span>
                            <span>•</span>
                            <span>{new Date(note.date).toLocaleDateString('id-ID')}</span>
                            {note.points && (
                              <>
                                <span>•</span>
                                <span className={note.points > 0 ? 'text-green-600' : 'text-red-600'}>
                                  {note.points > 0 ? '+' : ''}{note.points} poin
                                </span>
                              </>
                            )}
                            <span>•</span>
                            <span>oleh {note.createdBy}</span>
                          </div>
                          {note.followUp && (
                            <div className="mt-2 p-2 bg-muted rounded text-sm">
                              <strong>Tindak lanjut:</strong> {note.followUp}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {note.resolved ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Selesai
                          </Badge>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleResolve(note.id)}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Selesaikan
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDelete(note.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
